"use client";

import { useEffect, useState } from "react";
import TelegramAuth from "@/components/TelegramAuth";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";

// 声明 Telegram WebApp 类型
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        MainButton: {
          setText: (text: string) => void;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
        };
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            username?: string;
          };
        };
        themeParams: any;
      };
    };
  }
}

export default function Home() {
  // 使用经过验证的认证信息
  const { isAuthenticated, user: authenticatedUser } = useTelegramAuth();

  const [bottles, setBottles] = useState<string[]>([
    "今天天气真好，希望你也是 🌞",
    "一个人的时候，特别想念有人陪伴的感觉",
    "刚看完一部电影，感动得哭了",
    "加油！明天会更好的！",
    "想要一个拥抱 🫂",
  ]);
  const [currentBottle, setCurrentBottle] = useState<string>("");
  const [newMessage, setNewMessage] = useState<string>("");

  useEffect(() => {
    // 初始化 Telegram WebApp
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      // 配置主按钮
      tg.MainButton.setText("投递漂流瓶");
      tg.MainButton.onClick(() => {
        if (newMessage.trim()) {
          handleSendBottle();
        }
      });
    }
  }, []);

  useEffect(() => {
    // 根据输入内容显示/隐藏主按钮
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      if (newMessage.trim()) {
        tg.MainButton.show();
      } else {
        tg.MainButton.hide();
      }
    }
  }, [newMessage]);

  const getRandomBottle = () => {
    const randomIndex = Math.floor(Math.random() * bottles.length);
    setCurrentBottle(bottles[randomIndex]);
  };

  const handleSendBottle = () => {
    if (newMessage.trim()) {
      setBottles([...bottles, newMessage]);
      setNewMessage("");
      alert("漂流瓶投递成功！🍃");

      // 隐藏主按钮
      if (typeof window !== "undefined" && window.Telegram?.WebApp) {
        window.Telegram.WebApp.MainButton.hide();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 p-4">
      <div className="max-w-md mx-auto">
        {/* 用户信息 */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-blue-800 mb-4">
            🍃 漂流瓶 🍃
          </h1>
          {/* 只在认证成功时显示用户信息 */}
          {isAuthenticated && authenticatedUser && (
            <p className="text-blue-600 mb-4">
              欢迎, {authenticatedUser.first_name}!
            </p>
          )}

          {/* Telegram 认证状态 */}
          <TelegramAuth />
        </div>

        {/* 发现漂流瓶 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-center">发现漂流瓶</h2>

          {currentBottle ? (
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-gray-700 italic">"{currentBottle}"</p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
              <p className="text-gray-500">点击下方按钮发现漂流瓶...</p>
            </div>
          )}

          <button
            onClick={getRandomBottle}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
          >
            🌊 捞起漂流瓶
          </button>
        </div>

        {/* 投递漂流瓶 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-center">投递漂流瓶</h2>

          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="写下你想说的话..."
            className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={200}
          />

          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">
              {newMessage.length}/200
            </span>
          </div>

          {/* 在非 Telegram 环境中显示投递按钮 */}
          {typeof window !== "undefined" && !window.Telegram?.WebApp && (
            <button
              onClick={handleSendBottle}
              disabled={!newMessage.trim()}
              className="w-full mt-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg transition-colors"
            >
              🚀 投递漂流瓶
            </button>
          )}
        </div>

        {/* 统计信息 */}
        <div className="mt-6 text-center text-blue-600">
          <p className="text-sm">
            海洋中共有 {bottles.length} 个漂流瓶在漂流...
          </p>
        </div>
      </div>
    </div>
  );
}
