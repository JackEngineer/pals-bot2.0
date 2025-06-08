import React from "react";

interface BottleLoadingAnimationProps {
  type: "picking" | "waiting";
  message?: string;
}

export function BottleLoadingAnimation({
  type,
  message,
}: BottleLoadingAnimationProps) {
  if (type === "picking") {
    return <PickingAnimation message={message} />;
  }

  return <WaitingAnimation message={message} />;
}

// 捞取瓶子动画
function PickingAnimation({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* 钓鱼场景 */}
      <div className="relative w-full h-48 mb-6">
        {/* 海洋背景 - 分层设计 */}
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          {/* 深海底部 */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-ocean-800 via-ocean-700 to-ocean-600"></div>

          {/* 中层海水 */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-ocean-200 via-ocean-300 to-ocean-400 opacity-90"></div>

          {/* 海面波浪效果 */}
          <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-ocean-100 to-ocean-200 animate-wave opacity-80"></div>
          <div className="absolute top-1 left-0 right-0 h-4 bg-gradient-to-b from-white/20 to-transparent animate-wave-slow"></div>
        </div>

        {/* 钓鱼竿系统 - 从岸边延伸 */}
        <div className="absolute -top-20 right-[18%] rotate-[65deg] origin-center fishing-rod-sway">
          {/* 完整钓竿 - 从画面外延伸进来 */}
          <div className="relative">
            {/* 钓竿手柄 */}
            <div className="w-3 h-8 bg-gradient-to-b from-gray-700 to-gray-900 rounded-lg shadow-lg">
              {/* 手柄纹理 */}
              <div className="absolute top-1 left-0.5 w-2 h-0.5 bg-gray-500 rounded-full opacity-60"></div>
              <div className="absolute top-3 left-0.5 w-2 h-0.5 bg-gray-500 rounded-full opacity-60"></div>
              <div className="absolute top-5 left-0.5 w-2 h-0.5 bg-gray-500 rounded-full opacity-60"></div>
              <div className="absolute top-7 left-0.5 w-2 h-0.5 bg-gray-500 rounded-full opacity-60"></div>
            </div>

            {/* 钓竿主体 - 紧接手柄 */}
            <div className="relative -top-1 left-0.5 w-2 h-28 bg-gradient-to-b from-amber-800 to-amber-600 rounded-full shadow-lg">
              {/* 钓竿接头装饰 */}
              <div className="absolute top-6 left-0 w-2 h-0.5 bg-amber-900 rounded-full"></div>
              <div className="absolute top-12 left-0 w-2 h-0.5 bg-amber-900 rounded-full"></div>
              <div className="absolute top-18 left-0 w-2 h-0.5 bg-amber-900 rounded-full"></div>
              <div className="absolute top-24 left-0 w-2 h-0.5 bg-amber-900 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* 钓鱼线 - 从竿尖到水面，再到深水 */}
        {/* 第一段：竿尖到水面 */}
        <div className="absolute top-8 right-[44%] w-px h-12 bg-gray-300 opacity-80 animate-pulse transform rotate-15"></div>

        {/* 第二段：水面到深水（垂直下降） */}
        <div className="absolute top-20 right-[44%] w-px h-16 bg-gray-300 opacity-60 animate-pulse"></div>

        {/* 浮标 - 在海面线上 */}
        <div className="absolute top-[32%] right-[43%] w-2 h-4 bg-red-400 rounded-full bobber-float shadow-sm">
          {/* 浮标反光 */}
          <div className="absolute top-1 left-0.5 w-1 h-1.5 bg-red-200 rounded-full opacity-80"></div>
        </div>

        {/* 鱼钩 - 在深水区 */}
        <div className="absolute top-[63%] right-[41%] hook-swing">
          <div className="w-2 h-2 border-2 border-gray-500 border-t-transparent rounded-full relative">
            {/* 鱼钩本体 */}
            <div className="absolute -bottom-1 -left-0.5 w-1 h-2 border-l-2 border-b-2 border-gray-500 rounded-bl transform rotate-45"></div>
          </div>
        </div>

        {/* 海底的瓶子们 - 在深水区 */}
        <div className="absolute bottom-8 left-6 underwater-sway">
          <div className="relative">
            <div className="w-5 h-7 bg-emerald-500 rounded-full opacity-85 transform rotate-12 shadow-lg"></div>
            <div className="w-1 h-1.5 bg-amber-600 rounded-full absolute -top-0.5 left-1/2 transform -translate-x-1/2"></div>
            {/* 瓶子高光 */}
            <div className="absolute top-1 left-1 w-1 h-2 bg-white/40 rounded-full"></div>
          </div>
        </div>

        <div className="absolute bottom-4 left-16 underwater-sway animation-delay-1000">
          <div className="relative">
            <div className="w-4 h-6 bg-blue-500 rounded-full opacity-80 transform -rotate-8 shadow-lg"></div>
            <div className="w-1 h-1.5 bg-amber-600 rounded-full absolute -top-0.5 left-1/2 transform -translate-x-1/2"></div>
            <div className="absolute top-1 left-1 w-1 h-1.5 bg-white/40 rounded-full"></div>
          </div>
        </div>

        <div className="absolute bottom-6 left-28 underwater-sway animation-delay-1500">
          <div className="relative">
            <div className="w-3 h-5 bg-purple-500 rounded-full opacity-75 transform rotate-20 shadow-lg"></div>
            <div className="w-0.5 h-1 bg-amber-600 rounded-full absolute -top-0.5 left-1/2 transform -translate-x-1/2"></div>
            <div className="absolute top-0.5 left-0.5 w-0.5 h-1 bg-white/40 rounded-full"></div>
          </div>
        </div>

        {/* 被钓起的目标瓶子 */}
        <div className="absolute top-[140px] right-[40%] bottle-rise animation-delay-800">
          <div className="relative">
            <div className="w-6 h-8 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full shadow-xl transform rotate-3">
              {/* 瓶子高光效果 */}
              <div className="absolute top-1 left-1 w-1.5 h-3 bg-white/50 rounded-full"></div>
              <div className="absolute top-2 right-1 w-0.5 h-1 bg-white/30 rounded-full"></div>
            </div>
            <div className="w-1.5 h-2 bg-amber-600 rounded-full absolute -top-1 left-1/2 transform -translate-x-1/2"></div>

            {/* 钓线连接到瓶子 */}
            <div className="absolute -top-3 left-1/2 w-px h-3 bg-gray-300 opacity-60 animate-pulse"></div>
          </div>
        </div>

        {/* 海底气泡 - 从底部上升 */}
        <div className="absolute bottom-4 left-10 animate-ping animation-delay-300">
          <div className="w-1 h-1 bg-white/60 rounded-full"></div>
        </div>
        <div className="absolute bottom-8 left-20 animate-ping animation-delay-700">
          <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
        </div>
        <div className="absolute bottom-2 left-32 animate-ping animation-delay-1200">
          <div className="w-0.5 h-0.5 bg-white/70 rounded-full"></div>
        </div>
        <div className="absolute bottom-6 left-40 animate-ping animation-delay-400">
          <div className="w-1 h-1 bg-white/55 rounded-full"></div>
        </div>

        {/* 水花效果 - 在浮标周围 */}
        <div className="absolute top-18 right-0.5 animate-pulse animation-delay-600">
          <div className="w-3 h-1 bg-white/30 rounded-full"></div>
        </div>
        <div className="absolute top-20 right-[40%] animate-pulse animation-delay-800">
          <div className="w-2 h-0.5 bg-white/25 rounded-full"></div>
        </div>

        {/* 海草摆动 */}
        <div className="absolute bottom-0 left-12 w-1 h-8 bg-green-600 opacity-60 seaweed-wave origin-bottom"></div>
        <div className="absolute bottom-0 left-24 w-0.5 h-6 bg-green-500 opacity-50 seaweed-wave origin-bottom animation-delay-1000"></div>
        <div className="absolute bottom-0 left-36 w-1 h-10 bg-green-700 opacity-70 seaweed-wave origin-bottom animation-delay-500"></div>
      </div>

      {/* 文字提示 */}
      <div className="text-center">
        <p className="text-ocean-600 font-medium mb-1 flex items-center justify-center gap-2">
          <div className="text-2xl mb-2 animate-bounce">🎣</div>
          {message || "正在海底搜寻..."}
        </p>
        {/* <div className="flex items-center justify-center gap-1">
          <div className="w-2 h-2 bg-ocean-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-ocean-400 rounded-full animate-pulse animation-delay-200"></div>
          <div className="w-2 h-2 bg-ocean-400 rounded-full animate-pulse animation-delay-400"></div>
        </div> */}
      </div>
    </div>
  );
}

// 等待发现瓶子动画
function WaitingAnimation({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* 海洋场景 */}
      <div className="relative w-full h-32 mb-8">
        {/* 海洋背景 - 分层设计（与捞取动画一致） */}
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          {/* 深海底部 */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-ocean-800 via-ocean-700 to-ocean-600"></div>

          {/* 中层海水 */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-ocean-200 via-ocean-300 to-ocean-400 opacity-90"></div>

          {/* 海面波浪效果 */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-ocean-100 to-ocean-200 animate-wave opacity-80"></div>
          <div className="absolute top-1 left-0 right-0 h-3 bg-gradient-to-b from-white/20 to-transparent animate-wave-slow"></div>
        </div>

        {/* 漂浮的瓶子们 - 更多更丰富 */}
        <div className="absolute top-4 left-8 animate-float">
          <div className="relative">
            <div className="w-8 h-10 bg-emerald-400 rounded-full shadow-lg opacity-80 transform rotate-12"></div>
            <div className="w-1 h-2 bg-amber-600 rounded-full absolute -top-1 left-1/2 transform -translate-x-1/2"></div>
          </div>
        </div>

        <div className="absolute top-8 left-24 animate-float animation-delay-1000">
          <div className="relative">
            <div className="w-6 h-8 bg-sky-400 rounded-full shadow-lg opacity-70 transform -rotate-6"></div>
            <div className="w-1 h-2 bg-amber-600 rounded-full absolute -top-1 left-1/2 transform -translate-x-1/2"></div>
          </div>
        </div>

        <div className="absolute top-2 left-40 animate-float animation-delay-2000">
          <div className="relative">
            <div className="w-7 h-9 bg-purple-400 rounded-full shadow-lg opacity-85 transform rotate-12"></div>
            <div className="w-1 h-2 bg-amber-600 rounded-full absolute -top-1 left-1/2 transform -translate-x-1/2"></div>
          </div>
        </div>

        <div className="absolute top-6 left-56 animate-float animation-delay-3000">
          <div className="relative">
            <div className="w-5 h-7 bg-rose-400 rounded-full shadow-lg opacity-75 transform -rotate-12"></div>
            <div className="w-1 h-2 bg-amber-600 rounded-full absolute -top-1 left-1/2 transform -translate-x-1/2"></div>
          </div>
        </div>

        <div className="absolute top-10 left-72 animate-float animation-delay-4000">
          <div className="relative">
            <div className="w-6 h-8 bg-teal-400 rounded-full shadow-lg opacity-60 transform rotate-8"></div>
            <div className="w-1 h-2 bg-amber-600 rounded-full absolute -top-1 left-1/2 transform -translate-x-1/2"></div>
          </div>
        </div>

        {/* 神秘光点 */}
        <div className="absolute top-6 left-12 animate-ping">
          <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
        </div>
        <div className="absolute top-12 left-32 animate-ping animation-delay-1500">
          <div className="w-1 h-1 bg-yellow-400 rounded-full"></div>
        </div>
        <div className="absolute top-4 left-52 animate-ping animation-delay-2500">
          <div className="w-2 h-2 bg-yellow-200 rounded-full"></div>
        </div>

        {/* 海底气泡 - 增加海底氛围 */}
        <div className="absolute bottom-3 left-16 animate-ping animation-delay-300">
          <div className="w-1 h-1 bg-white/60 rounded-full"></div>
        </div>
        <div className="absolute bottom-5 left-36 animate-ping animation-delay-700">
          <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
        </div>
        <div className="absolute bottom-2 left-56 animate-ping animation-delay-1200">
          <div className="w-0.5 h-0.5 bg-white/70 rounded-full"></div>
        </div>

        {/* 海草摆动 - 增加海底生态感 */}
        <div className="absolute bottom-0 left-20 w-0.5 h-6 bg-green-600 opacity-60 seaweed-wave origin-bottom"></div>
        <div className="absolute bottom-0 left-40 w-1 h-8 bg-green-500 opacity-50 seaweed-wave origin-bottom animation-delay-1000"></div>
        <div className="absolute bottom-0 left-60 w-0.5 h-5 bg-green-700 opacity-70 seaweed-wave origin-bottom animation-delay-500"></div>
      </div>

      {/* 文字提示 */}
      <div className="text-center">
        <div className="text-3xl mb-3 animate-bounce">🌊</div>
        <p className="text-ocean-700 font-medium mb-2">
          {message || "海面上漂浮着许多故事..."}
        </p>
        <p className="text-ocean-500 text-sm mb-4">点击"捞瓶子"发现惊喜</p>

        {/* 提示箭头 */}
        <div className="animate-bounce">
          <div className="w-6 h-6 border-2 border-ocean-400 border-t-transparent border-l-transparent transform rotate-45 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}

export default BottleLoadingAnimation;
