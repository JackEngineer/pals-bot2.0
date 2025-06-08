import { useState, useEffect } from "react";

interface DailyStats {
  newBottles: number;
  discoveredBottles: number;
  newReplies: number;
  date: string;
}

interface UseStatsResult {
  stats: DailyStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useStats(): UseStatsResult {
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/bottles/stats");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "获取统计数据失败");
      }

      if (result.success) {
        setStats(result.data);
      } else {
        throw new Error(result.message || "获取统计数据失败");
      }
    } catch (err) {
      console.error("获取统计数据失败:", err);
      setError(err instanceof Error ? err.message : "获取统计数据失败");
      // 设置默认数据以防止页面显示异常
      setStats({
        newBottles: 0,
        discoveredBottles: 0,
        newReplies: 0,
        date: new Date().toISOString().split("T")[0],
      });
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await fetchStats();
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refresh,
  };
}
