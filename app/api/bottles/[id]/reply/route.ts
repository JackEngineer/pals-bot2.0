import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Context {
  params: {
    id: string;
  };
}

// POST /api/bottles/[id]/reply - 回复漂流瓶
export async function POST(request: NextRequest, { params }: Context) {
  try {
    const bottleId = params.id;
    const { userId, content } = await request.json();

    // 验证参数
    if (!userId || !content?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_REQUIRED_FIELDS",
          message: "缺少必要字段",
        },
        { status: 400 }
      );
    }

    // 检查漂流瓶是否存在
    const bottle = await prisma.bottle.findUnique({
      where: { id: bottleId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!bottle) {
      return NextResponse.json(
        {
          success: false,
          error: "BOTTLE_NOT_FOUND",
          message: "漂流瓶不存在",
        },
        { status: 404 }
      );
    }

    // 防止用户回复自己的漂流瓶
    if (bottle.userId === userId) {
      return NextResponse.json(
        {
          success: false,
          error: "CANNOT_REPLY_OWN_BOTTLE",
          message: "不能回复自己的漂流瓶",
        },
        { status: 400 }
      );
    }

    // 创建回复
    const reply = await prisma.reply.create({
      data: {
        content: content.trim(),
        userId,
        bottleId,
        mediaType: "TEXT",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // 更新漂流瓶回复数量
    await prisma.bottle.update({
      where: { id: bottleId },
      data: {
        replyCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt,
        author: {
          firstName: reply.user.firstName,
          lastName: reply.user.lastName,
        },
      },
      message: "回复发送成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("回复漂流瓶失败:", error);
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
