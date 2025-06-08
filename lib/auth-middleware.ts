"use client";

import { NextRequest, NextResponse } from "next/server";
import { validateTelegramInitData } from "./telegram-auth";

// 权限等级枚举
export enum PermissionLevel {
  PUBLIC = 0, // 公开访问
  AUTHENTICATED = 1, // 需要认证
  PARTICIPANT = 2, // 需要是参与者
  OWNER = 3, // 需要是所有者
  ADMIN = 4, // 需要管理员权限
}

// 操作类型枚举
export enum OperationType {
  READ = "read",
  WRITE = "write",
  DELETE = "delete",
  ADMIN = "admin",
}

// 权限规则配置
interface PermissionRule {
  level: PermissionLevel;
  operations: OperationType[];
  description: string;
  checkParticipant?: boolean; // 是否检查参与者身份
  checkOwnership?: boolean; // 是否检查所有权
  allowSelfAccess?: boolean; // 是否允许访问自己的资源
}

// API路径权限配置
const API_PERMISSIONS: Record<string, Record<string, PermissionRule>> = {
  // 聊天会话相关
  "/api/chat/conversations": {
    GET: {
      level: PermissionLevel.AUTHENTICATED,
      operations: [OperationType.READ],
      description: "获取用户会话列表",
      allowSelfAccess: true,
    },
    POST: {
      level: PermissionLevel.AUTHENTICATED,
      operations: [OperationType.WRITE],
      description: "创建新会话",
    },
  },

  "/api/chat/conversations/[id]": {
    GET: {
      level: PermissionLevel.PARTICIPANT,
      operations: [OperationType.READ],
      description: "获取会话详情",
      checkParticipant: true,
    },
    PUT: {
      level: PermissionLevel.PARTICIPANT,
      operations: [OperationType.WRITE],
      description: "更新会话",
      checkParticipant: true,
    },
    DELETE: {
      level: PermissionLevel.PARTICIPANT,
      operations: [OperationType.DELETE],
      description: "删除会话",
      checkParticipant: true,
    },
  },

  "/api/chat/conversations/[id]/messages": {
    GET: {
      level: PermissionLevel.PARTICIPANT,
      operations: [OperationType.READ],
      description: "获取消息列表",
      checkParticipant: true,
    },
    POST: {
      level: PermissionLevel.PARTICIPANT,
      operations: [OperationType.WRITE],
      description: "发送消息",
      checkParticipant: true,
    },
  },

  "/api/chat/conversations/batch-status": {
    GET: {
      level: PermissionLevel.AUTHENTICATED,
      operations: [OperationType.READ],
      description: "批量获取会话状态",
    },
    POST: {
      level: PermissionLevel.AUTHENTICATED,
      operations: [OperationType.READ],
      description: "批量检查会话状态",
    },
  },

  // 漂流瓶相关
  "/api/bottles": {
    GET: {
      level: PermissionLevel.AUTHENTICATED,
      operations: [OperationType.READ],
      description: "获取漂流瓶",
    },
    POST: {
      level: PermissionLevel.AUTHENTICATED,
      operations: [OperationType.WRITE],
      description: "投递漂流瓶",
    },
  },

  "/api/bottles/[id]/reply": {
    POST: {
      level: PermissionLevel.AUTHENTICATED,
      operations: [OperationType.WRITE],
      description: "回复漂流瓶",
    },
  },

  // 用户相关
  "/api/user/profile": {
    GET: {
      level: PermissionLevel.AUTHENTICATED,
      operations: [OperationType.READ],
      description: "获取用户资料",
      allowSelfAccess: true,
    },
    PUT: {
      level: PermissionLevel.AUTHENTICATED,
      operations: [OperationType.WRITE],
      description: "更新用户资料",
      allowSelfAccess: true,
    },
  },

  // 认证相关
  "/api/auth/telegram": {
    POST: {
      level: PermissionLevel.PUBLIC,
      operations: [OperationType.WRITE],
      description: "Telegram认证",
    },
  },

  // 管理员相关
  "/api/admin": {
    GET: {
      level: PermissionLevel.ADMIN,
      operations: [OperationType.ADMIN],
      description: "管理员面板",
    },
  },
};

