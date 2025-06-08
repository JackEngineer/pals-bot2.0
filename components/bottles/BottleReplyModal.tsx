"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BottleData {
  id: string;
  content: string;
  mediaType?: "text" | "image" | "audio";
  mediaUrl?: string;
  createdAt: Date;
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
  bottle: BottleData | null;
  onClose: () => void;
  onReplySubmit: (replyContent: string) => void;
  onStartChat: (bottle: BottleData) => void;
}

export function BottleReplyModal({
  isOpen,
  bottle,
  onClose,
  onReplySubmit,
  onStartChat,
}: BottleReplyModalProps) {
  const [replyContent, setReplyContent] = useState("");
  const [showReplySuccess, setShowReplySuccess] = useState(false);

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !bottle) return;

    await onReplySubmit(replyContent.trim());
    setShowReplySuccess(true);

    // 2秒后隐藏成功提示
    setTimeout(() => {
      setShowReplySuccess(false);
    }, 2000);
  };

  const handleStartChat = () => {
    if (bottle) {
      onStartChat(bottle);
    }
  };

  const handleClose = () => {
    setReplyContent("");
    setShowReplySuccess(false);
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
            className="fixed inset-x-4 top-20 -translate-y-1/2 z-50 max-w-lg mx-auto"
          >
            <div className="bottle-card rounded-2xl p-6 max-h-[80vh] overflow-y-auto">
              {/* 头部 */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  💬 回复漂流瓶
                </h3>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-500"
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
                    {bottle.author?.firstName || "匿名"} •{" "}
                    {getTimeAgo(bottle.createdAt)}
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

              {!showReplySuccess ? (
                <div className="space-y-4">
                  {/* 回复输入区域 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      您的回复
                    </label>
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="写下您对这个漂流瓶的回复..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      maxLength={500}
                    />
                    <div className="text-right text-xs text-gray-500 mt-1">
                      {replyContent.length}/500
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleSubmitReply}
                      disabled={!replyContent.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <span>💬</span>
                      发送回复
                    </button>

                    <button
                      onClick={handleStartChat}
                      className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <span>💭</span>
                      发起聊天
                    </button>
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      💡 发起聊天可以与瓶子主人进行实时对话
                    </p>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  <div className="text-4xl mb-4">✅</div>
                  <h4 className="text-lg font-semibold text-green-700 mb-2">
                    回复发送成功！
                  </h4>
                  <p className="text-green-600 text-sm mb-6">
                    您的回复已经送达，瓶子主人会收到通知
                  </p>

                  <div className="space-y-3">
                    <button
                      onClick={handleStartChat}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <span>💭</span>
                      继续发起聊天
                    </button>

                    <button
                      onClick={handleClose}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors duration-200"
                    >
                      返回主页
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
