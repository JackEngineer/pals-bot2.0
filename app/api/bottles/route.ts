import { NextRequest, NextResponse } from "next/server";
import { bottleOperations, userOperations } from "@/lib/prisma";
import { z } from "zod";

// 创建漂流瓶的请求体验证 schema
const CreateBottleSchema = z.object({
  content: z.string().min(1, "内容不能为空").max(1000, "内容不能超过1000字符"),
  mediaType: z.enum(["TEXT", "IMAGE", "AUDIO"]).optional().default("TEXT"),
  mediaUrl: z.string().url().optional(),
  bottleStyle: z
    .object({
      color: z.string(),
      pattern: z.string(),
      decoration: z.string(),
    })
    .optional(),
});

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
    const body = await request.json();

    // 验证请求体
    const validatedData = CreateBottleSchema.parse(body);

    // 这里应该从认证中间件获取用户ID
    // 为了演示，我们从请求体中获取
    const { userId, ...bottleData } = body;

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

    // 验证用户是否存在
    const user = await userOperations.getById(userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "USER_NOT_FOUND",
          message: "用户不存在",
        },
        { status: 404 }
      );
    }

    // 创建漂流瓶
    const bottle = await bottleOperations.create({
      ...validatedData,
      userId,
    });

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
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          message: error.errors[0].message,
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("创建漂流瓶失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "创建漂流瓶失败",
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