// 认证结果接口
export interface AuthResult {
  isValid: boolean;
  user?: {
    telegramId: number;
    firstName: string;
    lastName?: string;
    username?: string;
    isAdmin?: boolean;
  };
  error?: string;
  timestamp: number;
}

// 权限检查结果接口
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  requiredLevel: PermissionLevel;
  userLevel: PermissionLevel;
  operation: OperationType;
}

// 异常访问模式检测
interface AccessPattern {
  ip: string;
  userId?: string;
  timestamps: number[];
  suspiciousCount: number;
  blockedUntil?: number;
}

class SecurityManager {
  private accessPatterns = new Map<string, AccessPattern>();
  private blockedIPs = new Set<string>();
  private adminUsers = new Set<number>([
    // 这里配置管理员用户的Telegram ID
    // 示例：123456789
  ]);

  // 验证Telegram认证
  async verifyTelegramAuth(request: NextRequest): Promise<AuthResult> {
    try {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader) {
        return {
          isValid: false,
          error: "MISSING_AUTH_HEADER",
          timestamp: Date.now(),
        };
      }

      const initData = authHeader.replace("Bearer ", "");
      const validation = validateTelegramInitData(
        initData,
        process.env.TELEGRAM_BOT_TOKEN!
      );

      if (!validation.isValid) {
        return {
          isValid: false,
          error: validation.error || "INVALID_TELEGRAM_AUTH",
          timestamp: Date.now(),
        };
      }

      const user = validation.data.user;
      return {
        isValid: true,
        user: {
          telegramId: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          username: user.username,
          isAdmin: this.adminUsers.has(user.id),
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("认证验证失败:", error);
      return {
        isValid: false,
        error: "AUTH_VERIFICATION_FAILED",
        timestamp: Date.now(),
      };
    }
  }

  // 检查用户权限等级
  getUserPermissionLevel(user?: AuthResult["user"]): PermissionLevel {
    if (!user) return PermissionLevel.PUBLIC;
    if (user.isAdmin) return PermissionLevel.ADMIN;
    return PermissionLevel.AUTHENTICATED;
  }

  // 检查是否为会话参与者
  async checkConversationParticipant(
    conversationId: string,
    telegramId: number
  ): Promise<boolean> {
    try {
      // 这里需要查询数据库检查用户是否为会话参与者
      // 为了演示，我们假设检查逻辑
      console.log(
        `检查用户 ${telegramId} 是否为会话 ${conversationId} 的参与者`
      );

      // 实际实现中需要查询数据库
      // const conversation = await prisma.conversation.findFirst({
      //   where: {
      //     id: conversationId,
      //     OR: [
      //       { user1TelegramId: telegramId },
      //       { user2TelegramId: telegramId },
      //     ],
      //   },
      // });
      // return !!conversation;

      return true; // 暂时返回true，实际需要数据库查询
    } catch (error) {
      console.error("检查会话参与者失败:", error);
      return false;
    }
  }

  // 检查资源所有权
  async checkResourceOwnership(
    resourceType: string,
    resourceId: string,
    telegramId: number
  ): Promise<boolean> {
    try {
      console.log(
        `检查用户 ${telegramId} 对 ${resourceType}:${resourceId} 的所有权`
      );

      // 实际实现中需要根据资源类型查询相应的表
      // switch (resourceType) {
      //   case 'bottle':
      //     const bottle = await prisma.bottle.findFirst({
      //       where: { id: resourceId, userId: telegramId },
      //     });
      //     return !!bottle;
      //
      //   case 'user':
      //     return resourceId === telegramId.toString();
      //
      //   default:
      //     return false;
      // }

      return true; // 暂时返回true，实际需要数据库查询
    } catch (error) {
      console.error("检查资源所有权失败:", error);
      return false;
    }
  }

  // 记录访问模式
  recordAccess(ip: string, userId?: string, pathname?: string): void {
    const key = userId || ip;
    const now = Date.now();

    if (!this.accessPatterns.has(key)) {
      this.accessPatterns.set(key, {
        ip,
        userId,
        timestamps: [],
        suspiciousCount: 0,
      });
    }

    const pattern = this.accessPatterns.get(key)!;
    pattern.timestamps.push(now);

    // 保留最近5分钟的访问记录
    pattern.timestamps = pattern.timestamps.filter(
      (timestamp) => now - timestamp < 300000
    );

    // 检测异常模式
    this.detectSuspiciousPattern(pattern, pathname);
  }

  // 检测可疑访问模式
  private detectSuspiciousPattern(
    pattern: AccessPattern,
    pathname?: string
  ): void {
    const now = Date.now();
    const recentAccess = pattern.timestamps.filter(
      (timestamp) => now - timestamp < 60000 // 最近1分钟
    );

    // 检测高频访问
    if (recentAccess.length > 100) {
      pattern.suspiciousCount++;
      console.warn(`检测到高频访问: ${pattern.ip}, 用户: ${pattern.userId}`);
    }

    // 检测异常路径访问
    if (pathname?.includes("/admin") && !pattern.userId) {
      pattern.suspiciousCount++;
      console.warn(`检测到未认证用户访问管理员路径: ${pattern.ip}`);
    }

    // 累计可疑行为超过阈值时临时封锁
    if (pattern.suspiciousCount > 5) {
      pattern.blockedUntil = now + 600000; // 封锁10分钟
      this.blockedIPs.add(pattern.ip);
      console.warn(
        `临时封锁IP: ${pattern.ip}, 解除时间: ${new Date(pattern.blockedUntil)}`
      );
    }
  }

  // 检查IP是否被封锁
  isIPBlocked(ip: string): boolean {
    const pattern = this.accessPatterns.get(ip);
    if (pattern?.blockedUntil && Date.now() < pattern.blockedUntil) {
      return true;
    }

    // 清理过期的封锁
    if (pattern?.blockedUntil && Date.now() >= pattern.blockedUntil) {
      delete pattern.blockedUntil;
      this.blockedIPs.delete(ip);
    }

    return false;
  }

  // 获取安全统计
  getSecurityStats() {
    const now = Date.now();
    let activePatterns = 0;
    let blockedIPs = 0;
    let recentAccess = 0;

    for (const pattern of this.accessPatterns.values()) {
      if (pattern.timestamps.some((t) => now - t < 300000)) {
        activePatterns++;
      }
      if (pattern.blockedUntil && now < pattern.blockedUntil) {
        blockedIPs++;
      }
      recentAccess += pattern.timestamps.filter((t) => now - t < 60000).length;
    }

    return {
      activePatterns,
      blockedIPs,
      recentAccess,
      totalPatterns: this.accessPatterns.size,
      timestamp: now,
    };
  }
}

// 全局安全管理器实例
const securityManager = new SecurityManager();

// 获取路径权限配置
function getPermissionRule(
  pathname: string,
  method: string
): PermissionRule | null {
  // 精确匹配
  const exactConfig = API_PERMISSIONS[pathname];
  if (exactConfig?.[method]) {
    return exactConfig[method];
  }

  // 模式匹配
  for (const [pattern, methods] of Object.entries(API_PERMISSIONS)) {
    if (pattern.includes("[") && matchesPattern(pathname, pattern)) {
      if (methods[method]) {
        return methods[method];
      }
    }
  }

  return null;
}

// 路径模式匹配（复用middleware.ts中的函数）
function matchesPattern(pathname: string, pattern: string): boolean {
  const patternParts = pattern.split("/");
  const pathParts = pathname.split("/");

  if (patternParts.length !== pathParts.length) {
    return false;
  }

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith("[") && patternPart.endsWith("]")) {
      continue;
    }

