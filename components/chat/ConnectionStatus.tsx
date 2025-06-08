"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useNetworkStatus,
  NetworkQuality,
  ConnectionType,
} from "@/hooks/useNetworkStatus";
import { usePollingManager, ActivityLevel } from "@/hooks/usePollingManager";
import { getTabCoordinator, CoordinationStatus } from "@/lib/tab-coordinator";
import { getRealTimeMetrics, UXQuality } from "@/lib/analytics";

/**
 * 连接状态指示器组件
 * 显示网络状态、轮询状态、系统健康度等信息
 */

// 状态级别
export enum StatusLevel {
  EXCELLENT = "excellent",
  GOOD = "good",
  WARNING = "warning",
  ERROR = "error",
  OFFLINE = "offline",
}

// 状态信息接口
export interface StatusInfo {
  level: StatusLevel;
  title: string;
  message: string;
  details?: string[];
  actions?: StatusAction[];
}

// 状态操作
export interface StatusAction {
  label: string;
  action: () => void;
  type: "primary" | "secondary" | "danger";
}

// 网络状态映射
const getNetworkStatusInfo = (
  quality: NetworkQuality,
  isOnline: boolean,
  latency: number | null
): StatusInfo => {
  if (!isOnline) {
    return {
      level: StatusLevel.OFFLINE,
      title: "离线状态",
      message: "网络连接已断开",
      details: ["请检查网络连接", "数据将在重新连接后同步"],
      actions: [
        {
          label: "重试连接",
          action: () => window.location.reload(),
          type: "primary",
        },
      ],
    };
  }

  const latencyText = latency !== null ? `延迟 ${latency}ms` : "检测中...";

  switch (quality) {
    case NetworkQuality.EXCELLENT:
      return {
        level: StatusLevel.EXCELLENT,
        title: "网络优秀",
        message: latencyText,
        details: ["连接稳定", "响应迅速"],
      };

    case NetworkQuality.GOOD:
      return {
        level: StatusLevel.GOOD,
        title: "网络良好",
        message: latencyText,
        details: ["连接正常"],
      };

    case NetworkQuality.SLOW:
      return {
        level: StatusLevel.WARNING,
        title: "网络较慢",
        message: latencyText,
        details: ["消息发送可能延迟", "建议检查网络环境"],
      };

    case NetworkQuality.POOR:
      return {
        level: StatusLevel.ERROR,
        title: "网络较差",
        message: latencyText,
        details: ["连接不稳定", "消息可能延迟"],
      };

    default:
      return {
        level: StatusLevel.WARNING,
        title: "网络状态未知",
        message: "正在检测...",
        details: [],
      };
  }
};

// 轮询状态映射
const getPollingStatusInfo = (
  activityLevel: ActivityLevel,
  frequency: number,
  isPollingActive: boolean
): StatusInfo => {
  const frequencyText = frequency > 0 ? `间隔 ${frequency}ms` : "已暂停";

  if (!isPollingActive) {
    return {
      level: StatusLevel.WARNING,
      title: "轮询暂停",
      message: "已暂停",
      details: ["轮询已被手动暂停"],
    };
  }

  switch (activityLevel) {
    case ActivityLevel.VERY_ACTIVE:
    case ActivityLevel.TYPING:
      return {
        level: StatusLevel.EXCELLENT,
        title: "轮询高频",
        message: frequencyText,
        details: ["高活跃度，快速轮询"],
      };

    case ActivityLevel.ACTIVE:
      return {
        level: StatusLevel.GOOD,
        title: "轮询活跃",
        message: frequencyText,
        details: ["正常活跃状态"],
      };

    case ActivityLevel.IDLE:
      return {
        level: StatusLevel.WARNING,
        title: "轮询降频",
        message: frequencyText,
        details: ["用户空闲，降低频率节省资源"],
      };

    case ActivityLevel.HIDDEN:
      return {
        level: StatusLevel.WARNING,
        title: "轮询暂停",
        message: "页面不可见",
        details: ["切换到页面时将恢复"],
      };

    default:
      return {
        level: StatusLevel.WARNING,
        title: "轮询状态未知",
        message: "正在检测...",
        details: [],
      };
  }
};

