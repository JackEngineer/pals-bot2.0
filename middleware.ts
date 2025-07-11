import { NextRequest, NextResponse } from "next/server";

// 速率限制配置
interface RateLimitConfig {
  windowMs: number; // 时间窗口（毫秒）
  maxRequests: number; // 最大请求数
  skipSuccessful?: boolean; // 是否跳过成功请求
  message?: string; // 超限错误消息
}

// 不同端点的限制配置
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // 聊天相关API - 较宽松，用于正常聊天
  "/api/chat/conversations": {
    windowMs: 60000, // 1分钟
    maxRequests: 30, // 30次请求
    message: "聊天请求过于频繁，请稍后再试",
  },

  // 消息发送 - 中等限制
  "/api/chat/conversations/[id]/messages": {
    windowMs: 60000, // 1分钟
    maxRequests: 20, // 20条消息
    message: "消息发送过于频繁，请稍后再试",
  },

  // 会话删除 - 严格限制
  "/api/chat/conversations/[id]": {
    windowMs: 300000, // 5分钟
    maxRequests: 60, // 60次删除
    message: "操作过于频繁，请稍后再试",
  },

  // 批量状态检查 - 轮询专用，较宽松
  "/api/chat/conversations/batch-status": {
    windowMs: 60000, // 1分钟
    maxRequests: 60, // 60次请求（支持高频轮询）
    message: "状态检查请求过于频繁",
  },

  // 漂流瓶相关 - 中等限制
  "/api/bottles": {
    windowMs: 60000, // 1分钟
    maxRequests: 15, // 15次请求
    message: "漂流瓶操作过于频繁，请稍后再试",
  },

  // 认证相关 - 严格限制
  "/api/auth": {
    windowMs: 300000, // 5分钟
    maxRequests: 60, // 60次认证
    message: "认证请求过于频繁，请稍后再试",
  },

  // Ping端点 - 非常宽松（网络检测用）
  "/api/ping": {
    windowMs: 60000, // 1分钟
    maxRequests: 120, // 120次ping
    skipSuccessful: true,
    message: "Ping请求过于频繁",
  },

  // 默认限制
  default: {
    windowMs: 60000, // 1分钟
    maxRequests: 50, // 50次请求
    message: "请求过于频繁，请稍后再试",
  },
};

// 用户特殊限制（基于用户ID）
const USER_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // VIP用户可以有更高的限制
  vip: {
    windowMs: 60000,
    maxRequests: 100,
    message: "请求过于频繁（VIP）",
  },
};

// 内存存储（生产环境建议使用Redis）
class MemoryRateLimitStore {
  private ipStore = new Map<
    string,
    { requests: number[]; lastCleanup: number }
  >();
  private userStore = new Map<
    string,
    { requests: number[]; lastCleanup: number }
  >();

  // 清理过期数据
  private cleanup(
    store: Map<string, { requests: number[]; lastCleanup: number }>,
    windowMs: number
  ) {
    const now = Date.now();

    for (const [key, data] of store.entries()) {
      // 每5分钟清理一次过期数据
      if (now - data.lastCleanup > 300000) {
        data.requests = data.requests.filter(
          (timestamp) => now - timestamp < windowMs
        );
        data.lastCleanup = now;

        // 如果没有活跃请求，删除整个记录
        if (data.requests.length === 0) {
          store.delete(key);
        }
      }
    }
  }

  // 检查IP限制
  checkIPLimit(
    ip: string,
    config: RateLimitConfig
  ): { allowed: boolean; resetTime: number } {
    this.cleanup(this.ipStore, config.windowMs);

    const now = Date.now();
    const key = ip;

    if (!this.ipStore.has(key)) {
      this.ipStore.set(key, { requests: [], lastCleanup: now });
    }

    const data = this.ipStore.get(key)!;

    // 过滤时间窗口外的请求
    data.requests = data.requests.filter(
      (timestamp) => now - timestamp < config.windowMs
    );

    // 检查是否超限
    if (data.requests.length >= config.maxRequests) {
      const oldestRequest = Math.min(...data.requests);
      const resetTime = oldestRequest + config.windowMs;
      return { allowed: false, resetTime };
    }

    // 添加当前请求
    data.requests.push(now);
    return { allowed: true, resetTime: now + config.windowMs };
  }

  // 检查用户限制
  checkUserLimit(
    userId: string,
    config: RateLimitConfig
  ): { allowed: boolean; resetTime: number } {
    this.cleanup(this.userStore, config.windowMs);

    const now = Date.now();
    const key = userId;

    if (!this.userStore.has(key)) {
      this.userStore.set(key, { requests: [], lastCleanup: now });
    }

    const data = this.userStore.get(key)!;

    // 过滤时间窗口外的请求
    data.requests = data.requests.filter(
      (timestamp) => now - timestamp < config.windowMs
    );

    // 检查是否超限
    if (data.requests.length >= config.maxRequests) {
      const oldestRequest = Math.min(...data.requests);
      const resetTime = oldestRequest + config.windowMs;
      return { allowed: false, resetTime };
    }

    // 添加当前请求
    data.requests.push(now);
    return { allowed: true, resetTime: now + config.windowMs };
  }

