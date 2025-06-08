"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

/**
 * 渐进式提示系统
 * 智能分级提示，自动管理提示的显示、持续时间和用户交互
 */

// 提示级别
export enum AlertLevel {
  INFO = "info",
  SUCCESS = "success",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

// 提示位置
export enum AlertPosition {
  TOP_LEFT = "top-left",
  TOP_CENTER = "top-center",
  TOP_RIGHT = "top-right",
  BOTTOM_LEFT = "bottom-left",
  BOTTOM_CENTER = "bottom-center",
  BOTTOM_RIGHT = "bottom-right",
  CENTER = "center",
}

// 提示行为
export enum AlertBehavior {
  PERSISTENT = "persistent", // 持久化，需要手动关闭
  AUTO_DISMISS = "auto_dismiss", // 自动消失
  SMART = "smart", // 智能模式，根据级别决定
  PROGRESSIVE = "progressive", // 渐进式，先短时间显示，然后可选择持久化
}

// 操作按钮
export interface AlertAction {
  id: string;
  label: string;
  action: () => void | Promise<void>;
  type: "primary" | "secondary" | "danger";
  shortcut?: string; // 键盘快捷键
  loading?: boolean;
}

// 提示内容
export interface Alert {
  id: string;
  level: AlertLevel;
  title: string;
  message: string;
  description?: string;
  actions?: AlertAction[];
  behavior: AlertBehavior;
  duration?: number; // 毫秒，仅在AUTO_DISMISS或SMART模式有效
  position?: AlertPosition;
  showProgress?: boolean; // 显示倒计时进度条
  icon?: React.ReactNode;
  persistent?: boolean; // 是否在页面刷新后保持
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt?: number;
  dismissedAt?: number;
}

// 提示组配置
export interface AlertGroupConfig {
  maxVisible: number; // 最大同时显示数量
  stackDirection: "up" | "down"; // 堆叠方向
  defaultDuration: Record<AlertLevel, number>; // 各级别默认持续时间
  enableSound?: boolean; // 是否启用声音
  enableVibration?: boolean; // 是否启用震动
  respectDarkMode?: boolean; // 是否适配暗色模式
}

// 默认配置
const DEFAULT_CONFIG: AlertGroupConfig = {
  maxVisible: 5,
  stackDirection: "up",
  defaultDuration: {
    [AlertLevel.INFO]: 4000,
    [AlertLevel.SUCCESS]: 3000,
    [AlertLevel.WARNING]: 6000,
    [AlertLevel.ERROR]: 8000,
    [AlertLevel.CRITICAL]: 0, // 不自动消失
  },
  enableSound: false,
  enableVibration: false,
  respectDarkMode: true,
};

// 国际化支持
interface I18nMessages {
  close: string;
  dismiss: string;
  retry: string;
  confirm: string;
  cancel: string;
  learnMore: string;
  showDetails: string;
  hideDetails: string;
  timeRemaining: string;
}

const DEFAULT_MESSAGES: I18nMessages = {
  close: "关闭",
  dismiss: "忽略",
  retry: "重试",
  confirm: "确认",
  cancel: "取消",
  learnMore: "了解更多",
  showDetails: "显示详情",
  hideDetails: "隐藏详情",
  timeRemaining: "剩余时间",
};

// 位置样式映射
const getPositionStyles = (position: AlertPosition) => {
  const baseStyles = "fixed z-50 pointer-events-none";

  switch (position) {
    case AlertPosition.TOP_LEFT:
      return `${baseStyles} top-4 left-4`;
    case AlertPosition.TOP_CENTER:
      return `${baseStyles} top-4 left-1/2 transform -translate-x-1/2`;
    case AlertPosition.TOP_RIGHT:
      return `${baseStyles} top-4 right-4`;
    case AlertPosition.BOTTOM_LEFT:
      return `${baseStyles} bottom-4 left-4`;
    case AlertPosition.BOTTOM_CENTER:
      return `${baseStyles} bottom-4 left-1/2 transform -translate-x-1/2`;
    case AlertPosition.BOTTOM_RIGHT:
      return `${baseStyles} bottom-4 right-4`;
    case AlertPosition.CENTER:
      return `${baseStyles} top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`;
    default:
      return `${baseStyles} top-4 right-4`;
  }
};

// 级别样式映射
const getLevelStyles = (level: AlertLevel, darkMode: boolean = false) => {
  const base = darkMode ? "dark:" : "";

  switch (level) {
    case AlertLevel.INFO:
      return {
        bg: `${base}bg-blue-50 ${base}border-blue-200`,
        text: `${base}text-blue-900`,
        accent: `${base}text-blue-600`,
        icon: `${base}text-blue-500`,
        progress: `${base}bg-blue-500`,
      };
    case AlertLevel.SUCCESS:
      return {
        bg: `${base}bg-green-50 ${base}border-green-200`,
        text: `${base}text-green-900`,
        accent: `${base}text-green-600`,
        icon: `${base}text-green-500`,
        progress: `${base}bg-green-500`,
      };
    case AlertLevel.WARNING:
      return {
        bg: `${base}bg-yellow-50 ${base}border-yellow-200`,
        text: `${base}text-yellow-900`,
        accent: `${base}text-yellow-600`,
        icon: `${base}text-yellow-500`,
        progress: `${base}bg-yellow-500`,
      };
    case AlertLevel.ERROR:
      return {
        bg: `${base}bg-red-50 ${base}border-red-200`,
        text: `${base}text-red-900`,
        accent: `${base}text-red-600`,
        icon: `${base}text-red-500`,
        progress: `${base}bg-red-500`,
      };
    case AlertLevel.CRITICAL:
      return {
        bg: `${base}bg-red-100 ${base}border-red-300`,
        text: `${base}text-red-900`,
        accent: `${base}text-red-700`,
        icon: `${base}text-red-600`,
        progress: `${base}bg-red-600`,
      };
    default:
      return {
        bg: `${base}bg-gray-50 ${base}border-gray-200`,
        text: `${base}text-gray-900`,
        accent: `${base}text-gray-600`,
        icon: `${base}text-gray-500`,
        progress: `${base}bg-gray-500`,
      };
  }
};

// 图标组件
const AlertIcon = ({
  level,
  className = "",
}: {
  level: AlertLevel;
  className?: string;
}) => {
  const iconClass = `w-5 h-5 ${className}`;

  switch (level) {
    case AlertLevel.INFO:
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      );

    case AlertLevel.SUCCESS:
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );

