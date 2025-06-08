"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import Icon from "@/components/ui/Icon";

interface BottleData {
  id: string;
  content: string;
  mediaType?: "text" | "image" | "audio";
  mediaUrl?: string;
  createdAt: string;
  userId?: string; // 添加userId字段用于聊天
  author?: {
    firstName: string;
  };
  stats?: {
    replies: number;
    discoveries: number;
  };
  bottleStyle?: {
    color: string;
    pattern: string;
    decoration: string;
  };
}

interface BottleReplyModalProps {
  isOpen: boolean;
  bottle: BottleData;
  onClose: () => void;
  onReplyAndChat: (replyContent: string) => Promise<void>;
}

export function BottleReplyModal({
  isOpen,
  bottle,
  onClose,
  onReplyAndChat,
}: BottleReplyModalProps) {
  const [replyContent, setReplyContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleReplyAndChat = async () => {
    if (!replyContent.trim() || !bottle || isLoading) return;

    setIsLoading(true);
    try {
      await onReplyAndChat(replyContent.trim());
      // 成功后父组件会处理弹窗关闭和跳转，这里不需要重置loading状态
      // 因为组件即将被卸载
    } catch (error) {
      console.error("回复并开始聊天失败:", error);
      // 只有在失败的情况下才重置loading状态，让用户可以重试
      setIsLoading(false);
    }
    // 注意：移除了finally块，因为成功时组件会被卸载，不需要重置状态
  };

  const handleClose = () => {
    // 只有在非加载状态下才允许关闭
    if (isLoading) return;

    setReplyContent("");
    setIsLoading(false);
    onClose();
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}天前`;
    if (diffHours > 0) return `${diffHours}小时前`;
    if (diffMins > 0) return `${diffMins}分钟前`;
    return "刚刚";
  };

  if (!bottle) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={handleClose}
          />

          {/* 弹窗内容 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-2 z-50 max-w-lg mx-auto pt-10"
          >
            <div className="bottle-card rounded-2xl p-6 max-h-[80vh] overflow-y-auto">
              {/* 头部 */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  💬 回复漂流瓶
                </h3>
                <button
                  onClick={handleClose}
                  className={`p-2 rounded-full transition-colors ${
                    isLoading
                      ? "cursor-not-allowed text-gray-300"
                      : "hover:bg-gray-100 text-gray-500"
                  }`}
                  disabled={isLoading}
                >
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* 原始瓶子内容 */}
              <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-400 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-600 text-sm font-medium">
                    🍾 原始消息
                  </span>
                  <span className="text-blue-500 text-xs">
                    {"匿名"} • {getTimeAgo(bottle.createdAt)}
                  </span>
                </div>
                <p className="text-gray-800 leading-relaxed">
                  {bottle.content}
                </p>

                {/* 媒体内容 */}
                {bottle.mediaType === "image" && bottle.mediaUrl && (
                  <div className="mt-3">
                    <img
                      src={bottle.mediaUrl}
                      alt="瓶中图片"
                      className="rounded-lg max-w-full h-auto shadow-sm"
                    />
                  </div>
                )}

                {bottle.mediaType === "audio" && bottle.mediaUrl && (
                  <div className="mt-3">
                    <audio controls className="w-full">
                      <source src={bottle.mediaUrl} type="audio/mpeg" />
                      您的浏览器不支持音频播放
                    </audio>
                  </div>
                )}
              </div>

              {/* 回复输入区域 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    您的回复
                  </label>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="写下您对这个漂流瓶的回复..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                    maxLength={500}
                    disabled={isLoading}
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {replyContent.length}/500
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="space-y-3">
                  <button
                    onClick={handleReplyAndChat}
                    disabled={!replyContent.trim() || isLoading}
                    className={`w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      isLoading
                        ? "animate-pulse"
                        : "hover:scale-[1.02] active:scale-[0.98]"
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Icon icon={Loader2} className="w-4 h-4 animate-spin" />
                        <span>正在发送回复...</span>
                      </>
                    ) : (
                      <>
                        <span>💬</span>
                        <span>回复并开始聊天</span>
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      💡 回复后将自动创建聊天会话，开始与瓶子主人对话
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