  // 获取统计信息
  getStats() {
    return {
      ipEntries: this.ipStore.size,
      userEntries: this.userStore.size,
      timestamp: Date.now(),
    };
  }
}

const rateLimitStore = new MemoryRateLimitStore();

// IP地址验证辅助函数
function isValidIP(ip: string): boolean {
  // IPv4正则表达式
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // IPv6正则表达式（简化版）
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

  // 检查是否为有效IP
  if (ipv4Regex.test(ip) || ipv6Regex.test(ip)) {
    // 在开发环境中接受私有IP和本地IP
    if (
      ip.startsWith("192.168.") ||
      ip.startsWith("10.") ||
      ip.startsWith("172.") ||
      ip === "127.0.0.1" ||
      ip === "::1"
    ) {
      return process.env.NODE_ENV === "development";
    }
    return true;
  }

  return false;
}

// 获取客户端IP - 改进版本
function getClientIP(request: NextRequest): string {
  // 在开发环境中记录调试信息
  if (process.env.NODE_ENV === "development") {
    console.log("=== IP调试信息 ===");
    console.log("所有相关头部:", {
      "x-forwarded-for": request.headers.get("x-forwarded-for"),
      "x-real-ip": request.headers.get("x-real-ip"),
      "x-client-ip": request.headers.get("x-client-ip"),
      "cf-connecting-ip": request.headers.get("cf-connecting-ip"),
      "true-client-ip": request.headers.get("true-client-ip"),
      "remote-addr": request.headers.get("remote-addr"),
    });
    console.log("request.ip:", (request as any).ip);
    console.log("request.geo:", (request as any).geo);
    console.log("==================");
  }

  // 尝试多种可能的IP头部（按优先级排序）
  const headers = [
    "x-forwarded-for",
    "x-real-ip",
    "x-client-ip",
    "cf-connecting-ip", // Cloudflare
    "true-client-ip", // Cloudflare
    "x-forwarded",
    "forwarded-for",
    "forwarded",
    "x-cluster-client-ip",
    "remote-addr",
    "x-original-forwarded-for",
  ];

  // 按优先级检查头部
  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // 处理多个IP的情况（取第一个非私有IP）
      const ips = value.split(",").map((ip) => ip.trim());

      for (const ip of ips) {
        if (isValidIP(ip)) {
          return ip;
        }
      }
    }
  }

  // 尝试从Next.js的连接信息获取
  try {
    const ip = (request as any).ip;
    if (ip && isValidIP(ip)) {
      return ip;
    }
  } catch {
    // 忽略错误
  }

  // 开发环境特殊处理
  if (process.env.NODE_ENV === "development") {
    return "127.0.0.1";
  }

  // 尝试从geo信息获取（Vercel Edge Runtime）
  try {
    const geo = (request as any).geo;
    if (geo?.city) {
      // 如果有地理信息但没有IP，使用地理信息作为标识
      return `geo:${geo.city}:${geo.country}`;
    }
  } catch {
    // 忽略错误
  }

  // 使用用户ID作为备选标识
  const userId = getUserId(request);
  if (userId) {
    return `user:${userId}`;
  }

  // 最后的备选方案：使用User-Agent的hash
  const userAgent = request.headers.get("user-agent") || "";
  if (userAgent) {
    const hash = Buffer.from(userAgent).toString("base64").slice(0, 16);
    return `ua:${hash}`;
  }

  return "unknown";
}

// 获取用户ID（从认证头中提取）- 改进版本
function getUserId(request: NextRequest): string | null {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) return null;

    const initData = authHeader.replace("Bearer ", "");
    if (!initData) return null;

    // 尝试解析 Telegram InitData
    try {
      const params = new URLSearchParams(initData);
      const userString = params.get("user");

      if (userString) {
        const user = JSON.parse(userString);
        if (user.id) {
          return user.id.toString();
        }
      }
    } catch (parseError) {
      // 如果解析失败，继续使用备选方案
      console.warn("解析Telegram InitData失败:", parseError);
    }

    // 备选方案：使用initData的hash作为标识
    const userId = Buffer.from(initData).toString("base64").slice(0, 16);
    return userId;
  } catch {
    return null;
  }
}

// 匹配路径配置
function getConfigForPath(pathname: string): RateLimitConfig {
  // 精确匹配
  if (RATE_LIMIT_CONFIGS[pathname]) {
    return RATE_LIMIT_CONFIGS[pathname];
  }

  // 模式匹配
  for (const [pattern, config] of Object.entries(RATE_LIMIT_CONFIGS)) {
    if (pattern.includes("[") && matchesPattern(pathname, pattern)) {
      return config;
    }
  }

  return RATE_LIMIT_CONFIGS["default"];
}

