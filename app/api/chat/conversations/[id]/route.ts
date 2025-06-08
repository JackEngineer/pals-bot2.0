import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Context {
  params: {
    id: string;
  };
}

// DELETE /api/chat/conversations/[id] - 删除会话（事务优化版本）
export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const conversationId = params.id;

    // 验证必要参数
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

    if (!conversationId) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_CONVERSATION_ID",
          message: "缺少会话ID",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 使用数据库事务确保原子性操作和并发安全
    const deleteResult = await prisma.$transaction(
      async (tx) => {
        // 1. 首先锁定并验证会话是否存在且用户有权限删除
        const conversation = await tx.conversation.findFirst({
          where: {
            id: conversationId,
            OR: [{ user1Id: userId }, { user2Id: userId }],
          },
          select: {
            id: true,
            user1Id: true,
            user2Id: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                messages: true,
              },
            },
          },
        });

        if (!conversation) {
          throw new Error("CONVERSATION_NOT_FOUND");
        }

        // 2. 检查并发删除：如果会话在最近1秒内被更新，可能存在并发操作
        const recentUpdateThreshold = new Date(Date.now() - 1000);
        if (conversation.updatedAt > recentUpdateThreshold) {
          console.warn(
            `会话 ${conversationId} 检测到可能的并发操作，进行二次验证`
          );

          // 短暂延迟后重新检查会话状态
          await new Promise((resolve) => setTimeout(resolve, 50));

          const doubleCheck = await tx.conversation.findUnique({
            where: { id: conversationId },
            select: { id: true },
          });

          if (!doubleCheck) {
            throw new Error("CONVERSATION_ALREADY_DELETED");
          }
        }

        // 3. 记录删除操作的元数据（用于审计和统计）
        const deletionMetadata = {
          conversationId,
          deletedBy: userId,
          messageCount: conversation._count.messages,
          conversationAge: Date.now() - conversation.createdAt.getTime(),
          deletedAt: new Date(),
        };

        // 4. 执行删除操作（Prisma会自动级联删除相关消息）
        try {
          const deletedConversation = await tx.conversation.delete({
            where: {
              id: conversationId,
            },
            select: {
              id: true,
              user1Id: true,
              user2Id: true,
            },
          });

          return {
            deletedConversation,
            metadata: deletionMetadata,
          };
        } catch (deleteError: any) {
          // 处理删除过程中的特定错误
          if (deleteError.code === "P2025") {
            // Record to delete does not exist
            throw new Error("CONVERSATION_NOT_FOUND");
          }
          throw deleteError;
        }
      },
      {
        maxWait: 5000, // 最大等待锁的时间：5秒
        timeout: 10000, // 事务超时时间：10秒
        isolationLevel: "ReadCommitted", // 读已提交隔离级别，平衡性能和一致性
      }
    );

    // 5. 事务成功，记录日志并返回响应
    console.log("会话删除成功:", {
      conversationId,
      deletedBy: userId,
      messageCount: deleteResult.metadata.messageCount,
      conversationAge: deleteResult.metadata.conversationAge,
    });

    return NextResponse.json({
      success: true,
      message: "会话已成功删除",
      data: {
        conversationId,
        messageCount: deleteResult.metadata.messageCount,
        deletedAt: deleteResult.metadata.deletedAt,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("删除会话失败:", error);

    // 根据不同错误类型返回相应的响应
    if (error.message === "CONVERSATION_NOT_FOUND") {
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

    if (error.message === "CONVERSATION_ALREADY_DELETED") {
      return NextResponse.json(
        {
          success: false,
          error: "CONVERSATION_ALREADY_DELETED",
          message: "会话已被其他操作删除",
          timestamp: new Date().toISOString(),
        },
        { status: 409 } // Conflict
      );
    }

    // 处理数据库并发和锁相关错误
    if (error.code === "P2034" || error.message?.includes("deadlock")) {
      return NextResponse.json(
        {
          success: false,
          error: "CONCURRENT_OPERATION_CONFLICT",
          message: "检测到并发操作冲突，请稍后重试",
          timestamp: new Date().toISOString(),
        },
        { status: 423 } // Locked
      );
    }

    // 处理事务超时错误
    if (error.code === "P2024" || error.message?.includes("timeout")) {
      return NextResponse.json(
        {
          success: false,
          error: "OPERATION_TIMEOUT",
          message: "删除操作超时，请稍后重试",
          timestamp: new Date().toISOString(),
        },
        { status: 408 } // Request Timeout
      );
    }

    // 处理其他Prisma错误
    if (error.code === "P2002") {
      // 唯一约束冲突（理论上不应该在删除操作中发生）
      return NextResponse.json(
        {
          success: false,
          error: "CONSTRAINT_VIOLATION",
          message: "数据约束冲突",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 处理连接错误
    if (error.code === "P1001" || error.message?.includes("connection")) {
      return NextResponse.json(
        {
          success: false,
          error: "DATABASE_CONNECTION_ERROR",
          message: "数据库连接失败，请稍后重试",
          timestamp: new Date().toISOString(),
        },
        { status: 503 } // Service Unavailable
      );
    }

    // 其他未知错误
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
