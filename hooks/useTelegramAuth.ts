import { useState, useEffect } from "react";
import {
  getTelegramInitData,
  parseInitData,
  TelegramUser,
  TelegramInitData,
} from "@/lib/telegram-auth";

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: TelegramUser | null;
  error: string | null;
  initData: TelegramInitData | null;
}

interface AuthResponse {
  success: boolean;
  user?: TelegramUser;
  authDate?: number;
  error?: string;
}

export function useTelegramAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    error: null,
    initData: null,
  });

  const authenticate = async (initDataString?: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // 获取 InitData
      const initData = initDataString || getTelegramInitData();

      if (!initData) {
        setAuthState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          error: "无法获取Telegram初始化数据",
          initData: null,
        });
        return;
      }

      // 解析 InitData
      const parsedData = parseInitData(initData);

      // 发送到服务器验证
      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ initData }),
      });

      const result: AuthResponse = await response.json();

      if (result.success && result.user) {
        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          user: result.user,
          error: null,
          initData: parsedData,
        });
      } else {
        setAuthState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          error: result.error || "认证失败",
          initData: parsedData,
        });
      }
    } catch (error) {
      setAuthState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: "网络错误或服务器错误",
        initData: null,
      });
    }
  };

  const logout = () => {
    setAuthState({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      error: null,
      initData: null,
    });
  };

  // 自动认证
  useEffect(() => {
    authenticate();
  }, []);

  return {
    ...authState,
    authenticate,
    logout,
    retry: () => authenticate(),
  };
}
