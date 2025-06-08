import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/chat/random - 随机匹配陌生人聊天
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

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

    // 查找一个在线且愿意聊天的随机用户（排除自己）
    // 这里简化处理，随机选择一个其他用户
    const randomUsers = await prisma.user.findMany({
      where: {
        id: { not: userId },
        isActive: true,
        // 可以添加更多筛选条件，比如用户设置中允许随机聊天
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        avatarUrl: true,
      },
      take: 20, // 先取20个候选用户
    });

    if (randomUsers.length === 0) {
      return NextResponse.json({
        success: false,
        error: "NO_AVAILABLE_USERS",
        message: "暂时没有可聊天的用户，稍后再试试吧～",
      });
    }

    // 随机选择一个用户
    const randomIndex = Math.floor(Math.random() * randomUsers.length);
    const targetUser = randomUsers[randomIndex];

    // 检查是否已存在会话
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: targetUser.id },
          { user1Id: targetUser.id, user2Id: userId },
        ],
      },
      include: {
        user1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatarUrl: true,
          },
        },
        user2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!conversation) {
      // 创建新会话
      conversation = await prisma.conversation.create({
        data: {
          user1Id: userId,
          user2Id: targetUser.id,
          isActive: true,
        },
        include: {
          user1: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatarUrl: true,
            },
          },
          user2: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });
    }

    const otherUser =
      conversation.user1Id === userId ? conversation.user2 : conversation.user1;

    return NextResponse.json({
      success: true,
      data: {
        id: conversation.id,
        otherUser,
        createdAt: conversation.createdAt,
      },
      message: "找到了一个陌生朋友！开始聊天吧～",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("随机匹配失败:", error);
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
