"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { motion, AnimatePresence } from "framer-motion";
import { useChatActions } from "@/hooks/useChatActions";
import "./page.css";

interface User {
  id: string;
  firstName: string;
  lastName?: string;
  username?: string;
  avatarUrl?: string;
}

interface Conversation {
  id: string;
  otherUser: User;
}

export default function ChatPage() {
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const { getConversations } = useChatActions();

  // 检查URL参数，自动跳转到指定会话
  useEffect(() => {
    const conversationId = searchParams.get("conversation");
    if (conversationId && !selectedConversation) {
      loadConversationById(conversationId);
    }
  }, [searchParams]);

  const loadConversationById = async (conversationId: string) => {
    setLoading(true);
    try {
      const conversations = await getConversations();
      const targetConversation = conversations.find(
        (conv) => conv.id === conversationId
      );
      if (targetConversation) {
        setSelectedConversation(targetConversation);
      }
    } catch (error) {
      console.error("加载会话失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);

    // 清除URL参数
    const url = new URL(window.location.href);
    url.searchParams.delete("conversation");
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <div className="chat bg-ocean-light ocean-background pt-20">
      {/* 海洋波纹背景层 */}
      {/* <div className="absolute inset-0 bg-water-ripple opacity-30"></div> */}

      <div className="relative z-10 h-screen flex flex-col">
        <AnimatePresence mode="wait">
          {!selectedConversation ? (
            <motion.div
              key="conversation-list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col h-full"
            >
              {/* 会话列表 */}
              <div className="flex-1 overflow-y-auto p-4">
                <ConversationList
                  onSelectConversation={handleSelectConversation}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chat-window"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col h-full"
            >
              <ChatWindow
                conversation={selectedConversation}
                onBack={handleBackToList}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
