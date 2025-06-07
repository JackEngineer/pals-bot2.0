"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useTelegramAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ocean-light ocean-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-ocean-light ocean-background p-4">
      {/* 海洋波纹背景层 */}
      <div className="absolute inset-0 bg-water-ripple opacity-20"></div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="bottle-card rounded-2xl p-6 mb-6 animate-float">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {user.photo_url && (
                <img
                  src={user.photo_url}
                  alt={user.first_name}
                  className="h-16 w-16 rounded-full border-4 border-ocean-200"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-ocean-900">
                  欢迎，{user.first_name} {user.last_name || ""}！
                </h1>
                {user.username && (
                  <p className="text-ocean-600">@{user.username}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => router.push("/")}
              className="btn-ocean px-4 py-2 rounded-lg ripple-effect"
            >
              返回首页
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 漂流瓶功能 */}
          <div
            className="bottle-card rounded-2xl p-6 animate-float"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-ocean-100 rounded-full flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-ocean-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-ocean-900 ml-3">
                发送漂流瓶
              </h2>
            </div>
            <p className="text-ocean-700 mb-4">
              将你的想法装进漂流瓶，让它漂向远方
            </p>
            <button className="w-full bg-ocean-500 hover:bg-ocean-600 text-white py-2 px-4 rounded-lg transition-colors">
              写一个漂流瓶
            </button>
          </div>

          {/* 接收漂流瓶 */}
          <div
            className="bottle-card rounded-2xl p-6 animate-float"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-aqua-100 rounded-full flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-aqua-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-ocean-900 ml-3">
                捡漂流瓶
              </h2>
            </div>
            <p className="text-ocean-700 mb-4">
              看看海边冲上来了什么有趣的漂流瓶
            </p>
            <button className="w-full bg-aqua-500 hover:bg-aqua-600 text-white py-2 px-4 rounded-lg transition-colors">
              去海边捡瓶子
            </button>
          </div>

          {/* 我的漂流瓶 */}
          <div
            className="bottle-card rounded-2xl p-6 animate-float"
            style={{ animationDelay: "0.6s" }}
          >
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-deepblue-100 rounded-full flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-deepblue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-ocean-900 ml-3">
                我的记录
              </h2>
            </div>
            <p className="text-ocean-700 mb-4">查看你发送的和收到的漂流瓶</p>
            <button className="w-full bg-deepblue-500 hover:bg-deepblue-600 text-white py-2 px-4 rounded-lg transition-colors">
              查看记录
            </button>
          </div>
        </div>

        {/* 统计信息 */}
        <div
          className="bottle-card rounded-2xl p-6 mt-6 animate-float"
          style={{ animationDelay: "0.8s" }}
        >
          <h2 className="text-xl font-semibold text-ocean-900 mb-4">
            使用统计
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-ocean-50 rounded-xl">
              <div className="text-2xl font-bold text-ocean-600">0</div>
              <div className="text-sm text-ocean-700">发送的瓶子</div>
            </div>
            <div className="text-center p-4 bg-aqua-50 rounded-xl">
              <div className="text-2xl font-bold text-aqua-600">0</div>
              <div className="text-sm text-aqua-700">收到的瓶子</div>
            </div>
            <div className="text-center p-4 bg-deepblue-50 rounded-xl">
              <div className="text-2xl font-bold text-deepblue-600">0</div>
              <div className="text-sm text-deepblue-700">获得的回复</div>
            </div>
            <div className="text-center p-4 bg-ocean-100 rounded-xl">
              <div className="text-2xl font-bold text-ocean-700">0</div>
              <div className="text-sm text-ocean-800">海洋里的瓶子</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
