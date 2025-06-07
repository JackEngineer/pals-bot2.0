"use client";

import { useState } from "react";

interface BottleData {
  id: string;
  content: string;
  mediaType?: "text" | "image" | "audio";
  mediaUrl?: string;
  createdAt: Date;
  bottleStyle?: {
    color: string;
    pattern: string;
    decoration: string;
  };
}

interface BottleCardProps {
  bottle: BottleData;
  onOpen?: () => void;
  onReply?: () => void;
  onThrowBack?: () => void;
  showActions?: boolean;
  isFloating?: boolean;
}

export default function BottleCard({
  bottle,
  onOpen,
  onReply,
  onThrowBack,
  showActions = true,
  isFloating = false,
}: BottleCardProps) {
  const [isOpened, setIsOpened] = useState(false);

  const handleOpen = () => {
    setIsOpened(true);
    onOpen?.();
  };

  const getBottleStyle = () => {
    const baseStyle = "bg-gradient-to-br from-ocean-400 to-ocean-600";
    return bottle.bottleStyle
      ? `bg-gradient-to-br from-${bottle.bottleStyle.color}-400 to-${bottle.bottleStyle.color}-600`
      : baseStyle;
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}天前`;
    if (diffHours > 0) return `${diffHours}小时前`;
    if (diffMins > 0) return `${diffMins}分钟前`;
    return "刚刚";
  };

  if (isFloating) {
    return (
      <div
        className={`relative cursor-pointer transition-all duration-300 hover:scale-105 ${
          isFloating ? "animate-float" : ""
        }`}
        onClick={handleOpen}
      >
        <div
          className={`w-16 h-20 relative group bottle-shape ${getBottleStyle()} shadow-lg`}
          style={{
            background: bottle.bottleStyle
              ? `linear-gradient(to bottom right, var(--tw-gradient-from), var(--tw-gradient-to))`
              : `linear-gradient(to bottom right, rgb(56 189 248), rgb(2 132 199))`,
            filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15))",
          }}
        >
          {/* 瓶子肩部 */}
          <div
            className="bottle-shoulder"
            style={{ background: "inherit" }}
          ></div>

          {/* 瓶颈 */}
          <div className="bottle-neck" style={{ background: "inherit" }}></div>

          {/* 瓶口环 */}
          <div className="bottle-rim"></div>

          {/* 软木塞 */}
          <div className="bottle-mouth"></div>

          {/* 瓶中液体 */}
          <div
            className="absolute bottom-2 left-1/2 transform -translate-x-1/2
            w-10 h-6 bg-gradient-to-t from-white/60 via-white/40 to-white/20 
            liquid-wave rounded-b-full"
          ></div>

          {/* 悬浮提示 */}
          <div
            className="absolute -top-8 left-1/2 transform -translate-x-1/2 
            opacity-0 group-hover:opacity-100 transition-opacity duration-200
            bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20"
          >
            点击打开
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bottle-card rounded-2xl p-6 transition-all duration-300 hover:shadow-xl">
      {!isOpened ? (
        <div className="text-center">
          <div className="mb-4">
            <div
              className={`inline-block w-20 h-24 relative cursor-pointer transition-transform duration-200 
              hover:scale-105 animate-float bottle-shape ${getBottleStyle()} shadow-lg`}
              onClick={handleOpen}
              style={{
                background: bottle.bottleStyle
                  ? `linear-gradient(to bottom right, var(--tw-gradient-from), var(--tw-gradient-to))`
                  : `linear-gradient(to bottom right, rgb(56 189 248), rgb(2 132 199))`,
                filter: "drop-shadow(0 6px 12px rgba(0, 0, 0, 0.15))",
              }}
            >
              {/* 瓶子肩部 */}
              <div
                className="bottle-shoulder"
                style={{ background: "inherit" }}
              ></div>

              {/* 瓶颈 */}
              <div
                className="bottle-neck"
                style={{ background: "inherit" }}
              ></div>

              {/* 瓶口环 */}
              <div className="bottle-rim"></div>

              {/* 软木塞 */}
              <div className="bottle-mouth"></div>

              {/* 瓶中液体 */}
              <div
                className="absolute bottom-3 left-1/2 transform -translate-x-1/2
                w-12 h-7 bg-gradient-to-t from-white/60 via-white/40 to-white/20 
                liquid-wave rounded-b-full"
              ></div>
            </div>
          </div>

          <p className="text-ocean-600 text-sm mb-4">
            一个神秘的漂流瓶漂到了你面前...
          </p>

          <button
            onClick={handleOpen}
            className="ocean-button px-6 py-2 rounded-xl text-sm font-medium
              bg-ocean-500 hover:bg-ocean-600 text-white transition-colors duration-200"
          >
            🔍 打开瓶子
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 瓶子内容 */}
          <div className="bg-ocean-50 rounded-xl p-4 border-l-4 border-ocean-400">
            <p className="text-ocean-800 leading-relaxed">{bottle.content}</p>

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

          {/* 时间戳 */}
          <div className="flex items-center justify-between text-xs text-ocean-500">
            <span>💫 来自远方的漂流瓶</span>
            <span>{getTimeAgo(bottle.createdAt)}</span>
          </div>

          {/* 操作按钮 */}
          {showActions && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={onReply}
                className="flex-1 bg-green-600 hover:bg-green-600 text-white 
                  py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200
                  flex items-center justify-center gap-2"
              >
                💬 回复
              </button>
              <button
                onClick={onThrowBack}
                className="flex-1 bg-ocean-400 hover:bg-ocean-600 text-white 
                  py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200
                  flex items-center justify-center gap-2"
              >
                扔回大海
              </button>
              <button
                className="bg-ocean-100 hover:bg-ocean-200 text-ocean-700 
                  py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200
                  flex items-center justify-center gap-2"
              >
                ⭐ 收藏
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