// 简单的路径模式匹配
function matchesPattern(pathname: string, pattern: string): boolean {
  const patternParts = pattern.split("/");
  const pathParts = pathname.split("/");

  if (patternParts.length !== pathParts.length) {
    return false;
  }

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    // 跳过动态参数
    if (patternPart.startsWith("[") && patternPart.endsWith("]")) {
      continue;
    }

    if (patternPart !== pathPart) {
      return false;
    }
  }

  return true;
}

// 检查是否为可疑请求
function detectSuspiciousActivity(request: NextRequest, ip: string): boolean {
  const userAgent = request.headers.get("user-agent") || "";
  const referer = request.headers.get("referer") || "";

  // 检查恶意User-Agent
  const suspiciousAgents = ["bot", "crawler", "spider", "scraper"];
  if (
    suspiciousAgents.some((agent) => userAgent.toLowerCase().includes(agent))
  ) {
    return true;
  }

  // 检查是否缺少常见的浏览器头
  if (!userAgent || userAgent.length < 10) {
    return true;
  }

  // 检查请求频率异常（这里简化处理）
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 跳过非API请求
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 跳过静态资源和特殊路径
  if (pathname.includes("/_next/") || pathname.includes("/favicon.ico")) {
    return NextResponse.next();
  }

  const ip = getClientIP(request);
  const userId = getUserId(request);
  const config = getConfigForPath(pathname);
  const method = request.method;

  // 在开发环境中记录详细的请求信息
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[中间件] ${method} ${pathname} - IP: ${ip}, User: ${
        userId || "anonymous"
      }`
    );
  }

  // 只对写操作和高频操作进行限制
  const limitedMethods = ["POST", "PUT", "DELETE", "PATCH"];
  const isLimitedMethod = limitedMethods.includes(method);
  const isPollingEndpoint =
    pathname.includes("batch-status") || pathname.includes("ping");

  if (!isLimitedMethod && !isPollingEndpoint) {
    return NextResponse.next();
  }

  try {
    // 检查可疑活动
    if (detectSuspiciousActivity(request, ip)) {
      console.warn(
        `可疑请求检测: IP=${ip}, Path=${pathname}, UserAgent=${request.headers.get(
          "user-agent"
        )}`
      );

      return NextResponse.json(
        {
          success: false,
          error: "SUSPICIOUS_ACTIVITY",
          message: "检测到异常请求模式",
          timestamp: new Date().toISOString(),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": config.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": Math.ceil(
              Date.now() / 1000 + config.windowMs / 1000
            ).toString(),
            "Retry-After": Math.ceil(config.windowMs / 1000).toString(),
          },
        }
      );
    }

    // IP限制检查
    const ipResult = rateLimitStore.checkIPLimit(ip, config);
    if (!ipResult.allowed) {
      const retryAfter = Math.ceil((ipResult.resetTime - Date.now()) / 1000);

      console.warn(
        `IP频率限制触发: IP=${ip}, Path=${pathname}, Method=${method}`
      );

      return NextResponse.json(
        {
          success: false,
          error: "RATE_LIMIT_EXCEEDED",
          message: config.message || "请求过于频繁，请稍后再试",
          timestamp: new Date().toISOString(),
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": config.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": Math.ceil(
              ipResult.resetTime / 1000
            ).toString(),
            "Retry-After": retryAfter.toString(),
          },
        }
      );
    }

    // 用户限制检查（如果有用户ID）
    if (userId) {
      const userConfig = USER_RATE_LIMITS["vip"] || config; // 简化处理，实际需要查用户等级
      const userResult = rateLimitStore.checkUserLimit(userId, userConfig);

      if (!userResult.allowed) {
        const retryAfter = Math.ceil(
          (userResult.resetTime - Date.now()) / 1000
        );

        console.warn(
          `用户频率限制触发: User=${userId}, Path=${pathname}, Method=${method}, IP=${ip}`
        );

        return NextResponse.json(
          {
            success: false,
            error: "USER_RATE_LIMIT_EXCEEDED",
            message: "用户请求过于频繁，请稍后再试",
            timestamp: new Date().toISOString(),
            retryAfter,
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": userConfig.maxRequests.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": Math.ceil(
                userResult.resetTime / 1000
              ).toString(),
              "Retry-After": retryAfter.toString(),
            },
          }
        );
      }
    }

    // 添加速率限制头部信息
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", config.maxRequests.toString());
    response.headers.set("X-RateLimit-Window", config.windowMs.toString());
    response.headers.set("X-Client-IP", ip);

    if (userId) {
      response.headers.set("X-User-ID", userId);
    }

    return response;
  } catch (error) {
    console.error("中间件执行错误:", error);

    // 出错时允许请求通过，但记录错误
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // 匹配所有 API 路由
    "/api/(.*)",
    // 排除 Next.js 内部路由
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
