"use client";

import TelegramAuth from "@/components/TelegramAuth";

export default function Home() {
  return (
    <div className="min-h-screen bg-ocean-light ocean-background pb-8">
      {/* 海洋波纹背景层 */}
      {/* <div className="absolute inset-0 bg-water-ripple opacity-10"></div> */}

      <div className="relative z-10 p-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-6 pt-6">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-ocean-gradient rounded-2xl shadow-xl mb-3 animate-float">
                <span className="text-2xl">🌊</span>
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-ocean-800 mb-1">
              漂流瓶
            </h1>
            <p className="text-xs md:text-sm text-ocean-600 mb-4 font-normal opacity-80">
              遇见有趣的陌生人
            </p>
          </div>

          {/* 身份验证区域 */}
          <div className="mb-8">
            <TelegramAuth />
          </div>

          {/* 特性展示 */}
          <div className="bottle-card rounded-2xl p-4 mb-8">
            <div className="flex items-center justify-center space-x-8 text-sm text-ocean-700">
              <div className="flex items-center space-x-2 wave-animation">
                <span className="text-lg">💌</span>
                <span>发送漂流瓶</span>
              </div>
              <div
                className="flex items-center space-x-2 wave-animation"
                style={{ animationDelay: "0.5s" }}
              >
                <span className="text-lg">🏖️</span>
                <span>捞瓶子</span>
              </div>
              <div
                className="flex items-center space-x-2 wave-animation"
                style={{ animationDelay: "1s" }}
              >
                <span className="text-lg">💬</span>
                <span>匿名聊天</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center py-6">
            <div className="flex items-center justify-center space-x-4 mb-3">
              <div className="flex items-center space-x-1 text-xs text-ocean-600">
                <span>🔒</span>
                <span>安全</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-ocean-600">
                <span>👤</span>
                <span>匿名</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-ocean-600">
                <span>⭐</span>
                <span>有趣</span>
              </div>
            </div>
            <p className="text-xs text-ocean-600">
              © 2024 Pals Bot 2.0 - 让世界变得更有趣一点
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
