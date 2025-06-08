import { useState } from "react";
import { useTelegramAuth } from "./useTelegramAuth";
import { get, post } from "@/lib/request";
import { useUserStore } from "./useUserStore";
import { useRouter } from "next/navigation";

interface BottleData {
  id: string;
  content: string;
  mediaType?: "text" | "image" | "audio";
  mediaUrl?: string;
  createdAt: Date;
  userId?: string; // 添加userId字段用于聊天
  author?: {
    firstName: string;
  };
  stats?: {
    replies: number;
    discoveries: number;
  };
  bottleStyle?: {
    color: string;
    pattern: string;
    decoration: string;
  };
}

export function useBottleActions() {
  const [loading, setLoading] = useState(false);

  const { isAuthenticated, isLoading: isTelegramLoading } = useTelegramAuth();
  const user = useUserStore((state) => state.user);
  const router = useRouter();

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
  const pickBottle = async (): Promise<BottleData | null> => {
    setLoading(true);
    if (!isAuthenticated || !user) {
      setLoading(false);
      router.push("/");
      return null;
    }
    try {
      const bottle: any = await get(`/api/bottles/random?userId=${user.id}`);
      if (bottle) {
        return {
          id: bottle.id,
          content: bottle.content,
          mediaType: bottle.mediaType,
          mediaUrl: bottle.mediaUrl,
          createdAt: bottle.createdAt,
          userId: bottle.userId, // 添加userId
          author: bottle.author, // 添加author信息
          stats: bottle.stats, // 添加统计信息
          bottleStyle: bottle.bottleStyle,
        };
      }
      return null;
    } finally {
      setLoading(false); // 无论成功与否，都设置为 false
    }
  };

  return { throwBottle, pickBottle, loading };
}
