import { useState } from "react";
import { useUserStore } from "./useUserStore";
import { get, post, del } from "@/lib/request";

interface User {
  id: string;
  firstName: string;
  lastName?: string;
  username?: string;
  avatarUrl?: string;
}

interface LastMessage {
  id: string;
  content: string;
  mediaType: string;
  createdAt: string;
  isRead: boolean;
  senderId: string;
}

interface Conversation {
  id: string;
  otherUser: User;
  lastMessage?: LastMessage;
  lastMessageAt?: string;
  createdAt: string;
  hasUnread?: boolean;
}

interface Message {
  id: string;
  content: string;
  mediaType: string;
  mediaUrl?: string;
  createdAt: string;
  isRead: boolean;
  senderId: string;
  sender: User;
}

interface MessagesResponse {
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
  currentUserId: string;
}

export function useChatActions() {
  const [loading, setLoading] = useState(false);
  const user = useUserStore((state) => state.user);

  // 获取会话列表
  const getConversations = async (): Promise<Conversation[]> => {
    console.log("getConversations", user);
    if (!user) return [];

    setLoading(true);
    try {
      const data: any = await get(`/api/chat/conversations?userId=${user.id}`);
      return data || [];
    } catch (error) {
      console.error("获取会话列表失败:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getConversationById = async (
    conversationId: string
  ): Promise<Conversation | null> => {
    if (!user) return null;
    const data: any = await get(
      `/api/chat/conversations/${conversationId}/detail?userId=${user.id}`
    );
    return data;
  };

  // 创建新会话
  const createConversation = async (
    targetUserId: string,
    bottleContext?: any
  ): Promise<Conversation | null> => {
    if (!user) return null;

    setLoading(true);
    try {
      const payload = {
        userId: user.id,
        targetUserId,
        bottleContext,
      };
      const data: any = await post("/api/chat/conversations", payload);
      return data;
    } catch (error) {
      console.error("创建会话失败:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 获取会话消息
  const getMessages = async (
    conversationId: string,
    page = 1,
    limit = 50
  ): Promise<MessagesResponse | null> => {
    if (!user) return null;

    setLoading(true);
    try {
      const data: any = await get(
        `/api/chat/conversations/${conversationId}/messages?userId=${user.id}&page=${page}&limit=${limit}`
      );
      return data;
    } catch (error) {
      console.error("获取消息失败:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 发送消息
  const sendMessage = async (
    conversationId: string,
    content: string,
    mediaType: string = "TEXT",
    mediaUrl?: string
  ): Promise<Message | null> => {
    if (!user) return null;

    // 基础验证
    if (!content.trim()) {
      console.error("消息内容不能为空");
      return null;
    }

    setLoading(true);
    try {
      // 前置检查1：验证会话是否仍然存在和活跃
      // const statusCheck = await get(
      //   `/api/chat/conversations/${conversationId}/messages?userId=${user.id}&limit=1`
      // );

      // if (!statusCheck) {
      //   console.error("会话状态检查失败");
      //   // 触发会话删除事件，通知UI更新
      //   if (typeof window !== "undefined") {
      //     window.dispatchEvent(
      //       new CustomEvent("conversationStatusChanged", {
      //         detail: { conversationId, status: "deleted" },
      //       })
      //     );
      //   }
      //   return null;
      // }

      // 前置检查2：确认会话仍然活跃
      // const conversation = statusCheck.conversation;
      // if (!conversation || !conversation.isActive) {
      //   console.error("会话已结束或不活跃，无法发送消息");
      //   // 触发会话状态变化事件
      //   if (typeof window !== "undefined") {
      //     window.dispatchEvent(
      //       new CustomEvent("conversationStatusChanged", {
      //         detail: { conversationId, status: "inactive" },
      //       })
      //     );
      //   }
      //   return null;
      // }

      // 前置检查3：验证用户仍为会话参与者
      // const currentUserId = statusCheck.currentUserId;
      // if (currentUserId !== user.id) {
      //   console.error("用户身份验证失败，可能不是会话参与者");
      //   return null;
      // }

      // 发送消息（带重试机制）
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          const payload = {
            userId: user.id,
            content: content.trim(),
            mediaType,
            mediaUrl,
            // 添加会话状态验证时间戳，用于服务端验证
            statusCheckTimestamp: Date.now(),
          };

          const data: any = await post(
            `/api/chat/conversations/${conversationId}/messages`,
            payload
          );

          if (data) {
            // 发送成功，触发消息发送事件
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("messageSent", {
                  detail: { conversationId, message: data },
                })
              );
            }
            return data;
          }

          throw new Error("发送消息返回空数据");
        } catch (sendError: any) {
          console.warn(
            `发送消息失败 (重试 ${retryCount + 1}/${maxRetries + 1}):`,
            sendError
          );

          // 检查是否为会话已删除的错误
          if (
            sendError.message?.includes("CONVERSATION_NOT_FOUND") ||
            sendError.message?.includes("会话不存在")
          ) {
            // 会话已被删除，不需要重试
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("conversationStatusChanged", {
                  detail: { conversationId, status: "deleted" },
                })
              );
            }
            return null;
          }

          // 检查是否为权限问题
          if (
            sendError.message?.includes("NOT_PARTICIPANT") ||
            sendError.message?.includes("权限不足")
          ) {
            // 权限问题，不需要重试
            console.error("用户不再是会话参与者");
            return null;
          }

          retryCount++;

          // 如果不是最后一次重试，等待一小段时间再重试
          if (retryCount <= maxRetries) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * retryCount)
            );

            // 重试前再次检查会话状态
            try {
              const recheckStatus = await get(
                `/api/chat/conversations/${conversationId}/messages?userId=${user.id}&limit=1`
              );

              if (!recheckStatus || !recheckStatus.conversation?.isActive) {
                console.error("重试前检查发现会话已不可用");
                return null;
              }
            } catch (recheckError) {
              console.error("重试前状态检查失败:", recheckError);
              return null;
            }
          } else {
            // 最后一次重试也失败了
            throw sendError;
          }
        }
      }

      return null;
    } catch (error: any) {
      console.error("发送消息失败:", error);

      // 触发错误事件
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("messageError", {
            detail: {
              conversationId,
              error: error.message || "发送消息失败",
              type: "send_failed",
            },
          })
        );
      }

      return null;
    } finally {
      setLoading(false);
    }
  };

  // 随机匹配聊天
  const startRandomChat = async (): Promise<Conversation | null> => {
    if (!user) return null;

    setLoading(true);
    try {
      const payload = {
        userId: user.id,
      };
      const data: any = await post("/api/chat/random", payload);
      return data;
    } catch (error) {
      console.error("随机匹配失败:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 回复漂流瓶
  const replyToBottle = async (
    bottleId: string,
    content: string
  ): Promise<any> => {
    if (!user) return null;

    setLoading(true);
    try {
      const payload = {
        userId: user.id,
        content,
      };
      const data: any = await post(`/api/bottles/${bottleId}/reply`, payload);
      return data;
    } catch (error) {
      console.error("回复漂流瓶失败:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 回复漂流瓶并创建聊天会话（新方法）
  const replyToBottleAndChat = async (
    bottleId: string,
    content: string
  ): Promise<{
    reply: any;
    conversation: Conversation;
    message: Message;
  } | null> => {
    if (!user) return null;

    setLoading(true);
    try {
      const payload = {
        userId: user.id,
        content,
      };
      const response: any = await post(
        `/api/bottles/${bottleId}/reply-and-chat`,
        payload
      );

      // API返回格式: { success: true, data: { reply, conversation, message } }
      if (response) {
        return response;
      }

      return null;
    } catch (error) {
      console.error("回复漂流瓶并创建聊天失败:", error);
      throw error; // 重新抛出错误，让调用方处理
    } finally {
      setLoading(false);
    }
  };

  // 删除会话
  const deleteConversation = async (
    conversationId: string
  ): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    try {
      await del(`/api/chat/conversations/${conversationId}?userId=${user.id}`);
      return true;
    } catch (error) {
      console.error("删除会话失败:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    getConversations,
    getConversationById,
    createConversation,
    getMessages,
    sendMessage,
    startRandomChat,
    replyToBottle,
    replyToBottleAndChat,
    deleteConversation,
    loading,
  };
}
