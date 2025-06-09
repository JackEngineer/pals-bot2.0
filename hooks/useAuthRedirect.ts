"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "./useUserStore";

/**
 * 用户身份验证重定向 Hook
 * 当用户为 null 时自动跳转到登录页面，但要等待状态初始化完成
 */
export function useAuthRedirect(redirectTo: string = "/") {
  const router = useRouter();
  const { user, isInitialized, isLoading } = useUserStore();

  useEffect(() => {
    // 等待状态初始化完成后再判断是否需要重定向
    if (isInitialized && !isLoading) {
      // 如果用户为 null，跳转到指定路径
      if (user === null) {
        console.log("⚠️ 用户未登录，重定向到:", redirectTo);
        router.push(redirectTo);
      } else {
        console.log("✅ 用户已登录:", user.firstName);
      }
    } else {
      console.log("⏳ 等待状态初始化...", { isInitialized, isLoading });
    }
  }, [user, isInitialized, isLoading, router, redirectTo]);

  return {
    user,
    isAuthenticated: user !== null,
    isLoading: !isInitialized || isLoading,
  };
}

/**
 * 简化版本，只检查是否需要重定向
 */
export function useRequireAuth(redirectTo: string = "/") {
  const { user, isLoading } = useAuthRedirect(redirectTo);
  return { user, isLoading };
}
