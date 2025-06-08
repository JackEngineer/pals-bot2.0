"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatActions } from "@/hooks/useChatActions";
import { ConversationEndedModal } from "./ConversationEndedModal";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  firstName: string;
  lastName?: string;
  username?: string;
  avatarUrl?: string;
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
  messageType?: string;
}

interface Conversation {
  id: string;
  otherUser: User;
}

interface ChatWindowProps {
  conversation: Conversation;
  onBack: () => void;
}

export function ChatWindow({ conversation, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [conversationEnded, setConversationEnded] = useState(false);
  const [showEndedMessage, setShowEndedMessage] = useState(false);
  const [showEndConversationDialog, setShowEndConversationDialog] =
    useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    getMessages,
    getNewMessages,
    sendMessage,
    deleteConversation,
    loading,
  } = useChatActions();

  useEffect(() => {
    fetchMessages();
    startPolling();

    // 清理轮询
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [conversation.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    const result = await getMessages(conversation.id);
    if (result) {
      setMessages(result.messages);
      setCurrentUserId(result.currentUserId);
      // 记录最后消息时间，用于增量查询
      if (result.messages.length > 0) {
        const latestMessage = result.messages[result.messages.length - 1];
        setLastMessageTime(latestMessage.createdAt);
      }
    }
  };

  // 获取新消息并追加到现有消息中
  const fetchNewMessages = async () => {
    try {
      // 如果没有最后消息时间，使用常规查询
      if (!lastMessageTime) {
        const result = await getMessages(conversation.id, 1, 20);
        if (!result) {
          handleConversationEnded();
          return;
        }
        // 检查是否有新消息需要追加
        if (result.messages.length > 0) {
          setMessages(result.messages);
          setCurrentUserId(result.currentUserId);
          const latestMessage = result.messages[result.messages.length - 1];
          setLastMessageTime(latestMessage.createdAt);
        }
        return;
      }

      // 使用增量查询获取新消息
      const result = await getNewMessages(conversation.id, lastMessageTime);

      if (!result) {
        // 会话不存在，显示结束消息
        handleConversationEnded();
        return;
      }

      // 如果有新消息，追加到现有消息列表
      if (result.messages.length > 0) {
        setMessages((prev) => {
          // 避免重复消息
          const existingIds = new Set(prev.map((msg) => msg.id));
          const newMessages = result.messages.filter(
            (msg) => !existingIds.has(msg.id)
          );
          return [...prev, ...newMessages];
        });

        // 更新最后消息时间
        const latestMessage = result.messages[result.messages.length - 1];
        setLastMessageTime(latestMessage.createdAt);
      }
    } catch (error) {
      console.error("获取新消息失败:", error);
      // 如果是404错误，说明会话已被删除
      if (
        error instanceof Error &&
        error.message.includes("CONVERSATION_NOT_FOUND")
      ) {
        handleConversationEnded();
      }
    }
  };

  // 处理会话结束的显示逻辑
  const handleConversationEnded = () => {
    if (!conversationEnded) {
      setConversationEnded(true);
      setShowEndedMessage(true);

      // 停止轮询
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      // 3秒后自动跳转
      setTimeout(() => {
        onBack();
      }, 3000);
    }
  };

  // 启动轮询
  const startPolling = () => {
    // 清除之前的轮询
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // 每3秒检查一次新消息
    pollingIntervalRef.current = setInterval(() => {
      if (!conversationEnded) {
        fetchNewMessages();
      }
    }, 5000);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || sending) return;

    const tempId = `temp-${Date.now()}`;

    try {
      setSending(true);

      // 立即添加到本地状态以提供即时反馈
      const tempMessage: Message = {
        id: tempId,
        content: inputValue.trim(),
        mediaType: "TEXT",
        createdAt: new Date().toISOString(),
        isRead: false,
        senderId: currentUserId,
        sender: {
          id: currentUserId,
          firstName: "我",
          lastName: "",
          username: "",
          avatarUrl: "",
        },
      };

      setMessages((prev) => [...prev, tempMessage]);
      const messageContent = inputValue.trim();
      setInputValue("");

      const result = await sendMessage(conversation.id, messageContent);

      if (result) {
        // 替换临时消息为真实消息
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempId ? result : msg))
        );
        // 更新最后消息时间
        setLastMessageTime(result.createdAt);
      } else {
        // 发送失败，移除临时消息并恢复输入内容
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        setInputValue(messageContent);
      }
    } catch (error) {
      console.error("发送消息失败:", error);
      // 移除临时消息
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUserDisplayName = (user: User) => {
    if (user.username) return `@${user.username}`;
    return `${user.firstName}${user.lastName || ""}`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isMyMessage = (message: Message) => {
    return message.senderId === currentUserId;
  };

  const isSystemMessage = (message: Message) => {
    return message.messageType === "SYSTEM";
  };

  // 处理结束会话
  const handleEndConversation = () => {
    setShowEndConversationDialog(true);
  };

  // 确认结束会话
  const confirmEndConversation = async () => {
    setShowEndConversationDialog(false);

    try {
      const success = await deleteConversation(conversation.id);

      if (success) {
        // 显示成功提示
        toast.success("会话已结束");
        // 返回聊天列表
        onBack();
      } else {
        toast.error("结束会话失败，请重试");
      }
    } catch (error) {
      console.error("结束会话失败:", error);
      toast.error("结束会话失败，请重试");
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-blue-50 to-white">
      {/* 聊天头部 */}
      <div className="bottle-card border-b p-4 flex items-center space-x-3 rounded-none justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-blue-100 rounded-full transition-colors"
          >
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center overflow-hidden">
            {conversation.otherUser.avatarUrl ? (
              <img
                src={conversation.otherUser.avatarUrl}
                alt={getUserDisplayName(conversation.otherUser)}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-medium">
                {/* {conversation.otherUser.firstName.charAt(0)} */}匿
              </span>
            )}
          </div>

          <div>
            <h3 className="font-medium text-gray-900">匿名用户</h3>
            <p className="text-xs text-gray-500">匿名聊天</p>
          </div>
        </div>
        {/*增加一个销毁按钮，点击后销毁会话 */}
        <button
          className="p-2 hover:bg-red-100 rounded-full transition-colors text-red-600 text-sm font-medium"
          onClick={handleEndConversation}
          disabled={loading}
        >
          结束会话
        </button>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 会话结束提示 */}
        <ConversationEndedModal
          isVisible={showEndedMessage}
          onJumpToList={onBack}
        />

        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id + index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${
                isSystemMessage(message)
                  ? "justify-center"
                  : isMyMessage(message)
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              {isSystemMessage(message) ? (
                // 系统消息样式
                <div className="w-full bg-amber-50 border-l-4 border-amber-400 rounded-xl p-4 my-2">
                  <p className="text-amber-800 text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                  <div className="text-xs text-amber-600 mt-2 text-center">
                    以上是您回复的漂流瓶内容
                  </div>
                </div>
              ) : (
                // 普通消息样式
                <div
                  className={`
                     max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm
                     ${
                       isMyMessage(message)
                         ? "bg-blue-500 text-white rounded-br-md"
                         : "bg-white text-gray-800 rounded-bl-md border border-gray-200"
                     }
                   `}
                >
                  {message.mediaType === "IMAGE" && message.mediaUrl && (
                    <img
                      src={message.mediaUrl}
                      alt="图片消息"
                      className="rounded-lg mb-2 max-w-full"
                    />
                  )}

                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>

                  <div
                    className={`
                       text-xs mt-1 flex items-center justify-end space-x-1
                       ${
                         isMyMessage(message)
                           ? "text-blue-100"
                           : "text-gray-400"
                       }
                     `}
                  >
                    <span>{formatTime(message.createdAt)}</span>
                    {isMyMessage(message) && (
                      <span className="text-xs">
                        {message.isRead ? "✓✓" : "✓"}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="bottle-card border-t p-4 rounded-none">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={conversationEnded ? "会话已结束" : "输入消息..."}
              rows={1}
              disabled={conversationEnded}
              className="
                w-full resize-none rounded-full px-4 py-3 pr-12
                input-ocean
                max-h-32
                disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
              "
              style={{
                minHeight: "44px",
                height: "auto",
              }}
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || sending || conversationEnded}
            className={`
              p-3 rounded-full transition-all duration-200 flex items-center justify-center
              ${
                inputValue.trim() && !sending && !conversationEnded
                  ? "ocean-button"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }
            `}
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 结束会话确认对话框 */}
      <Dialog
        open={showEndConversationDialog}
        onOpenChange={setShowEndConversationDialog}
      >
        <DialogContent variant="ocean" size="sm">
          <DialogHeader>
            <DialogTitle className="text-center">结束会话</DialogTitle>
            <DialogDescription className="text-center">
              确定要结束这个会话吗？
              <br />
              <span className="text-red-500 font-medium">
                所有消息记录将被删除，此操作无法撤销。
              </span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowEndConversationDialog(false)}
              className="w-full sm:w-auto"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={confirmEndConversation}
              className="w-full sm:w-auto"
            >
              确认结束
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
