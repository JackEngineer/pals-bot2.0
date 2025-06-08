/**
 * 认证系统配置
 */
export const AUTH_CONFIG = {
  // 重定向路径
  routes: {
    // 未登录时重定向的页面
    login: "/",
    // 登录成功后默认重定向的页面
    afterLogin: "/home",
    // 退出登录后重定向的页面
    afterLogout: "/",
  },

  // 路由分类
  pages: {
    // 需要登录才能访问的页面
    protected: ["/home", "/chat", "/chat/[id]", "/profile", "/voices"],

    // 已登录用户不应该访问的页面（如登录页）
    guestOnly: ["/"],

    // 完全公开的页面
    public: ["/about", "/privacy", "/terms", "/test-icons", "/auth-test"],
  },

  // 特殊配置
  settings: {
    // 是否启用自动重定向
    enableAutoRedirect: true,
    // 重定向延迟（毫秒）
    redirectDelay: 100,
    // 是否在控制台输出调试信息
    enableDebugLogs: process.env.NODE_ENV === "development",
  },
} as const;

/**
 * 检查路径是否需要认证
 */
export function isProtectedRoute(pathname: string): boolean {
  return (AUTH_CONFIG.pages.protected as readonly string[]).some((route) => {
    // 处理动态路由，如 [id]
    const routePattern = route.replace(/\[.*?\]/g, "[^/]+");
    const regex = new RegExp(`^${routePattern}$`);
    return regex.test(pathname);
  });
}

/**
 * 检查路径是否只允许访客访问
 */
export function isGuestOnlyRoute(pathname: string): boolean {
  return (AUTH_CONFIG.pages.guestOnly as readonly string[]).includes(pathname);
}

/**
 * 检查路径是否是公开路径
 */
export function isPublicRoute(pathname: string): boolean {
  return (AUTH_CONFIG.pages.public as readonly string[]).includes(pathname);
}

/**
 * 获取用户登录后应该重定向的页面
 */
export function getRedirectAfterLogin(intendedPath?: string): string {
  // 如果有预期访问的页面且是受保护的路径，重定向到该页面
  if (intendedPath && isProtectedRoute(intendedPath)) {
    return intendedPath;
  }

  // 否则重定向到默认页面
  return AUTH_CONFIG.routes.afterLogin;
}

/**
 * 记录和获取用户尝试访问的路径
 */
export class RedirectManager {
  private static readonly STORAGE_KEY = "auth_intended_path";

  /**
   * 保存用户尝试访问的路径
   */
  static saveIntendedPath(path: string) {
    if (typeof window !== "undefined" && isProtectedRoute(path)) {
      sessionStorage.setItem(this.STORAGE_KEY, path);
    }
  }

  /**
   * 获取并清除保存的路径
   */
  static getAndClearIntendedPath(): string | null {
    if (typeof window !== "undefined") {
      const path = sessionStorage.getItem(this.STORAGE_KEY);
      if (path) {
        sessionStorage.removeItem(this.STORAGE_KEY);
        return path;
      }
    }
    return null;
  }

  /**
   * 清除保存的路径
   */
  static clearIntendedPath() {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(this.STORAGE_KEY);
    }
  }
}

/**
 * 日志工具
 */
export function authLog(message: string, ...args: any[]) {
  if (AUTH_CONFIG.settings.enableDebugLogs) {
    console.log(`[Auth] ${message}`, ...args);
  }
}
