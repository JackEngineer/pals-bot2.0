"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "./useUserStore";

/**
 * 用户身份验证重定向 Hook
 * 当用户为 null 时自动跳转到登录页面
 */
export function useAuthRedirect(redirectTo: string = "/") {
  const router = useRouter();
  const { user } = useUserStore();

  useEffect(() => {
    // 如果用户为 null，跳转到指定路径
    if (user === null) {
      console.log("用户未登录，重定向到:", redirectTo);
      router.push(redirectTo);
    }
  }, [user, router, redirectTo]);

  return {
    user,
    isAuthenticated: user !== null,
  };
}

/**
 * 简化版本，只检查是否需要重定向
 */
export function useRequireAuth(redirectTo: string = "/") {
  const { user } = useAuthRedirect(redirectTo);
  return user;
}
