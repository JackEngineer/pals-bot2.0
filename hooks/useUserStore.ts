import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserInfo {
  id: string;
  telegramId: string;
  firstName: string;
  lastName: string;
  username?: string;
  // 可根据实际需要扩展更多字段
}

interface UserStore {
  user: UserInfo | null;
  isInitialized: boolean;
  setUser: (user: UserInfo) => void;
  clearUser: () => void;
  initialize: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      isInitialized: false,

      setUser: (user) => {
        console.log("🔐 用户登录:", user.firstName);
        set({ user, isInitialized: true });
      },

      clearUser: () => {
        console.log("🚪 用户登出");
        set({ user: null });

        // 自动重定向功能（可选）
        if (typeof window !== "undefined") {
          // 使用 setTimeout 避免在 setState 中直接调用路由
          setTimeout(() => {
            // 如果当前页面需要登录，则重定向
            const currentPath = window.location.pathname;
            const protectedPaths = ["/home", "/chat", "/profile", "/voices"];

            if (protectedPaths.some((path) => currentPath.startsWith(path))) {
              console.log("🔄 自动重定向到登录页");
              window.location.href = "/";
            }
          }, 100);
        }
      },

      initialize: () => {
        if (!get().isInitialized) {
          set({ isInitialized: true });
        }
      },
    }),
    {
      name: "user-storage",
      // 只持久化用户信息，不持久化初始化状态
      partialize: (state) => ({ user: state.user }),
    }
  )
);
