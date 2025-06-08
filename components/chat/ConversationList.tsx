"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useChatActions } from "@/hooks/useChatActions";
import { useRouter } from "next/navigation";

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

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
}

export function ConversationList({
  onSelectConversation,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { getConversations, startRandomChat, loading } = useChatActions();

  const router = useRouter();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    const conversationList = await getConversations();
    setConversations(conversationList);
  };

  const handleSelectConversation = (conversation: Conversation) => {
    // setSelectedId(conversation.id);
    // onSelectConversation(conversation);
    router.push(`/chat/${conversation.id}`);
  };

  const handleStartRandomChat = async () => {
    const conversation = await startRandomChat();
    if (conversation) {
      onSelectConversation(conversation);
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "刚刚";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}小时前`;
    } else {
      return date.toLocaleDateString("zh-CN", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const getUserDisplayName = (user: User) => {
    if (user.username) return `@${user.username}`;
    return `${user.firstName}${user.lastName || ""}`;
  };

  const getMessagePreview = (message?: LastMessage) => {
    if (!message) return "开始你们的对话吧...";

    switch (message.mediaType) {
      case "IMAGE":
        return "📷 图片";
      case "AUDIO":
        return "🎵 语音";
      case "VIDEO":
        return "📹 视频";
      default:
        return message.content.length > 30
          ? message.content.substring(0, 30) + "..."
          : message.content;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-3 p-4 bg-white/60 rounded-xl">
              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-6xl mb-4">💭</div>
        <h3 className="text-lg font-semibold text-ocean-800 mb-2">
          还没有对话
        </h3>
        <p className="text-ocean-600 text-sm mb-6">
          开始你的第一次匿名对话吧！
        </p>
        <button
          onClick={handleStartRandomChat}
          disabled={loading}
          className="ocean-button px-6 py-3 rounded-full text-white font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "匹配中..." : "开始随机聊天"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      {/* 开始随机聊天按钮 */}
      {/* <div className="mb-4">
        <button
          onClick={handleStartRandomChat}
          disabled={loading}
          className="w-full ocean-button py-3 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span className="text-lg">🎲</span>
          {loading ? "匹配中..." : "开始随机聊天"}
        </button>
      </div> */}

      {conversations.map((conversation, index) => (
        <motion.div
          key={conversation.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => handleSelectConversation(conversation)}
          className={`
            conversation-item cursor-pointer p-4 rounded-xl transition-all duration-200
            ${
              selectedId === conversation.id
                ? "bg-blue-100 border-2 border-blue-300"
                : "bottle-card hover:shadow-lg"
            }
          `}
        >
          <div className="flex items-center space-x-3">
            {/* 头像 */}
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                {conversation.otherUser.avatarUrl ? (
                  <img
                    src={conversation.otherUser.avatarUrl}
                    alt={getUserDisplayName(conversation.otherUser)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-medium text-lg">
                    {conversation.otherUser.firstName.charAt(0)}
                  </span>
                )}
              </div>
              {/* 未读消息指示器 */}
              {conversation.hasUnread && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>

            {/* 会话信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-gray-900 truncate">
                  {getUserDisplayName(conversation.otherUser)}
                </h4>
                <span className="text-xs text-gray-500 shrink-0">
                  {formatTime(
                    conversation.lastMessage?.createdAt ||
                      conversation.createdAt
                  )}
                </span>
              </div>
              <p
                className={`text-sm truncate ${
                  conversation.hasUnread
                    ? "text-gray-900 font-medium"
                    : "text-gray-600"
                }`}
              >
                {getMessagePreview(conversation.lastMessage)}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
