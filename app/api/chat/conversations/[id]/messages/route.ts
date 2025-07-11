import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface Context {
  params: {
    id: string;
  };
}

// GET /api/chat/conversations/[id]/messages - 获取会话的消息列表
export async function GET(request: NextRequest, { params }: Context) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const conversationId = params.id;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_USER_ID",
          message: "缺少用户ID",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 验证用户是否有权限访问此会话，同时获取会话状态信息
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      select: {
        id: true,
        user1Id: true,
        user2Id: true,
        lastMessageAt: true,
        updatedAt: true,
        isActive: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        {
          success: false,
          error: "CONVERSATION_NOT_FOUND",
          message: "会话不存在或无权限访问",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // 获取分页参数
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // 增量查询参数
    const after = searchParams.get("after"); // 时间戳，获取此时间之后的新消息

    // 构建查询条件
    const whereClause: any = {
      conversationId,
    };

    // 如果有after参数，只查询该时间之后的消息
    if (after) {
      whereClause.createdAt = {
        gt: new Date(after),
      };
    }

    // 获取消息列表
    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: after ? 0 : skip, // 增量查询时不使用分页
      take: after ? 100 : limit, // 增量查询时限制最多100条新消息
    });

    // 标记收到的消息为已读
    await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        messages: messages.reverse(), // 反转以时间正序显示
        pagination: {
          page,
          limit,
          hasMore: after ? false : messages.length === limit, // 增量查询时不需要分页信息
        },
        currentUserId: userId,
        // 会话状态信息（用于轮询检查）
        conversationStatus: {
          exists: true,
          isActive: conversation.isActive,
          lastMessageAt: conversation.lastMessageAt,
          lastUpdatedAt: conversation.updatedAt,
        },
        // 增量查询标识
        isIncrementalQuery: !!after,
        queryAfter: after,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("获取消息列表失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "服务器内部错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POST /api/chat/conversations/[id]/messages - 发送消息
export async function POST(request: NextRequest, { params }: Context) {
  try {
    const conversationId = params.id;
    const {
      userId,
      content,
      mediaType = "TEXT",
      mediaUrl,
    } = await request.json();

    // 验证消息内容
    if (!content?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "EMPTY_CONTENT",
          message: "消息内容不能为空",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_USER_ID",
          message: "缺少用户ID",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 验证用户是否有权限在此会话中发送消息
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      select: {
        id: true,
        user1Id: true,
        user2Id: true,
        isActive: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        {
          success: false,
          error: "CONVERSATION_NOT_FOUND",
          message: "会话不存在或无权限访问",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // 确定接收者
    const receiverId =
      conversation.user1Id === userId
        ? conversation.user2Id
        : conversation.user1Id;

    // 创建消息
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        mediaType,
        mediaUrl,
        senderId: userId,
        receiverId,
        conversationId,
        messageType: "DIRECT",
      },
      include: {
        sender: {
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

    // 更新会话的最后消息时间
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessageId: message.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: message,
      message: "消息发送成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("发送消息失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "服务器内部错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