// 系统健康度映射
const getSystemHealthInfo = (
  quality: UXQuality,
  metrics: ReturnType<typeof getRealTimeMetrics>
): StatusInfo => {
  const errorRate = metrics.recentErrorRate;
  const apiLoad = metrics.currentApiLoad;

  if (quality === UXQuality.CRITICAL || errorRate > 10) {
    return {
      level: StatusLevel.ERROR,
      title: "系统异常",
      message: `错误率 ${errorRate.toFixed(1)}%`,
      details: ["多个功能可能受影响", "建议刷新页面或稍后重试"],
      actions: [
        {
          label: "刷新页面",
          action: () => window.location.reload(),
          type: "danger",
        },
      ],
    };
  }

  if (quality === UXQuality.POOR || errorRate > 5) {
    return {
      level: StatusLevel.WARNING,
      title: "系统不稳定",
      message: `错误率 ${errorRate.toFixed(1)}%`,
      details: ["部分功能可能延迟"],
    };
  }

  if (quality === UXQuality.FAIR || apiLoad > 50) {
    return {
      level: StatusLevel.WARNING,
      title: "系统负载较高",
      message: `${apiLoad} 请求/分钟`,
      details: ["响应可能稍慢"],
    };
  }

  return {
    level: StatusLevel.EXCELLENT,
    title: "系统正常",
    message: "所有功能运行良好",
    details: [`错误率 ${errorRate.toFixed(1)}%`, `负载 ${apiLoad} 请求/分钟`],
  };
};

// 状态图标
const StatusIcon = ({
  level,
  className = "",
}: {
  level: StatusLevel;
  className?: string;
}) => {
  const iconClass = `w-4 h-4 ${className}`;

  switch (level) {
    case StatusLevel.EXCELLENT:
      return (
        <div className={`${iconClass} text-green-500`}>
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      );

    case StatusLevel.GOOD:
      return (
        <div className={`${iconClass} text-blue-500`}>
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      );

    case StatusLevel.WARNING:
      return (
        <div className={`${iconClass} text-yellow-500`}>
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      );

    case StatusLevel.ERROR:
      return (
        <div className={`${iconClass} text-red-500`}>
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      );

    case StatusLevel.OFFLINE:
      return (
        <div className={`${iconClass} text-gray-500`}>
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      );

    default:
      return (
        <div className={`${iconClass} text-gray-400`}>
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      );
  }
};

// 状态级别颜色
const getStatusLevelColors = (level: StatusLevel) => {
  switch (level) {
    case StatusLevel.EXCELLENT:
      return {
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-900",
        accent: "text-green-600",
      };
    case StatusLevel.GOOD:
      return {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-900",
        accent: "text-blue-600",
      };
    case StatusLevel.WARNING:
      return {
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        text: "text-yellow-900",
        accent: "text-yellow-600",
      };
    case StatusLevel.ERROR:
      return {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-900",
        accent: "text-red-600",
      };
    case StatusLevel.OFFLINE:
      return {
        bg: "bg-gray-50",
        border: "border-gray-200",
        text: "text-gray-900",
        accent: "text-gray-600",
      };
    default:
      return {
        bg: "bg-gray-50",
        border: "border-gray-200",
        text: "text-gray-900",
        accent: "text-gray-600",
      };
  }
};

