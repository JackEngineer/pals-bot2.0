"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// 轮询频率等级
export enum PollingLevel {
  PAUSED = 0, // 暂停轮询
  SLOW = 60000, // 慢速：60秒 (后台页面)
  NORMAL = 15000, // 正常：15秒 (空闲聊天)
  FAST = 5000, // 快速：5秒 (活跃聊天)
  RAPID = 2000, // 急速：2秒 (用户正在输入)
}

// 用户活动状态
export enum ActivityLevel {
  HIDDEN = "hidden", // 页面不可见
  IDLE = "idle", // 空闲状态
  ACTIVE = "active", // 活跃状态
  TYPING = "typing", // 正在输入
  VERY_ACTIVE = "very_active", // 非常活跃
}

interface PollingConfig {
  defaultInterval: PollingLevel;
  enableSmartAdjustment: boolean;
  maxInterval: PollingLevel;
  minInterval: PollingLevel;
}

interface UsePollingManagerReturn {
  currentInterval: PollingLevel;
  activityLevel: ActivityLevel;
  isPollingActive: boolean;
  setActivityLevel: (level: ActivityLevel) => void;
  pausePolling: () => void;
  resumePolling: () => void;
  forceHighFrequency: (duration?: number) => void;
}

const DEFAULT_CONFIG: PollingConfig = {
  defaultInterval: PollingLevel.NORMAL,
  enableSmartAdjustment: true,
  maxInterval: PollingLevel.SLOW,
  minInterval: PollingLevel.RAPID,
};

export function usePollingManager(
  config: Partial<PollingConfig> = {}
): UsePollingManagerReturn {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const [currentInterval, setCurrentInterval] = useState<PollingLevel>(
    finalConfig.defaultInterval
  );
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    ActivityLevel.ACTIVE
  );
  const [isPollingActive, setIsPollingActive] = useState(true);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);

  const lastActivityTime = useRef(Date.now());
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const forceHighFrequencyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 根据活动等级计算轮询间隔
  const calculateInterval = useCallback(
    (level: ActivityLevel): PollingLevel => {
      if (!finalConfig.enableSmartAdjustment) {
        return finalConfig.defaultInterval;
      }

      switch (level) {
        case ActivityLevel.HIDDEN:
          return PollingLevel.PAUSED;
        case ActivityLevel.IDLE:
          return PollingLevel.NORMAL;
        case ActivityLevel.ACTIVE:
          return PollingLevel.FAST;
        case ActivityLevel.TYPING:
          return PollingLevel.RAPID;
        case ActivityLevel.VERY_ACTIVE:
          return PollingLevel.RAPID;
        default:
          return finalConfig.defaultInterval;
      }
    },
    [finalConfig]
  );

  // 更新轮询间隔
  const updatePollingInterval = useCallback(
    (level: ActivityLevel) => {
      if (isManuallyPaused) {
        setCurrentInterval(PollingLevel.PAUSED);
        setIsPollingActive(false);
        return;
      }

      const newInterval = calculateInterval(level);

      // 确保间隔在配置的范围内
      const clampedInterval = Math.max(
        finalConfig.minInterval,
        Math.min(finalConfig.maxInterval, newInterval)
      );

      setCurrentInterval(clampedInterval);
      setIsPollingActive(clampedInterval !== PollingLevel.PAUSED);
    },
    [calculateInterval, finalConfig, isManuallyPaused]
  );

  // 监听页面可见性
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setActivityLevel(ActivityLevel.HIDDEN);
      } else {
        setActivityLevel(ActivityLevel.ACTIVE);
        lastActivityTime.current = Date.now();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // 监听用户活动（鼠标、键盘、触摸）
  useEffect(() => {
    const recordActivity = () => {
      lastActivityTime.current = Date.now();

      if (activityLevel === ActivityLevel.HIDDEN) return;

      if (activityLevel !== ActivityLevel.TYPING) {
        setActivityLevel(ActivityLevel.ACTIVE);
      }
    };

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      document.addEventListener(event, recordActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, recordActivity);
      });
    };
  }, [activityLevel]);

  // 活动状态自动降级
  useEffect(() => {
    const checkActivityLevel = () => {
      if (activityLevel === ActivityLevel.HIDDEN) return;

      const timeSinceLastActivity = Date.now() - lastActivityTime.current;

      if (timeSinceLastActivity > 300000) {
        // 5分钟无活动
        setActivityLevel(ActivityLevel.IDLE);
      } else if (timeSinceLastActivity > 60000) {
        // 1分钟无活动
        if (
          activityLevel === ActivityLevel.VERY_ACTIVE ||
          activityLevel === ActivityLevel.TYPING
        ) {
          setActivityLevel(ActivityLevel.ACTIVE);
        }
      }
    };

    if (activityTimeoutRef.current) {
      clearInterval(activityTimeoutRef.current);
    }

    activityTimeoutRef.current = setInterval(checkActivityLevel, 30000); // 每30秒检查一次

    return () => {
      if (activityTimeoutRef.current) {
        clearInterval(activityTimeoutRef.current);
      }
    };
  }, [activityLevel]);

  // 当活动等级改变时更新轮询间隔
  useEffect(() => {
    updatePollingInterval(activityLevel);
  }, [activityLevel, updatePollingInterval]);

  // 手动暂停轮询
  const pausePolling = useCallback(() => {
    setIsManuallyPaused(true);
    setCurrentInterval(PollingLevel.PAUSED);
    setIsPollingActive(false);
  }, []);

  // 恢复轮询
  const resumePolling = useCallback(() => {
    setIsManuallyPaused(false);
    updatePollingInterval(activityLevel);
  }, [activityLevel, updatePollingInterval]);

  // 强制高频轮询（用于重要操作后）
  const forceHighFrequency = useCallback(
    (duration: number = 30000) => {
      setActivityLevel(ActivityLevel.VERY_ACTIVE);

      if (forceHighFrequencyTimeoutRef.current) {
        clearTimeout(forceHighFrequencyTimeoutRef.current);
      }

      forceHighFrequencyTimeoutRef.current = setTimeout(() => {
        if (activityLevel === ActivityLevel.VERY_ACTIVE) {
          setActivityLevel(ActivityLevel.ACTIVE);
        }
      }, duration);
    },
    [activityLevel]
  );

  // 更新活动等级的函数
  const updateActivityLevel = useCallback((level: ActivityLevel) => {
    setActivityLevel(level);
    lastActivityTime.current = Date.now();
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (activityTimeoutRef.current) {
        clearInterval(activityTimeoutRef.current);
      }
      if (forceHighFrequencyTimeoutRef.current) {
        clearTimeout(forceHighFrequencyTimeoutRef.current);
      }
    };
  }, []);

  return {
    currentInterval,
    activityLevel,
    isPollingActive,
    setActivityLevel: updateActivityLevel,
    pausePolling,
    resumePolling,
    forceHighFrequency,
  };
}
