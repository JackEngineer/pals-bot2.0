"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// 用户活动状态
export enum UserActivityState {
  HIDDEN = "hidden", // 页面不可见
  IDLE = "idle", // 空闲状态（5分钟无活动）
  ACTIVE = "active", // 活跃状态（有用户交互）
  TYPING = "typing", // 正在输入
  VERY_ACTIVE = "very_active", // 非常活跃（频繁交互）
}

// 活动事件类型
export enum ActivityEventType {
  MOUSE_MOVE = "mousemove",
  MOUSE_DOWN = "mousedown",
  MOUSE_UP = "mouseup",
  CLICK = "click",
  KEY_DOWN = "keydown",
  KEY_UP = "keyup",
  SCROLL = "scroll",
  TOUCH_START = "touchstart",
  TOUCH_MOVE = "touchmove",
  FOCUS = "focus",
  BLUR = "blur",
  VISIBILITY_CHANGE = "visibilitychange",
}

// 活动统计
interface ActivityStats {
  mouseEvents: number;
  keyboardEvents: number;
  scrollEvents: number;
  touchEvents: number;
  focusEvents: number;
  lastActivityTime: Date;
  sessionsStartTime: Date;
}

interface ActivityConfig {
  idleThreshold: number; // 空闲阈值（毫秒）
  veryActiveThreshold: number; // 非常活跃阈值（事件数/分钟）
  typingDetectionDelay: number; // 输入检测延迟（毫秒）
  enableDetailedTracking: boolean; // 启用详细追踪
}

interface UseUserActivityReturn {
  activityState: UserActivityState;
  isVisible: boolean;
  isFocused: boolean;
  isTyping: boolean;
  activityStats: ActivityStats;
  lastActivityTime: Date;
  timeSinceLastActivity: number;
  setTypingState: (typing: boolean) => void;
  recordActivity: (type?: ActivityEventType) => void;
  resetActivity: () => void;
}

const DEFAULT_CONFIG: ActivityConfig = {
  idleThreshold: 300000, // 5分钟
  veryActiveThreshold: 30, // 30个事件/分钟
  typingDetectionDelay: 3000, // 3秒
  enableDetailedTracking: true,
};

