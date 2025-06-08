"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { motion, AnimatePresence } from "framer-motion";
import { useChatActions } from "@/hooks/useChatActions";

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
  const router = useRouter();
  const params = useParams();
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);

  const { getConversations, getConversationById } = useChatActions();

  // 检查URL参数，自动跳转到指定会话
  useEffect(() => {
    const conversationId = params.id as string;
    console.log("conversationId", conversationId);
    if (conversationId && !selectedConversation) {
      loadConversationById(conversationId);
    }
  }, [params.id]);

  const loadConversationById = async (conversationId: string) => {
    setLoading(true);
    try {
      const conversation = await getConversationById(conversationId);
      if (conversation) {
        setSelectedConversation(conversation);
      }
    } catch (error) {
      console.error("加载会话失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    router.push("/chat");
  };

  return (
    <div className="min-h-screen bg-ocean-light ocean-background">
      {/* 海洋波纹背景层 */}
      <div className="absolute inset-0 bg-water-ripple opacity-30"></div>

      <div className="relative z-10 h-screen flex flex-col">
        <AnimatePresence mode="wait">
            <motion.div
              key="chat-window"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col h-full"
            >
              {selectedConversation && (
              <ChatWindow
                  conversation={selectedConversation as Conversation}
                  onBack={handleBackToList}
                />
              )}
            </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
