"use client";

import TelegramAuth from "@/components/TelegramAuth";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="relative z-10 p-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br rounded-2xl shadow-xl mb-4">
                <img 
                  src="/logo.png" 
                  alt="漂流瓶 Logo" 
                  className="w-full h-full rounded-xl"
                />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
              漂流瓶
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-6">
              遇见有趣的陌生人
            </p>
            <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
              将心情装进漂流瓶，投向数字海洋，与世界各地的人匿名分享故事
            </p>
          </div>

          {/* 身份验证区域 - 主要内容 */}
          <div className="mb-8">
            <TelegramAuth />
          </div>

          {/* 简化的特性展示 */}
          <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 mb-8 border border-white/20">
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="text-lg">💌</span>
                <span>发送漂流瓶</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">🏖️</span>
                <span>捞瓶子</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">💬</span>
                <span>匿名聊天</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center py-6">
            <div className="flex items-center justify-center space-x-4 mb-3">
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                <span>安全</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
                <span>匿名</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span>有趣</span>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              © 2024 Pals Bot 2.0 - 让世界变得更有趣一点
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
