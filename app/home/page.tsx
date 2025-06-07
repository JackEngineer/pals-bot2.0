"use client";

import { useState, useEffect } from "react";
import BottleCard from "@/components/bottles/BottleCard";
import BottleEditor from "@/components/bottles/BottleEditor";
import { useBottleActions } from "@/hooks/useBottleActions";
import "./page.css";

// 模拟数据接口
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

export default function Home() {
  const [showEditor, setShowEditor] = useState(false);
  const [currentBottle, setCurrentBottle] = useState<BottleData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [floatingBottles, setFloatingBottles] = useState<BottleData[]>([]);

  const { throwBottle, pickBottle, loading } = useBottleActions();
  // 模拟漂流瓶数据
  const mockBottles: BottleData[] = [
    {
      id: "1",
      content:
        "今天看到海边的日落，突然想起小时候和爷爷一起看夕阳的时光。那些温暖的回忆，就像这个瓶子一样，希望能飘到需要温暖的人那里。",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
      bottleStyle: { color: "ocean", pattern: "gradient", decoration: "waves" },
    },
    {
      id: "2",
      content:
        "失恋了，心情很低落。但是生活还要继续，希望遇到这个瓶子的人都能开开心心的。愿世界温柔以待每一个善良的人。",
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5小时前
      bottleStyle: {
        color: "deepblue",
        pattern: "solid",
        decoration: "hearts",
      },
    },
    {
      id: "3",
      content:
        "今天是我的生日！虽然一个人过，但是很开心。许了一个愿望：希望所有孤独的人都能找到属于自己的那份温暖。",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1天前
      bottleStyle: { color: "aqua", pattern: "dotted", decoration: "stars" },
    },
  ];

  useEffect(() => {
    // 初始化浮动瓶子
    setFloatingBottles(mockBottles.slice(0, 3));
  }, []);

  /**
   * 捞瓶子
   */
  const handlePickBottle = async () => {
    console.log("handlePickBottle", loading);
    // if (loading) return;
    const bottle = await pickBottle();
    console.log("pickBottle", bottle);
    if (bottle) {
      setCurrentBottle(bottle);
    }
  };

  /**
   * 扔瓶子
   */
  const handleThrowBottle = async (
    content: string,
    mediaType: string = "TEXT",
    mediaUrl: string = "",
    bottleStyle: any = {
      color: "ocean",
      pattern: "gradient",
      decoration: "waves",
    }
  ) => {
    console.log("投递漂流瓶:", { content, mediaType, mediaUrl, bottleStyle });
    await throwBottle(content, mediaType, mediaUrl, bottleStyle);
    setShowEditor(false);
    // 显示成功提示（可以考虑添加toast组件）
    // toast.success("🌊 漂流瓶已经投入大海，祝它找到有缘人！");
  };

  /**
   * 回复瓶子
   */
  const handleReply = () => {
    // 跳转到聊天页面
    window.location.href = "/chat";
  };

  return (
    <div className="home min-h-screen bg-ocean-light ocean-background pb-20">
      {/* 海洋波纹背景层 */}
      <div className="absolute inset-0 bg-water-ripple opacity-30"></div>

      <div className="home-content relative z-10 p-4">
        <div className="max-w-lg mx-auto">
          {/* 主要操作区域 */}
          <div className="space-y-6">
            {/* 今日统计 */}
            <div className="bottle-card rounded-2xl p-4">
              <div className="text-center">
                <h4 className="text-sm font-medium text-ocean-700 mb-3">
                  今日海边
                </h4>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div className="text-center">
                    <div className="text-lg text-ocean-600 mb-1">🌊</div>
                    <div className="font-semibold text-ocean-800">328</div>
                    <div className="text-ocean-600">新瓶子</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg text-ocean-600 mb-1">🎣</div>
                    <div className="font-semibold text-ocean-800">156</div>
                    <div className="text-ocean-600">被捞起</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg text-ocean-600 mb-1">💬</div>
                    <div className="font-semibold text-ocean-800">89</div>
                    <div className="text-ocean-600">新回复</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 海面上的漂流瓶 */}
            {!currentBottle ? (
              <div className="bottle-card rounded-2xl p-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-ocean-800 mb-2">
                    海面上的瓶子
                  </h3>
                  <p className="text-ocean-600 text-sm">点击瓶子可以打开查看</p>
                </div>

                <div className="flex justify-center space-x-4 py-4">
                  {floatingBottles.slice(0, 3).map((bottle, index) => (
                    <div
                      key={bottle.id}
                      style={{ animationDelay: `${index * 0.5}s` }}
                    >
                      <BottleCard
                        bottle={bottle}
                        isFloating={true}
                        onOpen={() => setCurrentBottle(bottle)}
                        showActions={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-ocean-800 mb-2">
                    🎉 您发现了一个漂流瓶！
                  </h3>
                </div>
                <BottleCard
                  bottle={currentBottle}
                  onReply={handleReply}
                  showActions={true}
                  onThrowBack={() => setCurrentBottle(null)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="home-actions backdrop-blur-sm p-4 safe-area-pb">
        <div className="max-w-lg mx-auto">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowEditor(true)}
              className="bg-ocean-500 hover:bg-ocean-600 text-white py-4 px-6 rounded-2xl
                text-center transition-all duration-200 hover:scale-105 hover:shadow-lg
                hover:shadow-ocean-500/25 active:scale-95"
            >
              <div className="text-2xl mb-2">🫙</div>
              <div className="font-semibold text-sm">扔瓶子</div>
              <div className="text-xs opacity-80 mt-1">写下你想说的话</div>
            </button>

            <button
              onClick={handlePickBottle}
              disabled={loading}
              className="bg-aqua-500 hover:bg-aqua-600 text-white py-4 px-6 rounded-2xl
                text-center transition-all duration-200 hover:scale-105 hover:shadow-lg
                hover:shadow-aqua-500/25 active:scale-95 disabled:opacity-50
                disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="text-2xl mb-2">{loading ? "🌊" : "🎣"}</div>
              <div className="font-semibold text-sm">
                {loading ? "捞取中..." : "捞瓶子"}
              </div>
              <div className="text-xs opacity-80 mt-1">
                {loading ? "请稍候" : "发现惊喜"}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 漂流瓶编辑器 */}
      <BottleEditor
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        onSubmit={handleThrowBottle}
      />
    </div>
  );
}
