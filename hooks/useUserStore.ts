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
  isLoading: boolean; // 添加加载状态
  setUser: (user: UserInfo) => void;
  clearUser: () => void;
  initialize: () => void;
  setLoading: (loading: boolean) => void; // 添加设置加载状态的方法
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      isInitialized: false,
      isLoading: true, // 初始为加载状态

      setUser: (user) => {
        console.log("🔐 用户登录:", user.firstName);
        set({ user, isInitialized: true, isLoading: false });
      },

      clearUser: () => {
        console.log("🚪 用户登出");
        set({ user: null, isLoading: false });

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
          console.log("📱 初始化用户状态管理");
          set({ isInitialized: true, isLoading: false });
        }
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: "user-storage",
      // 只持久化用户信息，不持久化初始化状态
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => {
        console.log("🔄 正在恢复用户状态...");
        return (state, error) => {
          if (error) {
            console.error("❌ 状态恢复失败:", error);
          } else {
            console.log(
              "✅ 用户状态已恢复:",
              state?.user ? state.user.firstName : "无用户"
            );
            // 状态恢复完成后，设置初始化为true
            if (state) {
              state.isInitialized = true;
              state.isLoading = false;
            }
          }
        };
      },
    }
  )
);
