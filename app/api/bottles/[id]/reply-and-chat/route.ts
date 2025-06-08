import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Context {
  params: { id: string };
}

// 简单的重试函数
async function executeTransactionWithRetry<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // 只有在无法启动事务时才重试一次
    if (
      error.code === "P2028" &&
      error.message?.includes("Unable to start a transaction")
    ) {
      console.log("事务启动失败，1秒后重试一次...");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        return await operation();
      } catch (retryError: any) {
        console.error("重试后仍然失败:", retryError);
        throw retryError;
      }
    }
    throw error;
  }
}

// POST /api/bottles/[id]/reply-and-chat - 回复漂流瓶并创建聊天会话
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

    // 使用重试机制执行事务
    const result = await executeTransactionWithRetry(() =>
      prisma.$transaction(
        async (tx) => {
          // 1. 检查漂流瓶是否存在 - 优化查询，只获取必要字段
          const bottle = await tx.bottle.findUnique({
            where: { id: bottleId },
            select: {
              id: true,
              content: true,
              userId: true,
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
            throw new Error("BOTTLE_NOT_FOUND");
          }

          // 2. 防止用户回复自己的漂流瓶
          if (bottle.userId === userId) {
            throw new Error("CANNOT_REPLY_OWN_BOTTLE");
          }

          // 3. 创建回复记录 - 优化查询
          const reply = await tx.reply.create({
            data: {
              content: content.trim(),
              userId,
              bottleId,
              mediaType: "TEXT",
            },
            select: {
              id: true,
              content: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          });

          // 4. 更新漂流瓶回复数量
          await tx.bottle.update({
            where: { id: bottleId },
            data: {
              replyCount: { increment: 1 },
            },
          });

          // 5. 创建或获取聊天会话 - 优化查询
          let conversation = await tx.conversation.findFirst({
            where: {
              OR: [
                { user1Id: userId, user2Id: bottle.userId },
                { user1Id: bottle.userId, user2Id: userId },
              ],
            },
            select: {
              id: true,
              user1Id: true,
              user2Id: true,
              createdAt: true,
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

          const isNewConversation = !conversation;

          if (!conversation) {
            // 创建新会话 - 优化查询
            conversation = await tx.conversation.create({
              data: {
                user1Id: userId,
                user2Id: bottle.userId,
                isActive: true,
              },
              select: {
                id: true,
                user1Id: true,
                user2Id: true,
                createdAt: true,
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

          // 6. 如果是新会话，创建系统消息显示瓶子内容
          if (isNewConversation) {
            await tx.message.create({
              data: {
                content: `🍾 关于漂流瓶：\n\n"${bottle.content}"\n\n来自：匿名用户`,
                mediaType: "TEXT",
                messageType: "SYSTEM",
                senderId: userId,
                receiverId: bottle.userId,
                conversationId: conversation.id,
                isRead: false,
              },
            });
          }

          // 7. 创建回复消息 - 优化查询
          const replyMessage = await tx.message.create({
            data: {
              content: content.trim(),
              mediaType: "TEXT",
              messageType: "DIRECT",
              senderId: userId,
              receiverId: bottle.userId,
              conversationId: conversation.id,
              isRead: false,
            },
            select: {
              id: true,
              content: true,
              mediaType: true,
              createdAt: true,
              senderId: true,
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

          // 8. 更新会话的最后消息时间
          await tx.conversation.update({
            where: { id: conversation.id },
            data: {
              lastMessageAt: new Date(),
              lastMessageId: replyMessage.id,
            },
          });

          // 确定对方用户信息
          const otherUser =
            conversation.user1Id === userId
              ? conversation.user2
              : conversation.user1;

          return {
            reply: {
              id: reply.id,
              content: reply.content,
              createdAt: reply.createdAt,
              author: {
                firstName: reply.user.firstName,
                lastName: reply.user.lastName,
              },
            },
            conversation: {
              id: conversation.id,
              otherUser,
              createdAt: conversation.createdAt,
              isNewConversation,
            },
            message: replyMessage,
          };
        },
        {
          timeout: 15000, // 增加超时时间到15秒
          isolationLevel: "ReadCommitted", // 使用较轻的隔离级别，减少锁竞争
        }
      )
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: result.conversation.isNewConversation
        ? "回复已发送，聊天会话已创建！"
        : "回复已发送，继续你们的对话吧！",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("回复并创建聊天失败:", error);

    // 处理特定错误
    if (error instanceof Error) {
      switch (error.message) {
        case "BOTTLE_NOT_FOUND":
          return NextResponse.json(
            {
              success: false,
              error: "BOTTLE_NOT_FOUND",
              message: "漂流瓶不存在",
            },
            { status: 404 }
          );
        case "CANNOT_REPLY_OWN_BOTTLE":
          return NextResponse.json(
            {
              success: false,
              error: "CANNOT_REPLY_OWN_BOTTLE",
              message: "不能回复自己的漂流瓶",
            },
            { status: 400 }
          );
      }
    }

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
