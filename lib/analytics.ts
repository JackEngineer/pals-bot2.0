"use client";

/**
 * 性能分析和监控系统
 * 收集和分析各种性能指标，用于监控和优化系统性能
 */

// 性能指标类型
export enum MetricType {
  API_RESPONSE_TIME = "api_response_time",
  POLLING_FREQUENCY = "polling_frequency",
  ERROR_RATE = "error_rate",
  USER_EXPERIENCE = "user_experience",
  RESOURCE_USAGE = "resource_usage",
  NETWORK_QUALITY = "network_quality",
  DEVICE_PERFORMANCE = "device_performance",
}

// 错误类型分类
export enum ErrorCategory {
  NETWORK_ERROR = "network_error",
  API_ERROR = "api_error",
  CLIENT_ERROR = "client_error",
  AUTHENTICATION_ERROR = "auth_error",
  PERMISSION_ERROR = "permission_error",
  VALIDATION_ERROR = "validation_error",
  TIMEOUT_ERROR = "timeout_error",
  UNKNOWN_ERROR = "unknown_error",
}

// 用户体验质量等级
export enum UXQuality {
  EXCELLENT = "excellent", // 优秀
  GOOD = "good", // 良好
  FAIR = "fair", // 一般
  POOR = "poor", // 差
  CRITICAL = "critical", // 严重
}

// 基础性能指标接口
export interface BaseMetric {
  id: string;
  type: MetricType;
  timestamp: number;
  sessionId: string;
  userId?: string;
  value: number;
  metadata?: Record<string, any>;
}

// API 响应时间指标
export interface ApiResponseTimeMetric extends BaseMetric {
  type: MetricType.API_RESPONSE_TIME;
  endpoint: string;
  method: string;
  statusCode: number;
  responseSize?: number;
  metadata: {
    cached?: boolean;
    retryCount?: number;
    userAgent?: string;
  };
}

// 轮询频率指标
export interface PollingFrequencyMetric extends BaseMetric {
  type: MetricType.POLLING_FREQUENCY;
  pollingType: string;
  intervalMs: number;
  metadata: {
    networkQuality: string;
    userActivity: string;
    tabVisibility: boolean;
    conversationCount: number;
  };
}

// 错误率指标
export interface ErrorRateMetric extends BaseMetric {
  type: MetricType.ERROR_RATE;
  errorCategory: ErrorCategory;
  errorCode: string;
  errorMessage: string;
  metadata: {
    stackTrace?: string;
    endpoint?: string;
    userAgent?: string;
    networkState?: string;
  };
}

// 用户体验指标
export interface UserExperienceMetric extends BaseMetric {
  type: MetricType.USER_EXPERIENCE;
  quality: UXQuality;
  category: string;
  metadata: {
    messageDelay?: number;
    connectionStatus?: string;
    loadingTime?: number;
    interactionType?: string;
  };
}

// 资源使用指标
export interface ResourceUsageMetric extends BaseMetric {
  type: MetricType.RESOURCE_USAGE;
  resourceType: "memory" | "cpu" | "network" | "storage";
  metadata: {
    peak?: number;
    average?: number;
    duration?: number;
  };
}

// 聚合统计数据
export interface AggregatedStats {
  timeRange: {
    start: number;
    end: number;
    duration: number;
  };
  apiStats: {
    totalRequests: number;
    averageResponseTime: number;
    successRate: number;
    errorsByCategory: Record<ErrorCategory, number>;
    slowestEndpoints: Array<{
      endpoint: string;
      averageTime: number;
      requestCount: number;
    }>;
  };
  pollingStats: {
    averageFrequency: number;
    totalPolls: number;
    adaptationCount: number;
    networkAdaptations: number;
  };
  userExperienceStats: {
    overallQuality: UXQuality;
    qualityDistribution: Record<UXQuality, number>;
    averageMessageDelay: number;
    connectionStability: number;
  };
  resourceStats: {
    peakMemoryUsage: number;
    averageCpuUsage: number;
    networkDataTransferred: number;
    cacheHitRate: number;
  };
}

