import { useState } from "react";
import { useTelegramAuth } from "./useTelegramAuth";
import { post } from "@/lib/request";
import { useUserStore } from "./useUserStore";

export function useBottleActions() {
  const [loading, setLoading] = useState(false);

  const { isAuthenticated } = useTelegramAuth();
  const user = useUserStore((state) => state.user);

  // 扔瓶子
  const throwBottle = async (
    content: string,
    mediaType: string,
    mediaUrl: string,
    bottleStyle: any
  ) => {
    setLoading(true);
    if (!isAuthenticated || !user) return;
    try {
      const payload = {
        content,
        mediaType,
        mediaUrl,
        bottleStyle,
        userId: user.id,
      };
      const data = await post(`/api/bottles`, payload);
      return data;
    } finally {
      setLoading(false);
    }
  };

  // 捞瓶子
  const catchBottle = async () => {
    setLoading(true);
    try {
      // ...API 调用逻辑...
    } finally {
      setLoading(false);
    }
  };

  return { throwBottle, catchBottle, loading };
}
