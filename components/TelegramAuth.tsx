"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useUserActions } from "@/hooks/useUserActions";
import { useUserStore } from "@/hooks/useUserStore";
import { UserInfo } from "@/hooks/useUserStore";
import { toast } from "sonner";

interface TelegramAuthProps {
  onAuthSuccess?: () => void;
}

export default function TelegramAuth({ onAuthSuccess }: TelegramAuthProps) {
  const router = useRouter();
  const {
    isLoading,
    isAuthenticated,
    user,
    error,
    autoAuthenticate,
    logout,
    clearError,
    isDevelopmentMode,
  } = useTelegramAuth();
  const { checkUser, loading } = useUserActions();
  const setUser = useUserStore((state) => state.setUser);

  // 添加初始化调试信息
  useEffect(() => {
    console.log("=== 🔍 TelegramAuth 组件初始化调试信息 ===");
    console.log("🌍 环境信息:", {
      NODE_ENV: process.env.NODE_ENV,
      isDevelopmentMode,
      hasWindow: typeof window !== "undefined",
      hostname:
        typeof window !== "undefined" ? window.location.hostname : "server",
      userAgent:
        typeof window !== "undefined"
          ? navigator.userAgent.substring(0, 100)
          : "server",
    });

    if (typeof window !== "undefined") {
      console.log("📱 Telegram 环境检测:", {
        hasTelegram: !!window.Telegram,
        hasWebApp: !!window.Telegram?.WebApp,
        platform: window.Telegram?.WebApp?.platform || "unknown",
        version: window.Telegram?.WebApp?.version || "unknown",
        colorScheme: window.Telegram?.WebApp?.colorScheme || "unknown",
        initDataLength: window.Telegram?.WebApp?.initData?.length || 0,
        initDataPreview: window.Telegram?.WebApp?.initData
          ? window.Telegram.WebApp.initData.substring(0, 100) + "..."
          : "无",
      });
    }

    console.log("🔐 认证状态:", {
      isLoading,
      isAuthenticated,
      hasUser: !!user,
      hasError: !!error,
      error: error,
    });

    if (user) {
      console.log("👤 用户信息:", {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        language_code: user.language_code,
        is_premium: user.is_premium,
        has_photo: !!user.photo_url,
      });
    }
  }, []);

  // 监听认证状态变化
  useEffect(() => {
    console.log("📊 认证状态变化:", {
      isLoading,
      isAuthenticated,
      hasUser: !!user,
      hasError: !!error,
      timestamp: new Date().toISOString(),
    });

    if (error) {
      console.error("❌ 认证错误详情:", error);
    }
  }, [isLoading, isAuthenticated, user, error]);

  useEffect(() => {
    if (isAuthenticated && onAuthSuccess) {
      console.log("✅ 认证成功，执行回调函数");
      onAuthSuccess();
    }
  }, [isAuthenticated, onAuthSuccess]);

  const handleLogin = async () => {
    console.log("=== 🚀 开始登录流程 ===");

    // 显示开始登录的toast
    toast.info("🚀 开始登录流程...");

    console.log("🔄 登录前状态检查:", {
      loading,
      hasUser: !!user,
      user: user
        ? {
            id: user.id,
            first_name: user.first_name,
            username: user.username,
          }
        : null,
    });

    if (loading) {
      console.log("⏳ 正在加载中，跳过本次登录请求");
      toast.warning("⏳ 正在处理中，请稍候...");
      return;
    }

    if (!user) {
      console.error("❌ 用户信息不存在，无法登录");
      toast.error("❌ 用户信息不存在");
      return;
    }

    // 显示用户信息
    toast.info(`👤 用户: ${user.first_name} (ID: ${user.id})`);

    try {
      console.log("🔍 调用 checkUser...");
      toast.info("🔍 正在检查用户信息...");

      const startTime = Date.now();
      const userInfo = await checkUser(user);
      const duration = Date.now() - startTime;

      console.log("📋 checkUser 完成:", {
        duration: `${duration}ms`,
        success: !!userInfo,
        userInfo,
      });

      if (!userInfo) {
        console.error("❌ checkUser 返回空值，登录中止");
        toast.error("❌ 用户信息获取失败，请重试");
        return;
      }

      toast.success(`✅ 用户检查成功`);
      console.log("💾 设置用户信息到状态管理...");
      setUser(userInfo as UserInfo);

      toast.info("🏠 准备跳转到主页...");
      console.log("🏠 准备跳转到主页...");

      // 添加延迟，让用户看到成功消息
      setTimeout(() => {
        console.log("🚀 执行路由跳转...");
        router.push("/home");
        toast.success("🎉 登录成功！正在跳转...");
      }, 1500);

      console.log("✅ 登录流程完成");
    } catch (error) {
      console.error("💥 登录流程出错:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });

      const errorMsg = error instanceof Error ? error.message : "未知错误";
      toast.error(`💥 登录失败: ${errorMsg}`);
    }
  };

  // 添加重试验证的调试
  const handleRetryAuth = () => {
    console.log("🔄 用户手动重试验证");
    autoAuthenticate();
  };

  // 添加清除错误的调试
  const handleClearError = () => {
    console.log("🧹 用户清除错误状态");
    clearError();
  };

  if (isLoading) {
    console.log("⏳ 渲染加载状态");
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-500 mb-4"></div>
        <p className="text-ocean-200">正在验证身份...</p>
        {isDevelopmentMode && (
          <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
            🚧 开发模式
          </div>
        )}
      </div>
    );
  }

  if (error) {
    console.log("❌ 渲染错误状态:", error);
    return (
      <div className="bottle-card rounded-lg p-6 max-w-md mx-auto border-l-4 border-red-400">
        {isDevelopmentMode && (
          <div className="mb-4 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded text-center">
            🚧 开发模式
          </div>
        )}
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">身份验证失败</h3>
          </div>
        </div>
        <div className="text-sm text-red-700 mb-4">{error}</div>
        <div className="flex gap-3">
          <button
            onClick={handleClearError}
            className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded-md text-sm transition-colors"
          >
            清除错误
          </button>
          <button
            onClick={handleRetryAuth}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
          >
            重试验证
          </button>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    console.log("✅ 渲染认证成功状态");
    return (
      <div className="bottle-card rounded-2xl p-6 max-w-md mx-auto shadow-lg border-l-4 border-ocean-400">
        {isDevelopmentMode && (
          <div className="mb-4 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded text-center">
            🚧 开发模式
          </div>
        )}
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-ocean-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-ocean-800">
              身份验证成功
            </h3>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            {user.photo_url && (
              <img
                src={user.photo_url}
                alt={user.first_name}
                className="h-16 w-16 rounded-full border-3 border-ocean-200 shadow-md"
              />
            )}
            <div>
              <p className="text-xl font-bold text-ocean-900">
                {user.first_name} {user.last_name || ""}
              </p>
              {user.username && (
                <p className="text-sm text-ocean-600">@{user.username}</p>
              )}
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur rounded-xl p-4 border border-ocean-200 shadow-sm">
            <dl className="space-y-3">
              <div className="flex justify-between items-center">
                <dt className="text-sm font-medium text-ocean-700">用户 ID:</dt>
                <dd className="text-sm text-ocean-900 font-mono">{user.id}</dd>
              </div>
              {user.language_code && (
                <div className="flex justify-between items-center">
                  <dt className="text-sm font-medium text-ocean-700">语言:</dt>
                  <dd className="text-sm text-ocean-900">
                    {user.language_code}
                  </dd>
                </div>
              )}
              {user.is_premium !== undefined && (
                <div className="flex justify-between items-center">
                  <dt className="text-sm font-medium text-ocean-700">
                    Premium:
                  </dt>
                  <dd className="text-sm text-ocean-900">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_premium
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-ocean-100 text-ocean-800"
                      }`}
                    >
                      {user.is_premium ? "是" : "否"}
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleLogin}
              className="flex-1 btn-ocean font-semibold py-3 px-6 rounded-xl text-lg ripple-effect"
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-ocean-500"></span>
                  <span>加载中...</span>
                </>
              ) : (
                "进入漂流瓶"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 不在 Telegram 环境中的默认状态
  console.log("🤔 渲染默认状态（非 Telegram 环境）");
  return (
    <div className="bottle-card rounded-2xl p-6 max-w-md mx-auto shadow-lg">
      {isDevelopmentMode && (
        <div className="mb-4 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded text-center">
          🚧 开发模式
        </div>
      )}
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-ocean-gradient mb-4 animate-pulse">
          <svg
            className="h-8 w-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-ocean-900 mb-3">
          {isDevelopmentMode ? "开发模式" : "请在 Telegram 中打开"}
        </h3>
        <p className="text-sm text-ocean-600 leading-relaxed">
          {isDevelopmentMode
            ? "当前运行在开发模式下，将使用模拟的 Telegram 用户数据进行身份验证。"
            : "此应用需要在 Telegram WebApp 环境中运行才能进行身份验证。"}
        </p>
      </div>
    </div>
  );
}
