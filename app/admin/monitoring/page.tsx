"use client";

import { useState, useEffect, useRef } from "react";
import {
  getAggregatedStats,
  getRealTimeMetrics,
  AggregatedStats,
  UXQuality,
  ErrorCategory,
  MetricType,
} from "@/lib/analytics";

// 监控配置
interface MonitoringConfig {
  refreshInterval: number;
  chartPoints: number;
  alertThresholds: {
    errorRate: number;
    responseTime: number;
    memoryUsage: number;
  };
}

const DEFAULT_CONFIG: MonitoringConfig = {
  refreshInterval: 5000, // 5秒刷新
  chartPoints: 20, // 图表显示20个数据点
  alertThresholds: {
    errorRate: 5, // 5%错误率告警
    responseTime: 2000, // 2秒响应时间告警
    memoryUsage: 50 * 1024 * 1024, // 50MB内存告警
  },
};

// 实时数据点
interface DataPoint {
  timestamp: number;
  value: number;
}

// 告警信息
interface Alert {
  id: string;
  type: "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

export default function MonitoringPage() {
  // 状态管理
  const [stats, setStats] = useState<AggregatedStats | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<ReturnType<
    typeof getRealTimeMetrics
  > | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  // 历史数据存储
  const [apiLoadHistory, setApiLoadHistory] = useState<DataPoint[]>([]);
  const [errorRateHistory, setErrorRateHistory] = useState<DataPoint[]>([]);
  const [responseTimeHistory, setResponseTimeHistory] = useState<DataPoint[]>(
    []
  );
  const [memoryUsageHistory, setMemoryUsageHistory] = useState<DataPoint[]>([]);

  // 定时器引用
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 更新数据
  const updateMetrics = async () => {
    try {
      const newStats = getAggregatedStats(3600000); // 最近1小时
      const newRealTimeMetrics = getRealTimeMetrics();

      setStats(newStats);
      setRealTimeMetrics(newRealTimeMetrics);
      setIsOnline(true);
      setLastUpdateTime(new Date());

      // 更新历史数据
      const timestamp = Date.now();

      setApiLoadHistory((prev) =>
        addDataPoint(prev, timestamp, newRealTimeMetrics.currentApiLoad)
      );
      setErrorRateHistory((prev) =>
        addDataPoint(prev, timestamp, newRealTimeMetrics.recentErrorRate)
      );
      setResponseTimeHistory((prev) =>
        addDataPoint(prev, timestamp, newStats.apiStats.averageResponseTime)
      );
      setMemoryUsageHistory((prev) =>
        addDataPoint(prev, timestamp, newRealTimeMetrics.memoryUsage)
      );

      // 检查告警
      checkAlerts(newStats, newRealTimeMetrics);
    } catch (error) {
      console.error("更新监控数据失败:", error);
      setIsOnline(false);
    }
  };

  // 添加数据点到历史记录
  const addDataPoint = (
    history: DataPoint[],
    timestamp: number,
    value: number
  ): DataPoint[] => {
    const newHistory = [...history, { timestamp, value }];
    return newHistory.slice(-DEFAULT_CONFIG.chartPoints);
  };

  // 检查告警条件
  const checkAlerts = (
    stats: AggregatedStats,
    realTime: ReturnType<typeof getRealTimeMetrics>
  ) => {
    const newAlerts: Alert[] = [];

    // 错误率告警
    if (realTime.recentErrorRate > DEFAULT_CONFIG.alertThresholds.errorRate) {
      newAlerts.push({
        id: `error_rate_${Date.now()}`,
        type: "error",
        title: "错误率过高",
        message: `当前错误率 ${realTime.recentErrorRate.toFixed(1)}% 超过阈值 ${
          DEFAULT_CONFIG.alertThresholds.errorRate
        }%`,
        timestamp: Date.now(),
        acknowledged: false,
      });
    }

    // 响应时间告警
    if (
      stats.apiStats.averageResponseTime >
      DEFAULT_CONFIG.alertThresholds.responseTime
    ) {
      newAlerts.push({
        id: `response_time_${Date.now()}`,
        type: "warning",
        title: "响应时间过长",
        message: `平均响应时间 ${stats.apiStats.averageResponseTime}ms 超过阈值 ${DEFAULT_CONFIG.alertThresholds.responseTime}ms`,
        timestamp: Date.now(),
        acknowledged: false,
      });
    }

    // 内存使用告警
    if (realTime.memoryUsage > DEFAULT_CONFIG.alertThresholds.memoryUsage) {
      newAlerts.push({
        id: `memory_usage_${Date.now()}`,
        type: "warning",
        title: "内存使用过高",
        message: `当前内存使用 ${(realTime.memoryUsage / 1024 / 1024).toFixed(
          1
        )}MB 超过阈值 ${
          DEFAULT_CONFIG.alertThresholds.memoryUsage / 1024 / 1024
        }MB`,
        timestamp: Date.now(),
        acknowledged: false,
      });
    }

    if (newAlerts.length > 0) {
      setAlerts((prev) => [...newAlerts, ...prev].slice(0, 50)); // 保留最新50条告警
    }
  };

  // 确认告警
  const acknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  // 清除所有告警
  const clearAllAlerts = () => {
    setAlerts([]);
  };

  // 获取UX质量颜色
  const getUXQualityColor = (quality: UXQuality) => {
    switch (quality) {
      case UXQuality.EXCELLENT:
        return "text-green-600";
      case UXQuality.GOOD:
        return "text-blue-600";
      case UXQuality.FAIR:
        return "text-yellow-600";
      case UXQuality.POOR:
        return "text-orange-600";
      case UXQuality.CRITICAL:
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  // 格式化数字
  const formatNumber = (num: number, decimals: number = 1) => {
    return Number(num.toFixed(decimals)).toLocaleString();
  };

  // 格式化字节大小
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // 简单的折线图组件
  const MiniChart = ({
    data,
    color = "ocean-500",
    height = 60,
  }: {
    data: DataPoint[];
    color?: string;
    height?: number;
  }) => {
    if (data.length < 2)
      return <div className={`h-${height} bg-gray-100 rounded`}></div>;

    const maxValue = Math.max(...data.map((d) => d.value));
    const minValue = Math.min(...data.map((d) => d.value));
    const range = maxValue - minValue || 1;

    const points = data
      .map((point, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - ((point.value - minValue) / range) * 100;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <div className={`h-${height} relative`}>
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <polyline
            fill="none"
            stroke={`rgb(var(--color-${color}))`}
            strokeWidth="2"
            points={points}
          />
        </svg>
      </div>
    );
  };

  // 启动定时刷新
  useEffect(() => {
    updateMetrics(); // 立即执行一次

    refreshTimerRef.current = setInterval(
      updateMetrics,
      DEFAULT_CONFIG.refreshInterval
    );

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  if (!stats || !realTimeMetrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载监控数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">系统监控面板</h1>
              <p className="text-gray-600 mt-1">实时系统性能和运行状态监控</p>
            </div>
            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center ${
                  isOnline ? "text-green-600" : "text-red-600"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full mr-2 ${
                    isOnline ? "bg-green-400" : "bg-red-400"
                  }`}
                ></div>
                {isOnline ? "系统正常" : "连接异常"}
              </div>
              <div className="text-sm text-gray-500">
                最后更新: {lastUpdateTime.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* 告警区域 */}
        {alerts.filter((a) => !a.acknowledged).length > 0 && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-red-900">
                  🚨 活跃告警 ({alerts.filter((a) => !a.acknowledged).length})
                </h3>
                <button
                  onClick={clearAllAlerts}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  清除全部
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {alerts
                  .filter((a) => !a.acknowledged)
                  .slice(0, 3)
                  .map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between bg-white p-3 rounded border"
                    >
                      <div>
                        <div className="flex items-center">
                          <span
                            className={`inline-block w-2 h-2 rounded-full mr-2 ${
                              alert.type === "error"
                                ? "bg-red-500"
                                : alert.type === "warning"
                                ? "bg-yellow-500"
                                : "bg-blue-500"
                            }`}
                          ></span>
                          <span className="font-medium">{alert.title}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {alert.message}
                        </p>
                      </div>
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                      >
                        确认
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* 核心指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* API负载 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">API负载</p>
                <p className="text-2xl font-bold text-gray-900">
                  {realTimeMetrics.currentApiLoad}
                </p>
                <p className="text-sm text-gray-500">请求/分钟</p>
              </div>
              <div className="w-16">
                <MiniChart data={apiLoadHistory} color="blue-500" />
              </div>
            </div>
          </div>

          {/* 错误率 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">错误率</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(realTimeMetrics.recentErrorRate)}%
                </p>
                <p className="text-sm text-gray-500">最近1分钟</p>
              </div>
              <div className="w-16">
                <MiniChart data={errorRateHistory} color="red-500" />
              </div>
            </div>
          </div>

          {/* 响应时间 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  平均响应时间
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats.apiStats.averageResponseTime)}ms
                </p>
                <p className="text-sm text-gray-500">最近1小时</p>
              </div>
              <div className="w-16">
                <MiniChart data={responseTimeHistory} color="yellow-500" />
              </div>
            </div>
          </div>

          {/* 用户体验 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">用户体验</p>
                <p
                  className={`text-2xl font-bold ${getUXQualityColor(
                    realTimeMetrics.currentUXQuality
                  )}`}
                >
                  {realTimeMetrics.currentUXQuality}
                </p>
                <p className="text-sm text-gray-500">当前质量</p>
              </div>
              <div className="text-3xl">
                {realTimeMetrics.currentUXQuality === UXQuality.EXCELLENT
                  ? "🌟"
                  : realTimeMetrics.currentUXQuality === UXQuality.GOOD
                  ? "😊"
                  : realTimeMetrics.currentUXQuality === UXQuality.FAIR
                  ? "😐"
                  : realTimeMetrics.currentUXQuality === UXQuality.POOR
                  ? "😞"
                  : "😡"}
              </div>
            </div>
          </div>
        </div>

        {/* 详细统计 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* API统计 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">API统计</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">总请求数</span>
                <span className="font-medium">
                  {stats.apiStats.totalRequests.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">成功率</span>
                <span className="font-medium text-green-600">
                  {formatNumber(stats.apiStats.successRate)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">平均响应时间</span>
                <span className="font-medium">
                  {formatNumber(stats.apiStats.averageResponseTime)}ms
                </span>
              </div>
            </div>

            {/* 最慢端点 */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                最慢端点
              </h4>
              <div className="space-y-2">
                {stats.apiStats.slowestEndpoints
                  .slice(0, 3)
                  .map((endpoint, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-gray-600 truncate">
                        {endpoint.endpoint}
                      </span>
                      <span className="font-medium">
                        {formatNumber(endpoint.averageTime)}ms
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* 轮询统计 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">轮询统计</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">当前频率</span>
                <span className="font-medium">
                  {formatNumber(1000 / realTimeMetrics.currentPollingFreq)}次/秒
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">总轮询次数</span>
                <span className="font-medium">
                  {stats.pollingStats.totalPolls.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">自适应次数</span>
                <span className="font-medium">
                  {stats.pollingStats.adaptationCount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">网络自适应</span>
                <span className="font-medium">
                  {stats.pollingStats.networkAdaptations}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 错误分析和资源使用 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 错误分析 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">错误分析</h3>
            <div className="space-y-3">
              {Object.entries(stats.apiStats.errorsByCategory).map(
                ([category, count]) => (
                  <div
                    key={category}
                    className="flex justify-between items-center"
                  >
                    <span className="text-gray-600 capitalize">
                      {category.replace("_", " ")}
                    </span>
                    <span
                      className={`font-medium ${
                        count > 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* 资源使用 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">资源使用</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">当前内存</span>
                <span className="font-medium">
                  {formatBytes(realTimeMetrics.memoryUsage)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">峰值内存</span>
                <span className="font-medium">
                  {formatBytes(stats.resourceStats.peakMemoryUsage)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">网络传输</span>
                <span className="font-medium">
                  {formatBytes(stats.resourceStats.networkDataTransferred)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">缓存命中率</span>
                <span className="font-medium text-green-600">
                  {formatNumber(stats.resourceStats.cacheHitRate)}%
                </span>
              </div>
            </div>

            {/* 内存使用趋势 */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                内存使用趋势
              </h4>
              <MiniChart
                data={memoryUsageHistory}
                color="purple-500"
                height={80}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
