import { useState } from "react";
import { useUserStore } from "./useUserStore";
import { get, post } from "@/lib/request";

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

  const getConversationById = async (conversationId: string): Promise<Conversation | null> => {
    if (!user) return null;
    const data: any = await get(`/api/chat/conversations/${conversationId}/detail?userId=${user.id}`);
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

    setLoading(true);
    try {
      const payload = {
        userId: user.id,
        content,
        mediaType,
        mediaUrl,
      };
      const data: any = await post(
        `/api/chat/conversations/${conversationId}/messages`,
        payload
      );
      return data;
    } catch (error) {
      console.error("发送消息失败:", error);
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

  return {
    getConversations,
    getConversationById,
    createConversation,
    getMessages,
    sendMessage,
    startRandomChat,
    replyToBottle,
    loading,
  };
}
