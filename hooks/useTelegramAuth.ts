import { useState, useEffect, useCallback } from "react";
import { TelegramUser } from "@/lib/telegram-auth";

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
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ initData }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          user: data.user,
          error: null,
        });
        return { success: true, user: data.user };
      } else {
        const errorMsg = data.error || "身份验证失败";
        setAuthState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          error: errorMsg,
        });
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      const errorMsg = "网络请求失败，请检查网络连接";
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
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      // 在开发模式下，使用特殊标识调用真实的 API
      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ initData: "DEVELOPMENT_MODE_MOCK_DATA" }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          user: data.user,
          error: null,
        });
        return { success: true, user: data.user };
      } else {
        // 如果 API 调用失败，使用本地模拟数据
        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          user: MOCK_USER,
          error: null,
        });
        return { success: true, user: MOCK_USER };
      }
    } catch (error) {
      // 网络错误时使用本地模拟数据
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
    if (typeof window === "undefined") {
      return;
    }

    try {
      // 开发模式处理
      if (isDevelopmentMode()) {
        // 检查是否有 Telegram WebApp 环境
        if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          const initData = tg.initData;

          if (initData) {
            await authenticate(initData);
          } else {
            // 在开发模式下，如果没有真实的 initData，使用模拟数据
            console.log("开发模式：使用模拟 Telegram 数据");
            await mockAuthenticate();
          }
        } else {
          // 开发模式下没有 Telegram 环境，使用模拟数据
          console.log("开发模式：模拟 Telegram WebApp 环境");
          await mockAuthenticate();
        }
        return;
      }

      // 生产模式处理
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        const initData = tg.initData;

        if (initData) {
          await authenticate(initData);
        } else {
          setAuthState({
            isLoading: false,
            isAuthenticated: false,
            user: null,
            error: "无法获取 Telegram InitData",
          });
        }
      } else {
        setAuthState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          error: "不在 Telegram WebApp 环境中",
        });
      }
    } catch (error) {
      setAuthState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: "获取 Telegram 数据时发生错误",
      });
    }
  }, [authenticate, mockAuthenticate]);

  /**
   * 登出
   */
  const logout = useCallback(() => {
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
    setAuthState((prev) => ({ ...prev, error: null }));
  }, []);

  // 组件挂载时自动验证
  useEffect(() => {
    autoAuthenticate();
  }, [autoAuthenticate]);

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
