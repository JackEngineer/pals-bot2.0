import { useState } from "react";
import { get, post } from "@/lib/request";
import { TelegramUser } from "@/lib/telegram-auth";

export function useUserActions() {
  const [loading, setLoading] = useState(false);

  /**
   * 检查用户是否存在
   * @param telegramId telegramId
   * @returns 用户信息
   */
  const checkUser = async (user: TelegramUser) => {
    if (!user) return null;
    setLoading(true);
    try {
      const data = await get(`/api/user/telegram/${user.id}`);
      if (!data) {
        const newUser = await addUser(user);
        return newUser;
      }
      return data;
    } catch (error) {
      // const newUser = await addUser(user);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 添加用户
   * @param user 用户信息
   * @returns 用户信息
   */
  const addUser = async (user: TelegramUser) => {
    setLoading(true);
    try {
      const payload = {
        user: {
          telegramId: String(user.id),
          firstName: user.first_name || "",
          lastName: user.last_name || "",
          username: user.username || "",
        },
      };
      const data = await post(`/api/user/add`, payload);
      return data;
    } catch (error) {
      console.error(error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { checkUser, addUser, loading };
}
