import { create } from "zustand";

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
  setUser: (user: UserInfo) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