    case AlertLevel.WARNING:
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );

    case AlertLevel.ERROR:
    case AlertLevel.CRITICAL:
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );

    default:
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      );
  }
};

// 进度条组件
const ProgressBar = ({
  progress,
  className = "",
  color = "bg-blue-500",
}: {
  progress: number;
  className?: string;
  color?: string;
}) => (
  <div className={`w-full bg-gray-200 rounded-full h-1 ${className}`}>
    <div
      className={`h-1 rounded-full transition-all duration-100 ease-linear ${color}`}
      style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
    />
  </div>
);

// 单个提示组件
const AlertComponent = ({
  alert,
  onClose,
  onAction,
  messages = DEFAULT_MESSAGES,
  showProgress = false,
  progress = 0,
  darkMode = false,
}: {
  alert: Alert;
  onClose: (id: string) => void;
  onAction: (alertId: string, actionId: string) => void;
  messages?: I18nMessages;
  showProgress?: boolean;
  progress?: number;
  darkMode?: boolean;
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {}
  );

  const styles = getLevelStyles(alert.level, darkMode);

  const handleAction = async (action: AlertAction) => {
    setActionLoading((prev) => ({ ...prev, [action.id]: true }));

    try {
      await action.action();
      onAction(alert.id, action.id);
    } catch (error) {
      console.error("操作执行失败:", error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [action.id]: false }));
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // ESC 键关闭
    if (event.key === "Escape") {
      onClose(alert.id);
      return;
    }

    // 快捷键处理
    if (alert.actions) {
      for (const action of alert.actions) {
        if (action.shortcut && event.key === action.shortcut) {
          event.preventDefault();
          handleAction(action);
          return;
        }
      }
    }
  };

  return (
    <div
      className={`pointer-events-auto max-w-sm w-full bg-white border rounded-lg shadow-lg ${styles.bg} ${styles.text} border-2`}
      role="alert"
      aria-live={alert.level === AlertLevel.CRITICAL ? "assertive" : "polite"}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* 进度条 */}
      {(showProgress || alert.showProgress) && (
        <ProgressBar
          progress={progress}
          color={styles.progress}
          className="mb-0 rounded-t-lg"
        />
      )}

      <div className="p-4">
        {/* 头部 */}
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {alert.icon || (
              <AlertIcon level={alert.level} className={styles.icon} />
            )}
          </div>

          <div className="ml-3 w-0 flex-1">
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-medium ${styles.text}`}>
                {alert.title}
              </h3>

              {/* 关闭按钮 */}
              <button
                onClick={() => onClose(alert.id)}
                className={`ml-2 inline-flex text-sm ${styles.accent} hover:${styles.text} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${alert.level}-500`}
                aria-label={messages.close}
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {/* 消息内容 */}
            <div className={`mt-1 text-sm ${styles.accent}`}>
              {alert.message}
            </div>

            {/* 详细描述 */}
            {alert.description && (
              <div className="mt-2">
                {showDetails ? (
                  <div className={`text-xs ${styles.accent} leading-5`}>
                    {alert.description}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDetails(true)}
                    className={`text-xs ${styles.accent} hover:${styles.text} underline focus:outline-none`}
                  >
                    {messages.showDetails}
                  </button>
                )}

                {showDetails && (
                  <button
                    onClick={() => setShowDetails(false)}
                    className={`text-xs ${styles.accent} hover:${styles.text} underline focus:outline-none ml-2`}
                  >
                    {messages.hideDetails}
                  </button>
                )}
              </div>
            )}

            {/* 操作按钮 */}
            {alert.actions && alert.actions.length > 0 && (
              <div className="mt-3 flex space-x-2">
                {alert.actions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action)}
                    disabled={actionLoading[action.id]}
                    className={`text-xs px-3 py-1 rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      action.type === "primary"
                        ? `bg-${alert.level}-600 text-white hover:bg-${alert.level}-700 focus:ring-${alert.level}-500`
                        : action.type === "danger"
                        ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                        : `bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-${alert.level}-500`
                    } ${
                      actionLoading[action.id]
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    title={
                      action.shortcut ? `快捷键: ${action.shortcut}` : undefined
                    }
                  >
                    {actionLoading[action.id] && (
                      <svg
                        className="animate-spin -ml-1 mr-1 h-3 w-3 text-current inline"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    )}
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 提示组管理器Hook
export function useProgressiveAlerts(config: Partial<AlertGroupConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const progressRef = useRef<Map<string, number>>(new Map());

  // 生成唯一ID
  const generateId = useCallback(() => {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // 播放声音
  const playSound = useCallback(
    (level: AlertLevel) => {
      if (!finalConfig.enableSound) return;

      // 创建音频上下文和音调
      try {
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // 根据级别设置不同音调
        const frequencies = {
          [AlertLevel.INFO]: 440,
          [AlertLevel.SUCCESS]: 523,
          [AlertLevel.WARNING]: 349,
          [AlertLevel.ERROR]: 294,
          [AlertLevel.CRITICAL]: 220,
        };

        oscillator.frequency.setValueAtTime(
          frequencies[level],
          audioContext.currentTime
        );
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      } catch (error) {
        console.warn("音频播放失败:", error);
      }
    },
    [finalConfig.enableSound]
  );

  // 触发震动
  const triggerVibration = useCallback(
    (level: AlertLevel) => {
      if (!finalConfig.enableVibration || !navigator.vibrate) return;

      const patterns = {
        [AlertLevel.INFO]: [100],
        [AlertLevel.SUCCESS]: [100, 50, 100],
        [AlertLevel.WARNING]: [200, 100, 200],
        [AlertLevel.ERROR]: [300, 100, 300, 100, 300],
        [AlertLevel.CRITICAL]: [500, 200, 500, 200, 500],
      };

      navigator.vibrate(patterns[level]);
    },
    [finalConfig.enableVibration]
  );

  // 计算实际持续时间
  const getActualDuration = useCallback(
    (alert: Partial<Alert>) => {
      if (alert.behavior === AlertBehavior.PERSISTENT) return 0;
      if (alert.behavior === AlertBehavior.AUTO_DISMISS && alert.duration)
        return alert.duration;
      if (
        alert.behavior === AlertBehavior.SMART ||
        alert.behavior === AlertBehavior.PROGRESSIVE
      ) {
        return finalConfig.defaultDuration[alert.level!];
      }
      return finalConfig.defaultDuration[alert.level!];
    },
    [finalConfig.defaultDuration]
  );

  // 添加提示
  const addAlert = useCallback(
    (alertData: Omit<Alert, "id" | "createdAt">) => {
      const id = generateId();
      const now = Date.now();

      const alert: Alert = {
        ...alertData,
        id,
        createdAt: now,
        position: alertData.position || AlertPosition.TOP_RIGHT,
      };

      setAlerts((prev) => {
        const newAlerts = [alert, ...prev];

        // 限制最大显示数量
        if (newAlerts.length > finalConfig.maxVisible) {
          const removed = newAlerts.slice(finalConfig.maxVisible);
          removed.forEach((removedAlert) => {
            const timer = timersRef.current.get(removedAlert.id);
            if (timer) {
              clearTimeout(timer);
              timersRef.current.delete(removedAlert.id);
            }
          });
          return newAlerts.slice(0, finalConfig.maxVisible);
        }

        return newAlerts;
      });

      // 播放声音和震动
      playSound(alert.level);
      triggerVibration(alert.level);

      // 设置自动消失定时器
      const duration = getActualDuration(alert);
      if (duration > 0) {
        const timer = setTimeout(() => {
          removeAlert(id);
        }, duration);

        timersRef.current.set(id, timer);

        // 渐进式行为：显示进度条
        if (
          alert.behavior === AlertBehavior.PROGRESSIVE ||
          alert.showProgress
        ) {
          progressRef.current.set(id, 100);

          const progressInterval = setInterval(() => {
            const currentProgress = progressRef.current.get(id) || 0;
            const decrement = (100 / duration) * 100; // 每100ms减少的百分比
            const newProgress = currentProgress - decrement;

            if (newProgress <= 0) {
              clearInterval(progressInterval);
              progressRef.current.delete(id);
            } else {
              progressRef.current.set(id, newProgress);
            }
          }, 100);
        }
      }

      return id;
    },
    [
      generateId,
      finalConfig.maxVisible,
      playSound,
      triggerVibration,
      getActualDuration,
    ]
  );

  // 移除提示
  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));

    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }

    progressRef.current.delete(id);
  }, []);

  // 更新提示
  const updateAlert = useCallback((id: string, updates: Partial<Alert>) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id
          ? { ...alert, ...updates, updatedAt: Date.now() }
          : alert
      )
    );
  }, []);

  // 清空所有提示
  const clearAllAlerts = useCallback(() => {
    // 清理所有定时器
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    progressRef.current.clear();

    setAlerts([]);
  }, []);

  // 便利方法
  const info = useCallback(
    (title: string, message: string, options?: Partial<Alert>) => {
      return addAlert({
        level: AlertLevel.INFO,
        title,
        message,
        behavior: AlertBehavior.SMART,
        ...options,
      });
    },
    [addAlert]
  );

  const success = useCallback(
    (title: string, message: string, options?: Partial<Alert>) => {
      return addAlert({
        level: AlertLevel.SUCCESS,
        title,
        message,
        behavior: AlertBehavior.SMART,
        ...options,
      });
    },
    [addAlert]
  );

  const warning = useCallback(
    (title: string, message: string, options?: Partial<Alert>) => {
      return addAlert({
        level: AlertLevel.WARNING,
        title,
        message,
        behavior: AlertBehavior.SMART,
        ...options,
      });
    },
    [addAlert]
  );

  const error = useCallback(
    (title: string, message: string, options?: Partial<Alert>) => {
      return addAlert({
        level: AlertLevel.ERROR,
        title,
        message,
        behavior: AlertBehavior.SMART,
        ...options,
      });
    },
    [addAlert]
  );

  const critical = useCallback(
    (title: string, message: string, options?: Partial<Alert>) => {
      return addAlert({
        level: AlertLevel.CRITICAL,
        title,
        message,
        behavior: AlertBehavior.PERSISTENT,
        position: AlertPosition.CENTER,
        ...options,
      });
    },
    [addAlert]
  );

  // 清理资源
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
      progressRef.current.clear();
    };
  }, []);

  return {
    alerts,
    addAlert,
    removeAlert,
    updateAlert,
    clearAllAlerts,
    // 便利方法
    info,
    success,
    warning,
    error,
    critical,
    // 获取进度
    getProgress: (id: string) => progressRef.current.get(id) || 0,
  };
}

