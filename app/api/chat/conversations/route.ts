import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatConversation } from "./utils/util";

export const dynamic = "force-dynamic";

// GET /api/chat/conversations - 获取用户的所有会话
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
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

    // 获取所有相关的会话
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
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
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            mediaType: true,
            createdAt: true,
            isRead: true,
            senderId: true,
          },
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    // 格式化会话数据
    const formattedConversations = conversations.map((conv) => {
      return formatConversation(conv, userId);
    });

    return NextResponse.json({
      success: true,
      data: formattedConversations,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("获取会话列表失败:", error);
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

// POST /api/chat/conversations - 创建新会话
export async function POST(request: NextRequest) {
  try {
    const { userId, targetUserId, bottleContext } = await request.json();

    if (!userId || !targetUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_REQUIRED_FIELDS",
          message: "缺少必要字段",
        },
        { status: 400 }
      );
    }

    // 检查目标用户是否存在
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          error: "TARGET_USER_NOT_FOUND",
          message: "目标用户不存在",
        },
        { status: 404 }
      );
    }

    // 检查是否已存在会话
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: userId },
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
          user2Id: targetUserId,
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

      // 如果有瓶子上下文，创建系统消息显示瓶子内容
      if (bottleContext) {
        await prisma.message.create({
          data: {
            content: `🍾 关于漂流瓶：\n\n"${bottleContext.content}"\n\n来自：匿名用户
            }`,
            mediaType: "TEXT",
            messageType: "SYSTEM",
            senderId: userId, // 发起聊天的人
            receiverId: targetUserId,
            conversationId: conversation.id,
            isRead: false,
          },
        });

        // 更新会话的最后消息时间
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageAt: new Date(),
          },
        });
      }
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
      message: "会话创建成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("创建会话失败:", error);
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
