"use client";

import { useState } from "react";
import BottleCard from "@/components/bottles/BottleCard";
import BottleEditor from "@/components/bottles/BottleEditor";
import { BottleReplyModal } from "@/components/bottles/BottleReplyModal";
import { BottleLoadingAnimation } from "@/components/bottles/BottleLoadingAnimation";
import { useBottleActions } from "@/hooks/useBottleActions";
import { useChatActions } from "@/hooks/useChatActions";
import { useStats } from "@/hooks/useStats";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import "./page.css";

// 模拟数据接口
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

export default function Home() {
  // 🔐 认证检查 - 如果用户未登录，自动重定向到登录页
  const { isAuthenticated } = useAuthRedirect();

  const [showEditor, setShowEditor] = useState(false);
  const [currentBottle, setCurrentBottle] = useState<BottleData | null>(null);
  // 回复相关状态
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyBottle, setReplyBottle] = useState<BottleData | null>(null);

  const { throwBottle, pickBottle, loading, throwLoading, pickLoading } =
    useBottleActions();
  const { replyToBottleAndChat } = useChatActions();
  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refresh: refreshStats,
  } = useStats();
  const router = useRouter();

  // 如果用户未登录，显示加载状态（实际会自动重定向）
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-ocean-light flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🌊</div>
          <p className="text-ocean-600">正在跳转到登录页面...</p>
        </div>
      </div>
    );
  }

  /**
   * 捞瓶子
   */
  const handlePickBottle = async () => {
    if (pickLoading) return;
    setCurrentBottle(null);
    const bottle = await pickBottle();
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
    await throwBottle(content, mediaType, mediaUrl, bottleStyle);
    setShowEditor(false);
    // 成功提示
    toast.success("你的瓶子已飘向远方，等待被发现");
  };

  /**
   * 回复瓶子
   */
  const handleReply = () => {
    if (currentBottle) {
      setReplyBottle(currentBottle);
      setShowReplyModal(true);
    }
  };

  /**
   * 回复漂流瓶并开始聊天
   */
  const handleReplyAndChat = async (replyContent: string) => {
    if (!replyBottle) {
      console.error("没有选中的漂流瓶");
      toast.error("系统错误，请重试");
      return;
    }

    try {
      console.log("开始回复漂流瓶:", replyBottle.id, replyContent);

      // 调用新的API，一次性完成回复和创建聊天会话
      const result = await replyToBottleAndChat(replyBottle.id, replyContent);

      if (result && result.conversation) {
        // 先显示成功提示
        toast.success("回复已发送，正在跳转聊天...");

        // 关闭弹窗并清理状态
        setShowReplyModal(false);
        setCurrentBottle(null);
        setReplyBottle(null);

        // 延迟一小段时间后跳转，让用户看到成功提示
        setTimeout(() => {
          router.push(`/chat/${result.conversation.id}`);
        }, 800);
      } else {
        // API调用成功但返回数据异常
        console.error("API返回数据异常:", result);
        toast.error("回复发送失败，请重试");
      }
    } catch (error) {
      console.error("回复并创建聊天失败:", error);

      // 根据错误类型提供更具体的错误信息
      if (error instanceof Error) {
        if (error.message.includes("网络")) {
          toast.error("网络连接失败，请检查网络后重试");
        } else if (error.message.includes("超时")) {
          toast.error("请求超时，请重试");
        } else {
          toast.error("发送失败，请重试");
        }
      } else {
        toast.error("发送失败，请重试");
      }
    }
  };

  return (
    <div className="home bg-ocean-light ocean-background pt-20">
      {/* 海洋波纹背景层 */}
      {/* <div className="absolute inset-0 bg-water-ripple opacity-30"></div> */}

      <div className="home-content relative z-10 p-4">
        <div className="max-w-lg mx-auto">
          {/* 主要操作区域 */}
          <div className="space-y-6">
            {/* 今日统计 */}
            <div className="bottle-card rounded-2xl p-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <h4 className="text-sm font-medium text-ocean-700">
                    今日海边
                  </h4>
                  {statsLoading && (
                    <div className="animate-spin w-3 h-3 border border-ocean-300 border-t-ocean-600 rounded-full"></div>
                  )}
                  {statsError && (
                    <button
                      onClick={refreshStats}
                      className="text-xs text-red-500 hover:text-red-600"
                      title="点击重新加载"
                    >
                      ⚠️
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div className="text-center">
                    <div className="text-lg text-ocean-600 mb-1">🌊</div>
                    <div className="font-semibold text-ocean-800">
                      {statsLoading ? "--" : stats?.newBottles ?? 0}
                    </div>
                    <div className="text-ocean-600">新瓶子</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg text-ocean-600 mb-1">🎣</div>
                    <div className="font-semibold text-ocean-800">
                      {statsLoading ? "--" : stats?.discoveredBottles ?? 0}
                    </div>
                    <div className="text-ocean-600">被捞起</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg text-ocean-600 mb-1">💬</div>
                    <div className="font-semibold text-ocean-800">
                      {statsLoading ? "--" : stats?.newReplies ?? 0}
                    </div>
                    <div className="text-ocean-600">新回复</div>
                  </div>
                </div>
              </div>
            </div>

            {currentBottle ? (
              <div className="space-y-4 mt-10">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-ocean-800 mb-20">
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
            ) : (
              <div className="w-full space-y-4 mt-10">
                <BottleLoadingAnimation
                  type={pickLoading ? "picking" : "waiting"}
                  message={
                    pickLoading ? "正在捞瓶子......" : "海面上漂浮着许多故事..."
                  }
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
              disabled={pickLoading}
              className="bg-aqua-500 hover:bg-aqua-600 text-white py-4 px-6 rounded-2xl
                text-center transition-all duration-200 hover:scale-105 hover:shadow-lg
                hover:shadow-aqua-500/25 active:scale-95 disabled:opacity-50
                disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="text-2xl mb-2">{pickLoading ? "🌊" : "🎣"}</div>
              <div className="font-semibold text-sm">
                {pickLoading ? "捞取中..." : "捞瓶子"}
              </div>
              <div className="text-xs opacity-80 mt-1">
                {pickLoading ? "请稍候" : "发现惊喜"}
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

      {/* 漂流瓶回复弹窗 */}
      {replyBottle && (
        <BottleReplyModal
          isOpen={showReplyModal}
          bottle={replyBottle}
          onClose={() => {
            // 关闭弹窗，并清空状态
            setShowReplyModal(false);
            // 清空回复瓶子
            setReplyBottle(null);
            // 清空当前漂流瓶
            setCurrentBottle(null);
          }}
          onReplyAndChat={handleReplyAndChat}
        />
      )}
    </div>
  );
}