export function useUserActivity(
  config: Partial<ActivityConfig> = {}
): UseUserActivityReturn {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const [activityState, setActivityState] = useState<UserActivityState>(
    UserActivityState.ACTIVE
  );
  const [isVisible, setIsVisible] = useState(
    typeof document !== "undefined" ? !document.hidden : true
  );
  const [isFocused, setIsFocused] = useState(
    typeof document !== "undefined" ? document.hasFocus() : true
  );
  const [isTyping, setIsTyping] = useState(false);

  const lastActivityTime = useRef(new Date());
  const activityStats = useRef<ActivityStats>({
    mouseEvents: 0,
    keyboardEvents: 0,
    scrollEvents: 0,
    touchEvents: 0,
    focusEvents: 0,
    lastActivityTime: new Date(),
    sessionsStartTime: new Date(),
  });

  const activityBuffer = useRef<
    { timestamp: number; type: ActivityEventType }[]
  >([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 记录活动事件
  const recordActivity = useCallback(
    (type: ActivityEventType = ActivityEventType.MOUSE_MOVE) => {
      const now = new Date();
      lastActivityTime.current = now;
      activityStats.current.lastActivityTime = now;

      // 更新统计
      if (finalConfig.enableDetailedTracking) {
        switch (type) {
          case ActivityEventType.MOUSE_MOVE:
          case ActivityEventType.MOUSE_DOWN:
          case ActivityEventType.MOUSE_UP:
          case ActivityEventType.CLICK:
            activityStats.current.mouseEvents++;
            break;
          case ActivityEventType.KEY_DOWN:
          case ActivityEventType.KEY_UP:
            activityStats.current.keyboardEvents++;
            break;
          case ActivityEventType.SCROLL:
            activityStats.current.scrollEvents++;
            break;
          case ActivityEventType.TOUCH_START:
          case ActivityEventType.TOUCH_MOVE:
            activityStats.current.touchEvents++;
            break;
          case ActivityEventType.FOCUS:
          case ActivityEventType.BLUR:
            activityStats.current.focusEvents++;
            break;
        }

        // 记录到活动缓冲区（用于分析活跃度）
        activityBuffer.current.push({
          timestamp: now.getTime(),
          type,
        });

        // 保持缓冲区大小（只保留最近1分钟的活动）
        const oneMinuteAgo = now.getTime() - 60000;
        activityBuffer.current = activityBuffer.current.filter(
          (event) => event.timestamp > oneMinuteAgo
        );
      }

      // 如果页面可见，更新活动状态
      if (isVisible) {
        updateActivityState();
      }
    },
    [finalConfig.enableDetailedTracking, isVisible]
  );

  // 计算活跃度级别
  const calculateActivityLevel = useCallback((): UserActivityState => {
    if (!isVisible) return UserActivityState.HIDDEN;

    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityTime.current.getTime();

    // 检查是否空闲
    if (timeSinceLastActivity > finalConfig.idleThreshold) {
      return UserActivityState.IDLE;
    }

    // 检查是否正在输入
    if (isTyping) {
      return UserActivityState.TYPING;
    }

    // 检查是否非常活跃
    if (finalConfig.enableDetailedTracking) {
      const recentEvents = activityBuffer.current.filter(
        (event) => event.timestamp > now - 60000 // 最近1分钟
      );

      if (recentEvents.length > finalConfig.veryActiveThreshold) {
        return UserActivityState.VERY_ACTIVE;
      }
    }

    return UserActivityState.ACTIVE;
  }, [isVisible, isTyping, finalConfig]);

  // 更新活动状态
  const updateActivityState = useCallback(() => {
    const newState = calculateActivityLevel();
    setActivityState(newState);
  }, [calculateActivityLevel]);

  // 设置输入状态
  const setTypingState = useCallback(
    (typing: boolean) => {
      setIsTyping(typing);

      if (typing) {
        // 清除之前的定时器
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // 设置自动停止输入状态的定时器
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, finalConfig.typingDetectionDelay);
      } else {
        // 立即停止输入状态
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    },
    [finalConfig.typingDetectionDelay]
  );

  // 重置活动统计
  const resetActivity = useCallback(() => {
    activityStats.current = {
      mouseEvents: 0,
      keyboardEvents: 0,
      scrollEvents: 0,
      touchEvents: 0,
      focusEvents: 0,
      lastActivityTime: new Date(),
      sessionsStartTime: new Date(),
    };
    activityBuffer.current = [];
    lastActivityTime.current = new Date();
  }, []);

  // 监听页面可见性变化
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsVisible(visible);

      if (visible) {
        recordActivity(ActivityEventType.VISIBILITY_CHANGE);
      } else {
        setActivityState(UserActivityState.HIDDEN);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [recordActivity]);

  // 监听焦点变化
  useEffect(() => {
    const handleFocus = () => {
      setIsFocused(true);
      recordActivity(ActivityEventType.FOCUS);
    };

    const handleBlur = () => {
      setIsFocused(false);
      recordActivity(ActivityEventType.BLUR);
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [recordActivity]);

  // 监听用户交互事件
  useEffect(() => {
    const handleMouseMove = () => recordActivity(ActivityEventType.MOUSE_MOVE);
    const handleMouseDown = () => recordActivity(ActivityEventType.MOUSE_DOWN);
    const handleClick = () => recordActivity(ActivityEventType.CLICK);
    const handleKeyDown = () => recordActivity(ActivityEventType.KEY_DOWN);
    const handleScroll = () => recordActivity(ActivityEventType.SCROLL);
    const handleTouchStart = () =>
      recordActivity(ActivityEventType.TOUCH_START);

    // 鼠标事件
    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mousedown", handleMouseDown, { passive: true });
    document.addEventListener("click", handleClick, { passive: true });

    // 键盘事件
    document.addEventListener("keydown", handleKeyDown, { passive: true });

    // 滚动事件
    document.addEventListener("scroll", handleScroll, { passive: true });

    // 触摸事件
    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("scroll", handleScroll);
      document.removeEventListener("touchstart", handleTouchStart);
    };
  }, [recordActivity]);

  // 定期检查空闲状态
  useEffect(() => {
    const checkIdleState = () => {
      updateActivityState();

      // 调度下次检查
      if (idleCheckTimeoutRef.current) {
        clearTimeout(idleCheckTimeoutRef.current);
      }

      idleCheckTimeoutRef.current = setTimeout(checkIdleState, 30000); // 每30秒检查一次
    };

    checkIdleState();

    return () => {
      if (idleCheckTimeoutRef.current) {
        clearTimeout(idleCheckTimeoutRef.current);
      }
    };
  }, [updateActivityState]);

  // 当输入状态或可见性变化时更新活动状态
  useEffect(() => {
    updateActivityState();
  }, [isTyping, isVisible, updateActivityState]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (idleCheckTimeoutRef.current) {
        clearTimeout(idleCheckTimeoutRef.current);
      }
    };
  }, []);

  // 计算距离上次活动的时间
  const timeSinceLastActivity = Date.now() - lastActivityTime.current.getTime();

  return {
    activityState,
    isVisible,
    isFocused,
    isTyping,
    activityStats: activityStats.current,
    lastActivityTime: lastActivityTime.current,
    timeSinceLastActivity,
    setTypingState,
    recordActivity,
    resetActivity,
  };
}
