import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { verifyTelegramAuth } from "@/lib/telegram-auth";

// 批量状态查询请求体验证schema
const BatchStatusSchema = z.object({
  conversationIds: z.array(z.string().uuid()).min(1).max(20), // 最多20个会话
});

// 单个会话状态接口
interface ConversationStatus {
  id: string;
  exists: boolean;
  isActive: boolean;
  lastActivityAt: string | null;
  participantCount: number;
  hasUnreadMessages: boolean;
  lastMessageAt: string | null;
}

// 批量状态响应接口
interface BatchStatusResponse {
  success: boolean;
  data: {
    conversations: ConversationStatus[];
    requestedCount: number;
    foundCount: number;
    timestamp: string;
  };
}

/**
 * 批量检查会话状态
 * POST /api/chat/conversations/batch-status
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          error: "UNAUTHORIZED",
          message: "缺少认证信息",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const initData = authHeader.replace("Bearer ", "");
    const validation = verifyTelegramAuth(
      initData,
      process.env.TELEGRAM_BOT_TOKEN!
    );

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_AUTH",
          message: "认证信息无效",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const telegramUser = validation.user!;

    // 验证请求体
    const body = await request.json();
    const validatedData = BatchStatusSchema.parse(body);
    const { conversationIds } = validatedData;

    // 批量查询会话信息
    const conversations = await prisma.conversation.findMany({
      where: {
        id: {
          in: conversationIds,
        },
      },
      select: {
        id: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        user1Id: true,
        user2Id: true,
        messages: {
          select: {
            id: true,
            createdAt: true,
            isRead: true,
            senderId: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1, // 只取最新的一条消息
        },
      },
    });

    // 构建状态响应
    const conversationStatuses: ConversationStatus[] = conversationIds.map(
      (id) => {
        const conversation = conversations.find((conv) => conv.id === id);

        if (!conversation) {
          return {
            id,
            exists: false,
            isActive: false,
            lastActivityAt: null,
            participantCount: 0,
            hasUnreadMessages: false,
            lastMessageAt: null,
          };
        }

        const lastMessage = conversation.messages[0];
        const hasUnreadMessages = lastMessage
          ? !lastMessage.isRead &&
            lastMessage.senderId !== telegramUser.id.toString()
          : false;

        return {
          id: conversation.id,
          exists: true,
          isActive: conversation.isActive,
          lastActivityAt: conversation.updatedAt.toISOString(),
          participantCount: 2, // 始终是2个参与者
          hasUnreadMessages,
          lastMessageAt: lastMessage
            ? lastMessage.createdAt.toISOString()
            : null,
        };
      }
    );

    const response: BatchStatusResponse = {
      success: true,
      data: {
        conversations: conversationStatuses,
        requestedCount: conversationIds.length,
        foundCount: conversations.length,
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    console.error("批量状态查询错误:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          message: `请求参数错误: ${error.errors[0].message}`,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

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

/**
 * 获取用户的所有活跃会话状态（无需请求体）
 * GET /api/chat/conversations/batch-status
 */
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          error: "UNAUTHORIZED",
          message: "缺少认证信息",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const initData = authHeader.replace("Bearer ", "");
    const validation = verifyTelegramAuth(
      initData,
      process.env.TELEGRAM_BOT_TOKEN!
    );

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_AUTH",
          message: "认证信息无效",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const telegramUser = validation.user!;

    // 查询用户的所有活跃会话
    const conversations = await prisma.conversation.findMany({
      where: {
        isActive: true,
        OR: [
          { user1Id: telegramUser.id.toString() },
          { user2Id: telegramUser.id.toString() },
        ],
      },
      select: {
        id: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        user1Id: true,
        user2Id: true,
        messages: {
          select: {
            id: true,
            createdAt: true,
            isRead: true,
            senderId: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // 构建状态响应
    const conversationStatuses: ConversationStatus[] = conversations.map(
      (conversation) => {
        const lastMessage = conversation.messages[0];
        const hasUnreadMessages = lastMessage
          ? !lastMessage.isRead &&
            lastMessage.senderId !== telegramUser.id.toString()
          : false;

        return {
          id: conversation.id,
          exists: true,
          isActive: conversation.isActive,
          lastActivityAt: conversation.updatedAt.toISOString(),
          participantCount: 2,
          hasUnreadMessages,
          lastMessageAt: lastMessage
            ? lastMessage.createdAt.toISOString()
            : null,
        };
      }
    );

    const response: BatchStatusResponse = {
      success: true,
      data: {
        conversations: conversationStatuses,
        requestedCount: conversations.length,
        foundCount: conversations.length,
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    console.error("获取用户会话状态错误:", error);

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
