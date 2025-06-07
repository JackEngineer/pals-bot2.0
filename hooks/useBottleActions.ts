import { useState } from "react";
import { useTelegramAuth } from "./useTelegramAuth";

export function useBottleActions() {
  const [loading, setLoading] = useState(false);

  const { isAuthenticated, user } = useTelegramAuth();

  // 扔瓶子
  const throwBottle = async (
    content: string,
    mediaType: string,
    mediaUrl: string,
    bottleStyle: any
  ) => {
    console.log(content, mediaType, mediaUrl, bottleStyle);
    setLoading(true);
    try {
      console.log(isAuthenticated, user);
      // ...API 调用逻辑（如前面写的 fetch）...
      // 返回结果
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
