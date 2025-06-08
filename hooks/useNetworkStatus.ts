"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// 网络连接类型
export enum ConnectionType {
  UNKNOWN = "unknown",
  WIFI = "wifi",
  CELLULAR = "cellular",
  ETHERNET = "ethernet",
  BLUETOOTH = "bluetooth",
  WIMAX = "wimax",
  OTHER = "other",
}

// 网络质量等级
export enum NetworkQuality {
  OFFLINE = "offline",
  POOR = "poor", // 延迟 > 2000ms
  SLOW = "slow", // 延迟 1000-2000ms
  GOOD = "good", // 延迟 500-1000ms
  EXCELLENT = "excellent", // 延迟 < 500ms
}

// 网络状态接口
interface NetworkState {
  isOnline: boolean;
  connectionType: ConnectionType;
  quality: NetworkQuality;
  latency: number | null;
  downlink: number | null; // 下行速度 (Mbps)
  effectiveType: string | null; // 有效连接类型
  saveData: boolean; // 省流量模式
  lastChecked: Date;
}

interface NetworkAdaptiveStrategy {
  recommendedPollingInterval: number;
  maxConcurrentRequests: number;
  enableRequestBatching: boolean;
  cacheTimeout: number;
}

interface UseNetworkStatusReturn {
  networkState: NetworkState;
  adaptiveStrategy: NetworkAdaptiveStrategy;
  checkLatency: () => Promise<number>;
  isNetworkSuitable: (minQuality?: NetworkQuality) => boolean;
  getOptimalPollingInterval: (baseInterval: number) => number;
}

const DEFAULT_PING_ENDPOINT = "/api/ping"; // 假设有一个ping端点
const LATENCY_CHECK_INTERVAL = 60000; // 每分钟检查一次延迟