// 提示容器组件
export default function ProgressiveAlerts({
  config = {},
  messages = DEFAULT_MESSAGES,
  className = "",
  darkMode = false,
}: {
  config?: Partial<AlertGroupConfig>;
  messages?: Partial<I18nMessages>;
  className?: string;
  darkMode?: boolean;
}) {
  const finalMessages = { ...DEFAULT_MESSAGES, ...messages };
  const { alerts, removeAlert, getProgress } = useProgressiveAlerts(config);

  // 按位置分组提示
  const alertsByPosition = alerts.reduce((groups, alert) => {
    const position = alert.position || AlertPosition.TOP_RIGHT;
    if (!groups[position]) {
      groups[position] = [];
    }
    groups[position].push(alert);
    return groups;
  }, {} as Record<AlertPosition, Alert[]>);

  const handleAction = useCallback((alertId: string, actionId: string) => {
    // 可以在这里添加全局操作处理逻辑
    console.log(`操作执行: 提示=${alertId}, 操作=${actionId}`);
  }, []);

  return (
    <>
      {Object.entries(alertsByPosition).map(([position, positionAlerts]) => (
        <div
          key={position}
          className={`${getPositionStyles(
            position as AlertPosition
          )} ${className}`}
        >
          <div
            className={`space-y-2 ${
              config.stackDirection === "down" ? "flex-col" : "flex-col-reverse"
            }`}
          >
            {positionAlerts.map((alert) => (
              <div
                key={alert.id}
                className="transform transition-all duration-300 ease-in-out"
                style={{
                  animation: "slideIn 0.3s ease-out",
                }}
              >
                <AlertComponent
                  alert={alert}
                  onClose={removeAlert}
                  onAction={handleAction}
                  messages={finalMessages}
                  showProgress={alert.showProgress}
                  progress={getProgress(alert.id)}
                  darkMode={darkMode}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}

// 导出类型和枚举
export type { Alert, AlertAction, AlertGroupConfig, I18nMessages };
export { AlertLevel, AlertPosition, AlertBehavior };