// 性能分析器类
class PerformanceAnalytics {
  private metrics: BaseMetric[] = [];
  private sessionId: string;
  private userId?: string;
  private maxMetricsCount = 10000;
  private reportingInterval = 30000; // 30秒
  private reportingTimer?: NodeJS.Timeout;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startPeriodicReporting();
    this.setupPerformanceObservers();
  }

  // 生成会话ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 设置用户ID
  setUserId(userId: string): void {
    this.userId = userId;
  }

  // 记录API响应时间
  recordApiResponse(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    options?: {
      responseSize?: number;
      cached?: boolean;
      retryCount?: number;
    }
  ): void {
    const metric: ApiResponseTimeMetric = {
      id: this.generateMetricId(),
      type: MetricType.API_RESPONSE_TIME,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      value: responseTime,
      endpoint,
      method,
      statusCode,
      responseSize: options?.responseSize,
      metadata: {
        cached: options?.cached,
        retryCount: options?.retryCount,
        userAgent: navigator.userAgent,
      },
    };

    this.addMetric(metric);
  }

  // 记录轮询频率
  recordPollingFrequency(
    pollingType: string,
    intervalMs: number,
    networkQuality: string,
    userActivity: string,
    tabVisibility: boolean,
    conversationCount: number
  ): void {
    const metric: PollingFrequencyMetric = {
      id: this.generateMetricId(),
      type: MetricType.POLLING_FREQUENCY,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      value: intervalMs,
      pollingType,
      intervalMs,
      metadata: {
        networkQuality,
        userActivity,
        tabVisibility,
        conversationCount,
      },
    };

    this.addMetric(metric);
  }

  // 记录错误
  recordError(
    category: ErrorCategory,
    errorCode: string,
    errorMessage: string,
    options?: {
      stackTrace?: string;
      endpoint?: string;
      networkState?: string;
    }
  ): void {
    const metric: ErrorRateMetric = {
      id: this.generateMetricId(),
      type: MetricType.ERROR_RATE,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      value: 1,
      errorCategory: category,
      errorCode,
      errorMessage,
      metadata: {
        stackTrace: options?.stackTrace,
        endpoint: options?.endpoint,
        userAgent: navigator.userAgent,
        networkState: options?.networkState,
      },
    };

    this.addMetric(metric);
  }

  // 记录用户体验
  recordUserExperience(
    quality: UXQuality,
    category: string,
    options?: {
      messageDelay?: number;
      connectionStatus?: string;
      loadingTime?: number;
      interactionType?: string;
    }
  ): void {
    const qualityScore = this.getQualityScore(quality);

    const metric: UserExperienceMetric = {
      id: this.generateMetricId(),
      type: MetricType.USER_EXPERIENCE,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      value: qualityScore,
      quality,
      category,
      metadata: {
        messageDelay: options?.messageDelay,
        connectionStatus: options?.connectionStatus,
        loadingTime: options?.loadingTime,
        interactionType: options?.interactionType,
      },
    };

    this.addMetric(metric);
  }

  // 记录资源使用
  recordResourceUsage(
    resourceType: "memory" | "cpu" | "network" | "storage",
    currentValue: number,
    options?: {
      peak?: number;
      average?: number;
      duration?: number;
    }
  ): void {
    const metric: ResourceUsageMetric = {
      id: this.generateMetricId(),
      type: MetricType.RESOURCE_USAGE,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      value: currentValue,
      resourceType,
      metadata: {
        peak: options?.peak,
        average: options?.average,
        duration: options?.duration,
      },
    };

    this.addMetric(metric);
  }

  // 获取聚合统计数据
  getAggregatedStats(timeRangeMs: number = 3600000): AggregatedStats {
    // 默认1小时
    const now = Date.now();
    const startTime = now - timeRangeMs;

    const relevantMetrics = this.metrics.filter(
      (metric) => metric.timestamp >= startTime
    );

    return {
      timeRange: {
        start: startTime,
        end: now,
        duration: timeRangeMs,
      },
      apiStats: this.calculateApiStats(relevantMetrics),
      pollingStats: this.calculatePollingStats(relevantMetrics),
      userExperienceStats: this.calculateUXStats(relevantMetrics),
      resourceStats: this.calculateResourceStats(relevantMetrics),
    };
  }

  // 获取实时性能指标
  getRealTimeMetrics(): {
    currentApiLoad: number;
    currentPollingFreq: number;
    recentErrorRate: number;
    currentUXQuality: UXQuality;
    memoryUsage: number;
  } {
    const recentWindow = 60000; // 最近1分钟
    const now = Date.now();
    const recentMetrics = this.metrics.filter(
      (metric) => now - metric.timestamp <= recentWindow
    );

    const apiMetrics = recentMetrics.filter(
      (m) => m.type === MetricType.API_RESPONSE_TIME
    );
    const pollingMetrics = recentMetrics.filter(
      (m) => m.type === MetricType.POLLING_FREQUENCY
    );
    const errorMetrics = recentMetrics.filter(
      (m) => m.type === MetricType.ERROR_RATE
    );
    const uxMetrics = recentMetrics.filter(
      (m) => m.type === MetricType.USER_EXPERIENCE
    );
    const memoryMetrics = recentMetrics.filter(
      (m) =>
        m.type === MetricType.RESOURCE_USAGE &&
        (m as ResourceUsageMetric).resourceType === "memory"
    );

    return {
      currentApiLoad: apiMetrics.length,
      currentPollingFreq:
        pollingMetrics.length > 0
          ? pollingMetrics[pollingMetrics.length - 1].value
          : 0,
      recentErrorRate:
        (errorMetrics.length / Math.max(apiMetrics.length, 1)) * 100,
      currentUXQuality: this.calculateCurrentUXQuality(uxMetrics),
      memoryUsage:
        memoryMetrics.length > 0
          ? memoryMetrics[memoryMetrics.length - 1].value
          : 0,
    };
  }

  // 导出性能数据（用于调试）
  exportMetrics(format: "json" | "csv" = "json"): string {
    if (format === "csv") {
      return this.metricsToCSV();
    }
    return JSON.stringify(this.metrics, null, 2);
  }

  // 清理过期数据
  cleanup(): void {
    const maxAge = 24 * 60 * 60 * 1000; // 24小时
    const cutoff = Date.now() - maxAge;

    this.metrics = this.metrics.filter((metric) => metric.timestamp > cutoff);

    // 如果数据量过大，保留最新的
    if (this.metrics.length > this.maxMetricsCount) {
      this.metrics = this.metrics
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, this.maxMetricsCount);
    }
  }

  // 私有方法实现
  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addMetric(metric: BaseMetric): void {
    this.metrics.push(metric);

    // 定期清理
    if (this.metrics.length % 100 === 0) {
      this.cleanup();
    }
  }

  private getQualityScore(quality: UXQuality): number {
    switch (quality) {
      case UXQuality.EXCELLENT:
        return 5;
      case UXQuality.GOOD:
        return 4;
      case UXQuality.FAIR:
        return 3;
      case UXQuality.POOR:
        return 2;
      case UXQuality.CRITICAL:
        return 1;
      default:
        return 3;
    }
  }

  private calculateApiStats(
    metrics: BaseMetric[]
  ): AggregatedStats["apiStats"] {
    const apiMetrics = metrics.filter(
      (m) => m.type === MetricType.API_RESPONSE_TIME
    ) as ApiResponseTimeMetric[];
    const errorMetrics = metrics.filter(
      (m) => m.type === MetricType.ERROR_RATE
    ) as ErrorRateMetric[];

    const totalRequests = apiMetrics.length;
    const averageResponseTime =
      totalRequests > 0
        ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / totalRequests
        : 0;

    const successRequests = apiMetrics.filter(
      (m) => m.statusCode >= 200 && m.statusCode < 400
    ).length;
    const successRate =
      totalRequests > 0 ? (successRequests / totalRequests) * 100 : 100;

    const errorsByCategory: Record<ErrorCategory, number> = {} as Record<
      ErrorCategory,
      number
    >;
    Object.values(ErrorCategory).forEach((category) => {
      errorsByCategory[category] = errorMetrics.filter(
        (m) => m.errorCategory === category
      ).length;
    });

    const endpointStats = new Map<
      string,
      { total: number; totalTime: number }
    >();
    apiMetrics.forEach((metric) => {
      const key = `${metric.method} ${metric.endpoint}`;
      const current = endpointStats.get(key) || { total: 0, totalTime: 0 };
      current.total++;
      current.totalTime += metric.value;
      endpointStats.set(key, current);
    });

    const slowestEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        averageTime: stats.totalTime / stats.total,
        requestCount: stats.total,
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5);

    return {
      totalRequests,
      averageResponseTime,
      successRate,
      errorsByCategory,
      slowestEndpoints,
    };
  }

  private calculatePollingStats(
    metrics: BaseMetric[]
  ): AggregatedStats["pollingStats"] {
    const pollingMetrics = metrics.filter(
      (m) => m.type === MetricType.POLLING_FREQUENCY
    ) as PollingFrequencyMetric[];

    const totalPolls = pollingMetrics.length;
    const averageFrequency =
      totalPolls > 0
        ? pollingMetrics.reduce((sum, m) => sum + 1000 / m.intervalMs, 0) /
          totalPolls
        : 0;

    // 计算自适应次数（频率变化的次数）
    let adaptationCount = 0;
    let networkAdaptations = 0;
    for (let i = 1; i < pollingMetrics.length; i++) {
      if (pollingMetrics[i].intervalMs !== pollingMetrics[i - 1].intervalMs) {
        adaptationCount++;
        if (
          pollingMetrics[i].metadata.networkQuality !==
          pollingMetrics[i - 1].metadata.networkQuality
        ) {
          networkAdaptations++;
        }
      }
    }

    return {
      averageFrequency,
      totalPolls,
      adaptationCount,
      networkAdaptations,
    };
  }

  private calculateUXStats(
    metrics: BaseMetric[]
  ): AggregatedStats["userExperienceStats"] {
    const uxMetrics = metrics.filter(
      (m) => m.type === MetricType.USER_EXPERIENCE
    ) as UserExperienceMetric[];

    if (uxMetrics.length === 0) {
      return {
        overallQuality: UXQuality.FAIR,
        qualityDistribution: {} as Record<UXQuality, number>,
        averageMessageDelay: 0,
        connectionStability: 100,
      };
    }

    const qualityDistribution: Record<UXQuality, number> = {} as Record<
      UXQuality,
      number
    >;
    Object.values(UXQuality).forEach((quality) => {
      qualityDistribution[quality] = uxMetrics.filter(
        (m) => m.quality === quality
      ).length;
    });

    const averageScore =
      uxMetrics.reduce((sum, m) => sum + m.value, 0) / uxMetrics.length;
    const overallQuality = this.scoreToQuality(averageScore);

    const messageDelays = uxMetrics
      .filter((m) => m.metadata.messageDelay !== undefined)
      .map((m) => m.metadata.messageDelay!);
    const averageMessageDelay =
      messageDelays.length > 0
        ? messageDelays.reduce((sum, delay) => sum + delay, 0) /
          messageDelays.length
        : 0;

    // 连接稳定性基于错误率计算
    const errorMetrics = metrics.filter(
      (m) => m.type === MetricType.ERROR_RATE
    );
    const connectionStability = Math.max(
      0,
      100 - (errorMetrics.length / Math.max(uxMetrics.length, 1)) * 100
    );

    return {
      overallQuality,
      qualityDistribution,
      averageMessageDelay,
      connectionStability,
    };
  }

  private calculateResourceStats(
    metrics: BaseMetric[]
  ): AggregatedStats["resourceStats"] {
    const resourceMetrics = metrics.filter(
      (m) => m.type === MetricType.RESOURCE_USAGE
    ) as ResourceUsageMetric[];

    const memoryMetrics = resourceMetrics.filter(
      (m) => m.resourceType === "memory"
    );
    const networkMetrics = resourceMetrics.filter(
      (m) => m.resourceType === "network"
    );

    const peakMemoryUsage =
      memoryMetrics.length > 0
        ? Math.max(...memoryMetrics.map((m) => m.metadata.peak || m.value))
        : 0;

    const averageCpuUsage = 0; // 浏览器中难以精确获取CPU使用率

    const networkDataTransferred =
      networkMetrics.length > 0
        ? networkMetrics.reduce((sum, m) => sum + m.value, 0)
        : 0;

    // 缓存命中率需要从API指标中计算
    const apiMetrics = metrics.filter(
      (m) => m.type === MetricType.API_RESPONSE_TIME
    ) as ApiResponseTimeMetric[];
    const cachedRequests = apiMetrics.filter((m) => m.metadata.cached).length;
    const cacheHitRate =
      apiMetrics.length > 0 ? (cachedRequests / apiMetrics.length) * 100 : 0;

    return {
      peakMemoryUsage,
      averageCpuUsage,
      networkDataTransferred,
      cacheHitRate,
    };
  }

  private calculateCurrentUXQuality(uxMetrics: BaseMetric[]): UXQuality {
    if (uxMetrics.length === 0) return UXQuality.FAIR;

    const recentMetric = uxMetrics[
      uxMetrics.length - 1
    ] as UserExperienceMetric;
    return recentMetric.quality;
  }

  private scoreToQuality(score: number): UXQuality {
    if (score >= 4.5) return UXQuality.EXCELLENT;
    if (score >= 3.5) return UXQuality.GOOD;
    if (score >= 2.5) return UXQuality.FAIR;
    if (score >= 1.5) return UXQuality.POOR;
    return UXQuality.CRITICAL;
  }

  private metricsToCSV(): string {
    if (this.metrics.length === 0) return "";

    const headers = [
      "id",
      "type",
      "timestamp",
      "sessionId",
      "userId",
      "value",
      "metadata",
    ];
    const rows = this.metrics.map((metric) => [
      metric.id,
      metric.type,
      metric.timestamp,
      metric.sessionId,
      metric.userId || "",
      metric.value,
      JSON.stringify(metric.metadata || {}),
    ]);

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  }

  private startPeriodicReporting(): void {
    this.reportingTimer = setInterval(() => {
      this.sendBatchReport();
    }, this.reportingInterval);
  }

  private sendBatchReport(): void {
    const stats = this.getAggregatedStats(this.reportingInterval);
    const realTimeMetrics = this.getRealTimeMetrics();

    // 在实际应用中，这里应该发送到分析服务
    console.log("📊 性能报告:", {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      aggregatedStats: stats,
      realTimeMetrics,
    });
  }

  private setupPerformanceObservers(): void {
    // 监听页面性能
    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === "navigation") {
              this.recordResourceUsage("network", entry.duration, {
                peak: entry.duration,
                average: entry.duration,
              });
            }
          }
        });
        observer.observe({ entryTypes: ["navigation"] });
      } catch (error) {
        console.warn("Performance Observer not supported:", error);
      }
    }

    // 监听内存使用（如果支持）
    if ("memory" in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.recordResourceUsage("memory", memory.usedJSHeapSize, {
          peak: memory.totalJSHeapSize,
          average: memory.usedJSHeapSize,
        });
      }, 30000); // 每30秒检查一次
    }
  }

  // 清理定时器
  destroy(): void {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
    }
  }
}