// 状态详情组件
const StatusDetail = ({
  status,
  onAction,
}: {
  status: StatusInfo;
  onAction?: (action: StatusAction) => void;
}) => {
  const colors = getStatusLevelColors(status.level);

  return (
    <div className={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}>
      <div className="flex items-start space-x-3">
        <StatusIcon level={status.level} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={`text-sm font-medium ${colors.text}`}>
              {status.title}
            </h4>
            <span className={`text-xs ${colors.accent}`}>{status.message}</span>
          </div>

          {status.details && status.details.length > 0 && (
            <div className="mt-1">
              {status.details.map((detail, index) => (
                <p key={index} className={`text-xs ${colors.accent}`}>
                  {detail}
                </p>
              ))}
            </div>
          )}

          {status.actions && status.actions.length > 0 && (
            <div className="mt-2 flex space-x-2">
              {status.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.action();
                    onAction?.(action);
                  }}
                  className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                    action.type === "primary"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : action.type === "danger"
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                  aria-label={action.label}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 主组件
export default function ConnectionStatus({
  className = "",
  showDetails = false,
  onStatusChange,
  ariaLabel = "连接状态指示器",
}: {
  className?: string;
  showDetails?: boolean;
  onStatusChange?: (status: StatusInfo[]) => void;
  ariaLabel?: string;
}) {
  // 状态 hooks
  const networkStatus = useNetworkStatus();
  const pollingManager = usePollingManager();

  // 本地状态
  const [isExpanded, setIsExpanded] = useState(showDetails);
  const [coordination, setCoordination] = useState<CoordinationStatus | null>(
    null
  );
  const [realTimeMetrics, setRealTimeMetrics] = useState<ReturnType<
    typeof getRealTimeMetrics
  > | null>(null);

  // 更新数据
  useEffect(() => {
    const updateData = () => {
      const coordinator = getTabCoordinator();
      setCoordination(coordinator.getCoordinationStatus());
      setRealTimeMetrics(getRealTimeMetrics());
    };

    updateData();
    const interval = setInterval(updateData, 5000);

    return () => clearInterval(interval);
  }, []);

  // 计算状态信息
  const statusList: StatusInfo[] = [];

  if (networkStatus && realTimeMetrics) {
    // 网络状态
    statusList.push(
      getNetworkStatusInfo(
        networkStatus.networkState.quality,
        networkStatus.networkState.isOnline,
        networkStatus.networkState.latency
      )
    );

    // 轮询状态
    if (pollingManager) {
      statusList.push(
        getPollingStatusInfo(
          pollingManager.activityLevel,
          pollingManager.currentInterval,
          pollingManager.isPollingActive
        )
      );
    }

    // 系统健康度
    statusList.push(
      getSystemHealthInfo(realTimeMetrics.currentUXQuality, realTimeMetrics)
    );
  }

  // 通知状态变化
  useEffect(() => {
    onStatusChange?.(statusList);
  }, [statusList, onStatusChange]);

  // 获取主要状态
  const primaryStatus =
    statusList.find(
      (s) => s.level === StatusLevel.ERROR || s.level === StatusLevel.OFFLINE
    ) ||
    statusList.find((s) => s.level === StatusLevel.WARNING) ||
    statusList[0];

  if (!primaryStatus) {
    return null;
  }

  const primaryColors = getStatusLevelColors(primaryStatus.level);

  return (
    <div
      className={`relative ${className}`}
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
    >
      {/* 主状态指示器 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 ${primaryColors.bg} ${primaryColors.border} hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        aria-expanded={isExpanded}
        aria-controls="connection-status-details"
      >
        <StatusIcon level={primaryStatus.level} />
        <div className="flex-1 text-left">
          <div className={`text-sm font-medium ${primaryColors.text}`}>
            {primaryStatus.title}
          </div>
          <div className={`text-xs ${primaryColors.accent}`}>
            {primaryStatus.message}
          </div>
        </div>

        {/* 展开/收起图标 */}
        <div>
          <svg
            className={`w-4 h-4 ${
              primaryColors.accent
            } transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* 多设备指示器 */}
        {coordination && coordination.totalTabs > 1 && (
          <div className="flex items-center space-x-1">
            <div
              className={`w-2 h-2 rounded-full ${
                coordination.masterTabId ? "bg-green-400" : "bg-yellow-400"
              }`}
            ></div>
            <span className={`text-xs ${primaryColors.accent}`}>
              {coordination.totalTabs}设备
            </span>
          </div>
        )}
      </button>

      {/* 详细状态面板 */}
      {isExpanded && (
        <div
          id="connection-status-details"
          className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
        >
          <div className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              系统状态详情
            </h3>

            {statusList.map((status, index) => (
              <StatusDetail
                key={index}
                status={status}
                onAction={(action) => {
                  console.log("状态操作:", action.label);
                }}
              />
            ))}

            {/* 设备协调状态 */}
            {coordination && (
              <div className="pt-3 border-t border-gray-200">
                <h4 className="text-xs font-medium text-gray-700 mb-2">
                  设备协调
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">总设备:</span>
                    <span className="font-medium">
                      {coordination.totalTabs}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">活跃设备:</span>
                    <span className="font-medium">
                      {coordination.activeTabs}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">主设备:</span>
                    <span className="font-medium">
                      {coordination.masterTabId ? "是" : "否"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">任务分配:</span>
                    <span className="font-medium">
                      {coordination.taskAssignments.length}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 性能指标 */}
            {realTimeMetrics && (
              <div className="pt-3 border-t border-gray-200">
                <h4 className="text-xs font-medium text-gray-700 mb-2">
                  性能指标
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">API负载:</span>
                    <span className="font-medium">
                      {realTimeMetrics.currentApiLoad}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">错误率:</span>
                    <span className="font-medium">
                      {realTimeMetrics.recentErrorRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">轮询频率:</span>
                    <span className="font-medium">
                      {realTimeMetrics.currentPollingFreq > 0
                        ? `${(
                            1000 / realTimeMetrics.currentPollingFreq
                          ).toFixed(1)}/s`
                        : "暂停"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">内存使用:</span>
                    <span className="font-medium">
                      {(realTimeMetrics.memoryUsage / 1024 / 1024).toFixed(1)}
                      MB
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
