"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUserStore } from "./useUserStore";

interface UseAuthOptions {
  redirectTo?: string;
  redirectIfAuthenticated?: string;
  required?: boolean;
  enabled?: boolean;
}

interface UseAuthReturn {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}

/**
 * 增强版身份验证 Hook
 * 支持更多配置选项和功能
 */
export function useAuth({
  redirectTo = "/",
  redirectIfAuthenticated,
  required = true,
  enabled = true,
}: UseAuthOptions = {}): UseAuthReturn {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 避免在服务端执行
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!enabled || isLoading) return;

    // 如果需要登录但用户未登录
    if (required && user === null) {
      console.log("useAuth: 需要登录，重定向到:", redirectTo);
      router.push(redirectTo);
      return;
    }

    // 如果已登录但不应该在当前页面（比如登录页面）
    if (user !== null && redirectIfAuthenticated && pathname === redirectTo) {
      console.log("useAuth: 已登录，重定向到:", redirectIfAuthenticated);
      router.push(redirectIfAuthenticated);
      return;
    }
  }, [
    user,
    router,
    pathname,
    redirectTo,
    redirectIfAuthenticated,
    required,
    isLoading,
    enabled,
  ]);

  const logout = () => {
    clearUser();
    router.push(redirectTo);
  };

  return {
    user,
    isAuthenticated: user !== null,
    isLoading,
    logout,
  };
}

/**
 * 专门用于保护页面的 Hook
 */
export function useProtectedPage(redirectTo: string = "/") {
  return useAuth({
    redirectTo,
    required: true,
  });
}

/**
 * 专门用于登录页面的 Hook（已登录时重定向）
 */
export function useLoginPage(redirectTo: string = "/home") {
  return useAuth({
    redirectTo: "/",
    redirectIfAuthenticated: redirectTo,
    required: false,
  });
}

/**
 * 检查特定权限
 */
export function usePermission(permission: string) {
  const { user, isAuthenticated } = useAuth({ required: false });

  // 这里可以根据实际业务逻辑检查权限
  // 目前简单返回是否登录
  const hasPermission = isAuthenticated;

  return {
    hasPermission,
    user,
    isAuthenticated,
  };
}
