"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConversationEndedModalProps {
  isVisible: boolean;
  onJumpToList: () => void;
}

export function ConversationEndedModal({
  isVisible,
  onJumpToList,
}: ConversationEndedModalProps) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!isVisible) {
      setCountdown(3);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onJumpToList();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, onJumpToList]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full ocean-card bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-400 p-6 my-4"
        >
          <div className="text-center">
            {/* 警告图标 */}
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            {/* 主要信息 */}
            <h3 className="text-xl font-semibold text-red-800 mb-2">
              ⚠️ 会话已结束
            </h3>

            <p className="text-red-700 mb-4 leading-relaxed">
              对方已结束了这个会话，所有消息记录已被清理
            </p>

            {/* 倒计时显示 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 mb-4 border border-red-200">
              <p className="text-red-600 text-sm">
                <span className="font-medium">{countdown}</span>{" "}
                秒后自动返回聊天列表
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-center space-x-3">
              <button
                onClick={onJumpToList}
                className="
                  px-6 py-2 bg-red-600 hover:bg-red-700 text-white 
                  rounded-lg font-medium transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                "
              >
                立即返回
              </button>

              <button
                onClick={() => setCountdown(10)}
                className="
                  px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 
                  rounded-lg font-medium transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                "
              >
                延迟 ({countdown}s)
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
