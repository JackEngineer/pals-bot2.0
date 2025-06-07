import { NextRequest, NextResponse } from "next/server";
import { userOperations, statisticsOperations } from "@/lib/prisma";
import { z } from "zod";

// 用户资料更新 schema
const UpdateProfileSchema = z.object({
  firstName: z.string().min(1, "昵称不能为空").max(32, "昵称过长").optional(),
  lastName: z.string().max(32, "姓氏过长").optional(),
  bio: z.string().max(200, "简介过长").optional(),
  avatarUrl: z.string().url("头像链接无效").optional(),
});

// 统一认证方法
async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return {
      error: { status: 401, code: "UNAUTHORIZED", message: "未提供认证信息" },
    };
  }
  const initData = authHeader.replace("Bearer ", "");
  const { verifyTelegramAuth } = await import("@/lib/telegram-auth");
  const botToken = process.env.TELEGRAM_BOT_TOKEN!;
  const validation = verifyTelegramAuth(initData, botToken);
  if (!validation.isValid || !validation.user) {
    return {
      error: {
        status: 401,
        code: "INVALID_AUTH",
        message: validation.error || "认证失败",
      },
    };
  }
  // 获取/创建用户
  const user = await userOperations.upsertByTelegramId(validation.user);
  if (!user) {
    return {
      error: { status: 404, code: "USER_NOT_FOUND", message: "用户不存在" },
    };
  }
  return { user };
}

// GET /api/user/profile
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.code,
          message: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: error.status }
      );
    }
    // 返回用户基本信息（脱敏）
    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        level: user.level,
        experience: user.experience,
        isVerified: user.isVerified,
        // 可扩展更多字段
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "获取用户资料失败",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile
export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.code,
          message: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: error.status }
      );
    }
    const body = await request.json();
    const validated = UpdateProfileSchema.parse(body);
    const updated = await userOperations.getById(user.id);
    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error: "USER_NOT_FOUND",
          message: "用户不存在",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }
    // 更新用户资料
    const prisma = (await import("@/lib/prisma")).prisma;
    const newUser = await prisma.user.update({
      where: { id: user.id },
      data: { ...validated, updatedAt: new Date() },
    });
    return NextResponse.json({
      success: true,
      data: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        username: newUser.username,
        bio: newUser.bio,
        avatarUrl: newUser.avatarUrl,
        createdAt: newUser.createdAt,
        level: newUser.level,
        experience: newUser.experience,
        isVerified: newUser.isVerified,
      },
      message: "资料更新成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          message: error.errors[0].message,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "更新用户资料失败",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET /api/user/statistics
export async function POST(request: NextRequest) {
  // 兼容 RESTful 规范，统计接口用 POST
  try {
    const { user, error } = await getAuthUser(request);
    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.code,
          message: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: error.status }
      );
    }
    const stats = await statisticsOperations.getUserStats(user.id);
    if (!stats) {
      return NextResponse.json(
        {
          success: false,
          error: "STATS_NOT_FOUND",
          message: "未找到用户统计数据",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "获取用户统计失败",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}