    if (patternPart !== pathPart) {
      return false;
    }
  }

  return true;
}

// 提取路径参数
function extractPathParams(
  pathname: string,
  pattern: string
): Record<string, string> {
  const patternParts = pattern.split("/");
  const pathParts = pathname.split("/");
  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith("[") && patternPart.endsWith("]")) {
      const paramName = patternPart.slice(1, -1);
      params[paramName] = pathPart;
    }
  }

  return params;
}

// 主要的权限验证函数
export async function verifyPermissions(
  request: NextRequest,
  pathname: string
): Promise<PermissionCheckResult | NextResponse> {
  const method = request.method;
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  try {
    // 检查IP是否被封锁
    if (securityManager.isIPBlocked(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: "IP_BLOCKED",
          message: "您的IP已被临时封锁，请稍后再试",
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    // 获取权限规则
    const rule = getPermissionRule(pathname, method);
    if (!rule) {
      // 没有配置权限规则的路径默认允许访问
      return {
        allowed: true,
        requiredLevel: PermissionLevel.PUBLIC,
        userLevel: PermissionLevel.PUBLIC,
        operation: OperationType.READ,
      };
    }

    // 验证认证
    const authResult = await securityManager.verifyTelegramAuth(request);
    const userLevel = securityManager.getUserPermissionLevel(authResult.user);

    // 记录访问模式
    securityManager.recordAccess(
      ip,
      authResult.user?.telegramId.toString(),
      pathname
    );

    // 检查基础权限等级
    if (userLevel < rule.level) {
      return NextResponse.json(
        {
          success: false,
          error: "INSUFFICIENT_PERMISSIONS",
          message: "权限不足",
          requiredLevel: PermissionLevel[rule.level],
          userLevel: PermissionLevel[userLevel],
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    // 检查参与者身份
    if (rule.checkParticipant && authResult.user) {
      const pathParams = extractPathParams(
        pathname,
        Object.keys(API_PERMISSIONS).find((p) => matchesPattern(pathname, p)) ||
          ""
      );
      const conversationId = pathParams.id;

      if (conversationId) {
        const isParticipant =
          await securityManager.checkConversationParticipant(
            conversationId,
            authResult.user.telegramId
          );

        if (!isParticipant) {
          return NextResponse.json(
            {
              success: false,
              error: "NOT_PARTICIPANT",
              message: "您不是此会话的参与者",
              timestamp: new Date().toISOString(),
            },
            { status: 403 }
          );
        }
      }
    }

    // 检查资源所有权
    if (rule.checkOwnership && authResult.user) {
      const pathParams = extractPathParams(
        pathname,
        Object.keys(API_PERMISSIONS).find((p) => matchesPattern(pathname, p)) ||
          ""
      );
      const resourceId = pathParams.id;

      if (resourceId) {
        const resourceType = pathname.includes("/bottles")
          ? "bottle"
          : pathname.includes("/user")
          ? "user"
          : "unknown";

        const isOwner = await securityManager.checkResourceOwnership(
          resourceType,
          resourceId,
          authResult.user.telegramId
        );

        if (!isOwner) {
          return NextResponse.json(
            {
              success: false,
              error: "NOT_OWNER",
              message: "您不是此资源的所有者",
              timestamp: new Date().toISOString(),
            },
            { status: 403 }
          );
        }
      }
    }

    return {
      allowed: true,
      requiredLevel: rule.level,
      userLevel,
      operation: rule.operations[0],
    };
  } catch (error) {
    console.error("权限验证失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "PERMISSION_CHECK_FAILED",
        message: "权限验证失败",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// 导出安全管理器实例（用于其他模块）
export { securityManager };

// 导出权限等级和操作类型（用于其他模块）
export { PermissionLevel, OperationType };
