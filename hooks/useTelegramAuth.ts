import { useState, useEffect, useCallback } from "react";
import { TelegramUser } from "@/lib/telegram-auth";
import { toast } from "sonner";

/**
 * 身份验证状态接口
 */
interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: TelegramUser | null;
  error: string | null;
}

/**
 * 开发模式模拟用户数据
 */
const MOCK_USER: TelegramUser = {
  id: 123456789,
  first_name: "张",
  last_name: "三",
  username: "zhangsan",
  language_code: "zh",
  is_premium: false,
  photo_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan",
};

/**
 * 检查是否为开发模式
 */
const isDevelopmentMode = () => {
  return (
    process.env.NODE_ENV === "development" ||
    (typeof window !== "undefined" && window.location.hostname === "localhost")
  );
};

/**
 * Telegram 身份验证 Hook
 */
export function useTelegramAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    error: null,
  });

  /**
   * 执行身份验证
   */
  const authenticate = useCallback(async (initData: string) => {
    console.log("=== 🔐 开始身份验证 ===");
    console.log("📝 InitData 信息:", {
      length: initData.length,
      preview: initData.substring(0, 50) + "...",
      timestamp: new Date().toISOString(),
    });

    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log("🌐 发送认证请求到 /api/auth/telegram");
      const requestStartTime = Date.now();

      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ initData }),
      });

      const requestDuration = Date.now() - requestStartTime;
      console.log("📡 认证请求完成:", {
        status: response.status,
        statusText: response.statusText,
        duration: `${requestDuration}ms`,
        headers: Object.fromEntries(response.headers.entries()),
      });

      const data = await response.json();
      console.log("📋 认证响应数据:", {
        success: data.success,
        hasUser: !!data.user,
        error: data.error,
        message: data.message,
        user: data.user
          ? {
              id: data.user.id,
              first_name: data.user.first_name,
              username: data.user.username,
            }
          : null,
      });

      if (response.ok && data.success) {
        console.log("✅ 身份验证成功");
        toast.success(`✅ 身份验证成功: ${data.user.first_name}`);
        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          user: data.user,
          error: null,
        });
        return { success: true, user: data.user };
      } else {
        const errorMsg = data.error || "身份验证失败";
        console.error("❌ 身份验证失败:", {
          error: errorMsg,
          status: response.status,
          fullResponse: data,
        });

        toast.error(`❌ 身份验证失败: ${errorMsg}`);
        setAuthState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          error: errorMsg,
        });
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      console.error("💥 认证请求异常:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });

      const errorMsg = "网络请求失败，请检查网络连接";
      toast.error(`💥 ${errorMsg}`);
      setAuthState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: errorMsg,
      });
      return { success: false, error: errorMsg };
    }
  }, []);

  /**
   * 开发模式模拟登录
   */
  const mockAuthenticate = useCallback(async () => {
    console.log("=== 🧪 开发模式模拟认证 ===");
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    // 模拟网络延迟
    console.log("⏳ 模拟网络延迟 1000ms...");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      console.log("🌐 发送开发模式认证请求");
      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ initData: "DEVELOPMENT_MODE_MOCK_DATA" }),
      });

      const data = await response.json();
      console.log("📋 开发模式响应:", {
        status: response.status,
        success: data.success,
        message: data.message,
        hasUser: !!data.user,
      });

      if (response.ok && data.success) {
        console.log("✅ 开发模式认证成功");
        toast.success(`✅ 模拟认证成功: ${data.user.first_name}`);
        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          user: data.user,
          error: null,
        });
        return { success: true, user: data.user };
      } else {
        console.log("⚠️ API 调用失败，使用本地模拟数据");
        toast.info("⚠️ 使用本地模拟数据");
        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          user: MOCK_USER,
          error: null,
        });
        return { success: true, user: MOCK_USER };
      }
    } catch (error) {
      console.error("🔄 网络错误，回退到本地模拟数据:", error);
      toast.info("🔄 使用本地模拟数据");
      setAuthState({
        isLoading: false,
        isAuthenticated: true,
        user: MOCK_USER,
        error: null,
      });
      return { success: true, user: MOCK_USER };
    }
  }, []);

  /**
   * 自动从 Telegram WebApp 获取 InitData 并验证
   */
  const autoAuthenticate = useCallback(async () => {
    console.log("=== 🚀 自动身份验证开始 ===");

    if (typeof window === "undefined") {
      console.log("🖥️ 服务端渲染环境，跳过认证");
      return;
    }

    try {
      const devMode = isDevelopmentMode();
      console.log("🔍 环境检测:", {
        isDevelopmentMode: devMode,
        hostname: window.location.hostname,
        userAgent: navigator.userAgent.substring(0, 100),
      });

      // 显示认证开始的toast
      toast.info("🔐 开始身份验证...");

      // 开发模式处理
      if (devMode) {
        console.log("🛠️ 开发模式处理");
        toast.info("🛠️ 开发模式");

        // 检查是否有 Telegram WebApp 环境
        if (window.Telegram?.WebApp) {
          console.log("📱 检测到 Telegram WebApp 环境");
          const tg = window.Telegram.WebApp;
          const initData = tg.initData;

          console.log("📊 Telegram WebApp 信息:", {
            platform: tg.platform,
            version: tg.version,
            colorScheme: tg.colorScheme,
            hasInitData: !!initData,
            initDataLength: initData?.length || 0,
          });

          if (initData) {
            console.log("✅ 找到真实 InitData，使用真实认证");
            toast.info("📱 使用真实 Telegram 数据");
            await authenticate(initData);
          } else {
            console.log("⚠️ 没有 InitData，使用模拟认证");
            toast.info("🧪 使用模拟数据");
            await mockAuthenticate();
          }
        } else {
          console.log("🤖 没有 Telegram 环境，使用模拟认证");
          toast.info("🤖 模拟 Telegram 环境");
          await mockAuthenticate();
        }
        return;
      }

      // 生产模式处理
      console.log("🏭 生产模式处理");
      toast.info("🏭 生产模式认证");

      if (window.Telegram?.WebApp) {
        console.log("📱 检测到 Telegram WebApp 环境");
        const tg = window.Telegram.WebApp;
        const initData = tg.initData;

        console.log("📊 生产模式 Telegram 信息:", {
          platform: tg.platform,
          version: tg.version,
          hasInitData: !!initData,
          initDataLength: initData?.length || 0,
        });

        if (initData) {
          console.log("✅ 找到 InitData，开始认证");
          toast.info("📱 正在验证 Telegram 数据...");
          await authenticate(initData);
        } else {
          console.error("❌ 无法获取 Telegram InitData");
          const errorMsg = "无法获取 Telegram InitData";
          toast.error(`❌ ${errorMsg}`);
          setAuthState({
            isLoading: false,
            isAuthenticated: false,
            user: null,
            error: errorMsg,
          });
        }
      } else {
        console.error("❌ 不在 Telegram WebApp 环境中");
        const errorMsg = "不在 Telegram WebApp 环境中";
        toast.error(`❌ ${errorMsg}`);
        setAuthState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          error: errorMsg,
        });
      }
    } catch (error) {
      console.error("💥 自动认证过程中发生错误:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      const errorMsg = "获取 Telegram 数据时发生错误";
      toast.error(`💥 ${errorMsg}`);
      setAuthState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: errorMsg,
      });
    }
  }, [authenticate, mockAuthenticate]);

  /**
   * 登出
   */
  const logout = useCallback(() => {
    console.log("🚪 用户登出");
    setAuthState({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      error: null,
    });
  }, []);

  /**
   * 清除错误状态
   */
  const clearError = useCallback(() => {
    console.log("🧹 清除错误状态");
    setAuthState((prev) => ({ ...prev, error: null }));
  }, []);

  // 组件挂载时自动验证
  useEffect(() => {
    console.log("🎬 useTelegramAuth hook 初始化，开始自动认证");
    autoAuthenticate();
  }, [autoAuthenticate]);

  // 监听状态变化
  useEffect(() => {
    console.log("📊 认证状态更新:", {
      isLoading: authState.isLoading,
      isAuthenticated: authState.isAuthenticated,
      hasUser: !!authState.user,
      hasError: !!authState.error,
      error: authState.error,
      timestamp: new Date().toISOString(),
    });
  }, [authState]);

  return {
    ...authState,
    authenticate,
    autoAuthenticate,
    logout,
    clearError,
    isDevelopmentMode: isDevelopmentMode(),
  };
}

// 声明 Telegram WebApp 类型
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: any;
        version: string;
        platform: string;
        colorScheme: "light" | "dark";
        themeParams: any;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        isClosingConfirmationEnabled: boolean;
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: any;
        BackButton: any;
        SettingsButton: any;
        HapticFeedback: any;
        showAlert: (message: string) => void;
        showConfirm: (
          message: string,
          callback: (confirmed: boolean) => void
        ) => void;
        showPopup: (params: any, callback?: (buttonId: string) => void) => void;
        showScanQrPopup: (
          params: any,
          callback?: (text: string) => void
        ) => void;
        closeScanQrPopup: () => void;
        readTextFromClipboard: (callback: (text: string) => void) => void;
      };
    };
  }
}