export function useNetworkStatus(): UseNetworkStatusReturn {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    connectionType: ConnectionType.UNKNOWN,
    quality: NetworkQuality.GOOD,
    latency: null,
    downlink: null,
    effectiveType: null,
    saveData: false,
    lastChecked: new Date(),
  });

  const latencyCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const measurementHistory = useRef<number[]>([]);

  // 获取连接信息（如果支持）
  const getConnectionInfo = useCallback(() => {
    // @ts-ignore - Navigator.connection 在某些浏览器中可用
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    if (connection) {
      return {
        connectionType: mapConnectionType(connection.type),
        downlink: connection.downlink || null,
        effectiveType: connection.effectiveType || null,
        saveData: connection.saveData || false,
      };
    }

    return {
      connectionType: ConnectionType.UNKNOWN,
      downlink: null,
      effectiveType: null,
      saveData: false,
    };
  }, []);

  // 映射连接类型
  const mapConnectionType = (type: string): ConnectionType => {
    switch (type) {
      case "wifi":
        return ConnectionType.WIFI;
      case "cellular":
        return ConnectionType.CELLULAR;
      case "ethernet":
        return ConnectionType.ETHERNET;
      case "bluetooth":
        return ConnectionType.BLUETOOTH;
      case "wimax":
        return ConnectionType.WIMAX;
      default:
        return ConnectionType.UNKNOWN;
    }
  };

  // 检测网络延迟
  const checkLatency = useCallback(async (): Promise<number> => {
    try {
      const startTime = performance.now();

      // 使用一个小的API调用来测试延迟
      // 这里我们用一个简单的fetch请求，添加cache-busting参数
      const response = await fetch(`${DEFAULT_PING_ENDPOINT}?t=${Date.now()}`, {
        method: "HEAD",
        cache: "no-cache",
        signal: AbortSignal.timeout(5000), // 5秒超时
      });

      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      if (response.ok) {
        // 记录延迟历史
        measurementHistory.current.push(latency);
        if (measurementHistory.current.length > 10) {
          measurementHistory.current.shift(); // 只保留最近10次测量
        }

        return latency;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn("网络延迟检测失败:", error);
      // 返回一个高延迟值表示网络问题
      return 3000;
    }
  }, []);

  // 根据延迟计算网络质量
  const calculateNetworkQuality = useCallback(
    (latency: number): NetworkQuality => {
      if (latency < 0) return NetworkQuality.OFFLINE;
      if (latency > 2000) return NetworkQuality.POOR;
      if (latency > 1000) return NetworkQuality.SLOW;
      if (latency > 500) return NetworkQuality.GOOD;
      return NetworkQuality.EXCELLENT;
    },
    []
  );

  // 获取平均延迟
  const getAverageLatency = useCallback((): number => {
    if (measurementHistory.current.length === 0) return 1000; // 默认值

    const sum = measurementHistory.current.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / measurementHistory.current.length);
  }, []);

  // 更新网络状态
  const updateNetworkState = useCallback(async () => {
    const connectionInfo = getConnectionInfo();
    const latency = await checkLatency();
    const quality = calculateNetworkQuality(latency);

    setNetworkState({
      isOnline: navigator.onLine,
      quality,
      latency,
      lastChecked: new Date(),
      ...connectionInfo,
    });
  }, [getConnectionInfo, checkLatency, calculateNetworkQuality]);

  // 监听在线状态变化
  useEffect(() => {
    const handleOnline = () => {
      updateNetworkState();
    };

    const handleOffline = () => {
      setNetworkState((prev) => ({
        ...prev,
        isOnline: false,
        quality: NetworkQuality.OFFLINE,
        lastChecked: new Date(),
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [updateNetworkState]);

  // 监听连接变化（如果支持）
  useEffect(() => {
    // @ts-ignore
    const connection = navigator.connection;

    if (connection) {
      const handleConnectionChange = () => {
        updateNetworkState();
      };

      connection.addEventListener("change", handleConnectionChange);
      return () => {
        connection.removeEventListener("change", handleConnectionChange);
      };
    }
  }, [updateNetworkState]);

  // 定期检查延迟
  useEffect(() => {
    const scheduleLatencyCheck = () => {
      if (latencyCheckTimeoutRef.current) {
        clearTimeout(latencyCheckTimeoutRef.current);
      }

      latencyCheckTimeoutRef.current = setTimeout(() => {
        if (navigator.onLine) {
          updateNetworkState();
        }
        scheduleLatencyCheck(); // 递归调度下次检查
      }, LATENCY_CHECK_INTERVAL);
    };

    // 初始检查
    updateNetworkState();
    scheduleLatencyCheck();

    return () => {
      if (latencyCheckTimeoutRef.current) {
        clearTimeout(latencyCheckTimeoutRef.current);
      }
    };
  }, [updateNetworkState]);

  // 计算自适应策略
  const adaptiveStrategy: NetworkAdaptiveStrategy = {
    recommendedPollingInterval: (() => {
      const avgLatency = getAverageLatency();
      switch (networkState.quality) {
        case NetworkQuality.OFFLINE:
          return 0; // 暂停轮询
        case NetworkQuality.POOR:
          return Math.max(30000, avgLatency * 15); // 至少30秒
        case NetworkQuality.SLOW:
          return Math.max(15000, avgLatency * 10); // 至少15秒
        case NetworkQuality.GOOD:
          return Math.max(5000, avgLatency * 5); // 至少5秒
        case NetworkQuality.EXCELLENT:
          return Math.max(2000, avgLatency * 2); // 至少2秒
        default:
          return 10000;
      }
    })(),

    maxConcurrentRequests: (() => {
      switch (networkState.quality) {
        case NetworkQuality.OFFLINE:
        case NetworkQuality.POOR:
          return 1;
        case NetworkQuality.SLOW:
          return 2;
        case NetworkQuality.GOOD:
          return 3;
        case NetworkQuality.EXCELLENT:
          return 5;
        default:
          return 2;
      }
    })(),

    enableRequestBatching:
      networkState.quality <= NetworkQuality.SLOW || networkState.saveData,

    cacheTimeout: (() => {
      switch (networkState.quality) {
        case NetworkQuality.OFFLINE:
          return 300000; // 5分钟
        case NetworkQuality.POOR:
          return 120000; // 2分钟
        case NetworkQuality.SLOW:
          return 60000; // 1分钟
        case NetworkQuality.GOOD:
          return 30000; // 30秒
        case NetworkQuality.EXCELLENT:
          return 15000; // 15秒
        default:
          return 60000;
      }
    })(),
  };

  // 工具函数：检查网络是否适合特定操作
  const isNetworkSuitable = useCallback(
    (minQuality: NetworkQuality = NetworkQuality.SLOW): boolean => {
      if (!networkState.isOnline) return false;

      const qualityLevels = [
        NetworkQuality.OFFLINE,
        NetworkQuality.POOR,
        NetworkQuality.SLOW,
        NetworkQuality.GOOD,
        NetworkQuality.EXCELLENT,
      ];

      const currentLevel = qualityLevels.indexOf(networkState.quality);
      const requiredLevel = qualityLevels.indexOf(minQuality);

      return currentLevel >= requiredLevel;
    },
    [networkState]
  );

  // 工具函数：根据网络状态优化轮询间隔
  const getOptimalPollingInterval = useCallback(
    (baseInterval: number): number => {
      if (!networkState.isOnline) return 0;

      const multiplier = (() => {
        switch (networkState.quality) {
          case NetworkQuality.POOR:
            return 3.0; // 3倍延长
          case NetworkQuality.SLOW:
            return 2.0; // 2倍延长
          case NetworkQuality.GOOD:
            return 1.0; // 保持原有
          case NetworkQuality.EXCELLENT:
            return 0.8; // 稍微缩短
          default:
            return 1.5;
        }
      })();

      return Math.round(baseInterval * multiplier);
    },
    [networkState]
  );

  return {
    networkState,
    adaptiveStrategy,
    checkLatency,
    isNetworkSuitable,
    getOptimalPollingInterval,
  };
}