// 全局分析器实例
const analytics = new PerformanceAnalytics();

// 导出便利函数
export const recordApiResponse = (
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  options?: Parameters<typeof analytics.recordApiResponse>[4]
) =>
  analytics.recordApiResponse(
    endpoint,
    method,
    statusCode,
    responseTime,
    options
  );

export const recordPollingFrequency = (
  pollingType: string,
  intervalMs: number,
  networkQuality: string,
  userActivity: string,
  tabVisibility: boolean,
  conversationCount: number
) =>
  analytics.recordPollingFrequency(
    pollingType,
    intervalMs,
    networkQuality,
    userActivity,
    tabVisibility,
    conversationCount
  );

export const recordError = (
  category: ErrorCategory,
  errorCode: string,
  errorMessage: string,
  options?: Parameters<typeof analytics.recordError>[3]
) => analytics.recordError(category, errorCode, errorMessage, options);

export const recordUserExperience = (
  quality: UXQuality,
  category: string,
  options?: Parameters<typeof analytics.recordUserExperience>[2]
) => analytics.recordUserExperience(quality, category, options);

export const recordResourceUsage = (
  resourceType: "memory" | "cpu" | "network" | "storage",
  currentValue: number,
  options?: Parameters<typeof analytics.recordResourceUsage>[2]
) => analytics.recordResourceUsage(resourceType, currentValue, options);

export const getAggregatedStats = (timeRangeMs?: number) =>
  analytics.getAggregatedStats(timeRangeMs);
export const getRealTimeMetrics = () => analytics.getRealTimeMetrics();
export const exportMetrics = (format?: "json" | "csv") =>
  analytics.exportMetrics(format);
export const setUserId = (userId: string) => analytics.setUserId(userId);

// 导出类型和枚举
export type {
  BaseMetric,
  ApiResponseTimeMetric,
  PollingFrequencyMetric,
  ErrorRateMetric,
  UserExperienceMetric,
  ResourceUsageMetric,
  AggregatedStats,
};

// 导出默认分析器实例
export default analytics;
