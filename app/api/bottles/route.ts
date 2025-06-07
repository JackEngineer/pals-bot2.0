import { NextRequest, NextResponse } from "next/server";
import { bottleOperations, userOperations } from "@/lib/prisma";
import { createBottle } from "@/lib/database/bottles";
import { z } from "zod";

// GET /api/bottles - 获取随机漂流瓶
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_USER_ID",
          message: "缺少用户ID",
        },
        { status: 400 }
      );
    }

    // 获取随机漂流瓶
    const bottle = await bottleOperations.getRandomForUser(userId);

    if (!bottle) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "暂时没有新的漂流瓶，稍后再试试吧～",
      });
    }

    // 记录用户发现了这个漂流瓶
    await bottleOperations.recordDiscovery(userId, bottle.id);

    return NextResponse.json({
      success: true,
      data: {
        id: bottle.id,
        content: bottle.content,
        mediaType: bottle.mediaType,
        mediaUrl: bottle.mediaUrl,
        bottleStyle: bottle.bottleStyle,
        createdAt: bottle.createdAt,
        author: {
          firstName: bottle.user.firstName, // 保持部分匿名
        },
        stats: {
          replies: bottle._count.replies,
          discoveries: bottle._count.discoveries,
        },
      },
    });
  } catch (error) {
    console.error("获取漂流瓶失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "服务器内部错误",
      },
      { status: 500 }
    );
  }
}

// POST /api/bottles - 创建新漂流瓶
export async function POST(request: NextRequest) {
  try {
    // // 1. 认证：从 header 获取 Telegram InitData
    // const authHeader = request.headers.get("Authorization");
    // if (!authHeader) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: "UNAUTHORIZED",
    //       message: "未提供认证信息",
    //       timestamp: new Date().toISOString(),
    //     },
    //     { status: 401 }
    //   );
    // }
    // const initData = authHeader.replace("Bearer ", "");
    // const { verifyTelegramAuth } = await import("@/lib/telegram-auth");
    // const botToken = process.env.TELEGRAM_BOT_TOKEN!;
    // const validation = verifyTelegramAuth(initData, botToken);
    // if (!validation.isValid || !validation.user) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: "INVALID_AUTH",
    //       message: validation.error || "认证失败",
    //       timestamp: new Date().toISOString(),
    //     },
    //     { status: 401 }
    //   );
    // }
    // // 2. 获取/创建用户
    // const user = await userOperations.upsertByTelegramId(validation.user);
    // if (!user) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: "USER_NOT_FOUND",
    //       message: "用户不存在",
    //       timestamp: new Date().toISOString(),
    //     },
    //     { status: 404 }
    //   );
    // }
    // 3. 解析请求体并校验
    const body = await request.json();
    // 4. 创建漂流瓶
    const bottle = await createBottle(body);
    // 5. 返回成功响应
    return NextResponse.json(
      {
        success: true,
        data: {
          id: bottle.id,
          content: bottle.content,
          mediaType: bottle.mediaType,
          mediaUrl: bottle.mediaUrl,
          bottleStyle: bottle.bottleStyle,
          createdAt: bottle.createdAt,
        },
        message: "漂流瓶投递成功！🍾",
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.log(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          message: error.errors[0].message,
          details: error.errors,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    // 统一错误响应
    console.error("创建漂流瓶失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "创建漂流瓶失败",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// 使用示例说明
/*
GET /api/bottles?userId=user123
- 获取随机漂流瓶

POST /api/bottles
{
  "userId": "user123",
  "content": "这是我的第一个漂流瓶！",
  "mediaType": "TEXT",
  "bottleStyle": {
    "color": "ocean",
    "pattern": "waves",
    "decoration": "stars"
  }
}
- 创建新漂流瓶
*/
