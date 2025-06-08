"use client";

import { useEffect, ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/hooks/useUserStore";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

/**
 * 路由保护组件
 * 自动重定向未认证用户
 */
export function AuthGuard({
  children,
  fallback,
  redirectTo = "/",
  requireAuth = true,
}: AuthGuardProps) {
  const router = useRouter();
  const { user } = useUserStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // 避免服务端渲染时的水合问题
    setIsChecking(false);
  }, []);

  useEffect(() => {
    if (isChecking) return;

    if (requireAuth && user === null) {
      console.log("AuthGuard: 用户未登录，重定向到:", redirectTo);
      router.push(redirectTo);
    }
  }, [user, router, redirectTo, requireAuth, isChecking]);

  // 如果正在检查状态，显示加载
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ocean-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-ocean-200 border-t-ocean-500 mx-auto mb-2"></div>
          <p className="text-ocean-600 text-sm">检查登录状态...</p>
        </div>
      </div>
    );
  }

  // 如果用户未登录且需要认证，显示 fallback 或 null
  if (requireAuth && user === null) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen bg-ocean-50">
          <div className="text-center">
            <div className="text-4xl mb-4">🌊</div>
            <p className="text-ocean-600">正在跳转到登录页面...</p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}

/**
 * 简化版本，只用于必须登录的页面
 */
export function RequireAuth({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <AuthGuard requireAuth={true} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}
