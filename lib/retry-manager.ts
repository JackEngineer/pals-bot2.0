"use client";

/**
 * 智能重试管理器
 * 实现自适应重试策略，支持指数退避、错误分类、熔断器等功能
 */

// 重试配置接口
export interface RetryConfig {
  maxAttempts: number; // 最大重试次数
  baseDelay: number; // 基础延迟时间（毫秒）
  maxDelay: number; // 最大延迟时间（毫秒）
  backoffStrategy: "exponential" | "linear" | "fixed"; // 退避策略
  jitter: boolean; // 是否添加随机抖动
  retryableErrors: string[]; // 可重试的错误类型
  onRetry?: (attempt: number, error: Error) => void; // 重试回调
  shouldRetry?: (error: Error) => boolean; // 自定义重试条件
}

// 重试结果接口
export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDuration: number;
  retryHistory: RetryAttempt[];
}

// 重试记录接口
export interface RetryAttempt {
  attempt: number;
  error?: Error;
  duration: number;
  timestamp: number;
  delayBeforeRetry: number;
}

// 熔断器状态
export enum CircuitBreakerState {
  CLOSED = "closed", // 正常状态
  OPEN = "open", // 熔断状态
  HALF_OPEN = "half_open", // 半开状态
}

// 熔断器配置
export interface CircuitBreakerConfig {
  failureThreshold: number; // 失败阈值
  timeoutThreshold: number; // 超时阈值（毫秒）
  resetTimeout: number; // 重置超时（毫秒）
  monitoringPeriod: number; // 监控周期（毫秒）
}

// 熔断器状态信息
export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  totalRequests: number;
  failureRate: number;
}

// 默认配置
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffStrategy: "exponential",
  jitter: true,
  retryableErrors: [
    "NETWORK_ERROR",
    "TIMEOUT",
    "RATE_LIMIT_EXCEEDED",
    "TEMPORARY_FAILURE",
    "CONNECTION_ERROR",
    "DATABASE_CONNECTION_ERROR",
    "OPERATION_TIMEOUT",
    "CONCURRENT_OPERATION_CONFLICT",
  ],
};

const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  timeoutThreshold: 10000,
  resetTimeout: 60000,
  monitoringPeriod: 300000, // 5分钟
};

// 熔断器类
class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private lastSuccessTime = 0;
  private totalRequests = 0;

  constructor(private config: CircuitBreakerConfig) {}

  // 检查是否允许请求
  canExecute(): boolean {
    const now = Date.now();

    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        return true;

      case CircuitBreakerState.OPEN:
        // 检查是否到了重置时间
        if (now - this.lastFailureTime >= this.config.resetTimeout) {
          this.state = CircuitBreakerState.HALF_OPEN;
          return true;
        }
        return false;

      case CircuitBreakerState.HALF_OPEN:
        return true;

      default:
        return false;
    }
  }

  // 记录成功
  recordSuccess(): void {
    this.successCount++;
    this.totalRequests++;
    this.lastSuccessTime = Date.now();

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.state = CircuitBreakerState.CLOSED;
      this.failureCount = 0;
    }
  }

  // 记录失败
  recordFailure(error: Error): void {
    this.failureCount++;
    this.totalRequests++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
    }
  }

  // 获取统计信息
  getStats(): CircuitBreakerStats {
    const now = Date.now();
    const recentRequests = this.totalRequests; // 简化实现
    const failureRate =
      recentRequests > 0 ? this.failureCount / recentRequests : 0;

    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      failureRate,
    };
  }

  // 重置熔断器
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.lastSuccessTime = 0;
    this.totalRequests = 0;
  }
}

// 重试管理器类
export class RetryManager {
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private retryStats = new Map<string, RetryAttempt[]>();

  // 计算延迟时间
  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay: number;

    switch (config.backoffStrategy) {
      case "exponential":
        delay = config.baseDelay * Math.pow(2, attempt - 1);
        break;
      case "linear":
        delay = config.baseDelay * attempt;
        break;
      case "fixed":
      default:
        delay = config.baseDelay;
        break;
    }

    // 应用最大延迟限制
    delay = Math.min(delay, config.maxDelay);

    // 添加随机抖动
    if (config.jitter) {
      const jitterRange = delay * 0.1; // 10%的抖动
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      delay += jitter;
    }

    return Math.max(0, Math.round(delay));
  }

  // 检查错误是否可重试
  private isRetryableError(error: Error, config: RetryConfig): boolean {
    // 首先检查自定义重试条件
    if (config.shouldRetry) {
      return config.shouldRetry(error);
    }

    // 检查错误消息是否包含可重试的错误类型
    const errorMessage = error.message.toLowerCase();
    return config.retryableErrors.some((retryableError) =>
      errorMessage.includes(retryableError.toLowerCase())
    );
  }

  // 获取或创建熔断器
  private getCircuitBreaker(key: string): CircuitBreaker {
    if (!this.circuitBreakers.has(key)) {
      this.circuitBreakers.set(
        key,
        new CircuitBreaker(DEFAULT_CIRCUIT_BREAKER_CONFIG)
      );
    }
    return this.circuitBreakers.get(key)!;
  }

  // 执行带重试的操作
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    circuitBreakerKey?: string
  ): Promise<RetryResult<T>> {
    const finalConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    const startTime = Date.now();
    const retryHistory: RetryAttempt[] = [];

    let circuitBreaker: CircuitBreaker | undefined;
    if (circuitBreakerKey) {
      circuitBreaker = this.getCircuitBreaker(circuitBreakerKey);
    }

    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      // 检查熔断器
      if (circuitBreaker && !circuitBreaker.canExecute()) {
        const cbStats = circuitBreaker.getStats();
        lastError = new Error(
          `熔断器开启状态，暂停请求。状态: ${cbStats.state}, 失败率: ${(
            cbStats.failureRate * 100
          ).toFixed(1)}%`
        );
        break;
      }

      const attemptStartTime = Date.now();

      try {
        console.log(`执行操作，尝试 ${attempt}/${finalConfig.maxAttempts}`);

        const result = await operation();
        const duration = Date.now() - attemptStartTime;

        // 记录成功尝试
        retryHistory.push({
          attempt,
          duration,
          timestamp: attemptStartTime,
          delayBeforeRetry: 0,
        });

        // 记录熔断器成功
        if (circuitBreaker) {
          circuitBreaker.recordSuccess();
        }

        // 更新统计
        if (circuitBreakerKey) {
          this.retryStats.set(circuitBreakerKey, retryHistory);
        }

        return {
          success: true,
          result,
          attempts: attempt,
          totalDuration: Date.now() - startTime,
          retryHistory,
        };
      } catch (error) {
        const duration = Date.now() - attemptStartTime;
        lastError = error instanceof Error ? error : new Error(String(error));

        console.warn(
          `操作失败，尝试 ${attempt}/${finalConfig.maxAttempts}:`,
          lastError.message
        );

        // 记录失败尝试
        const delayBeforeRetry =
          attempt < finalConfig.maxAttempts
            ? this.calculateDelay(attempt, finalConfig)
            : 0;

        retryHistory.push({
          attempt,
          error: lastError,
          duration,
          timestamp: attemptStartTime,
          delayBeforeRetry,
        });

        // 记录熔断器失败
        if (circuitBreaker) {
          circuitBreaker.recordFailure(lastError);
        }

        // 检查是否应该重试
        if (attempt >= finalConfig.maxAttempts) {
          console.error(`所有重试尝试已用尽 (${finalConfig.maxAttempts}次)`);
          break;
        }

        if (!this.isRetryableError(lastError, finalConfig)) {
          console.error("错误不可重试:", lastError.message);
          break;
        }

        // 调用重试回调
        if (finalConfig.onRetry) {
          finalConfig.onRetry(attempt, lastError);
        }

        // 等待重试延迟
        if (delayBeforeRetry > 0) {
          console.log(`等待 ${delayBeforeRetry}ms 后重试...`);
          await new Promise((resolve) => setTimeout(resolve, delayBeforeRetry));
        }
      }
    }

    // 更新统计
    if (circuitBreakerKey) {
      this.retryStats.set(circuitBreakerKey, retryHistory);
    }

    return {
      success: false,
      error: lastError,
      attempts: retryHistory.length,
      totalDuration: Date.now() - startTime,
      retryHistory,
    };
  }

  // 获取重试统计
  getRetryStats(
    key?: string
  ): Map<string, RetryAttempt[]> | RetryAttempt[] | undefined {
    if (key) {
      return this.retryStats.get(key);
    }
    return this.retryStats;
  }

  // 获取熔断器统计
  getCircuitBreakerStats(
    key?: string
  ): Map<string, CircuitBreakerStats> | CircuitBreakerStats | undefined {
    if (key) {
      const cb = this.circuitBreakers.get(key);
      return cb ? cb.getStats() : undefined;
    }

    const allStats = new Map<string, CircuitBreakerStats>();
    for (const [key, cb] of this.circuitBreakers.entries()) {
      allStats.set(key, cb.getStats());
    }
    return allStats;
  }

  // 重置熔断器
  resetCircuitBreaker(key: string): boolean {
    const cb = this.circuitBreakers.get(key);
    if (cb) {
      cb.reset();
      return true;
    }
    return false;
  }

  // 清理统计数据
  clearStats(key?: string): void {
    if (key) {
      this.retryStats.delete(key);
    } else {
      this.retryStats.clear();
    }
  }
}

// 全局重试管理器实例
const retryManager = new RetryManager();

// 便利函数：执行带重试的操作
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>,
  circuitBreakerKey?: string
): Promise<RetryResult<T>> {
  return retryManager.executeWithRetry(operation, config, circuitBreakerKey);
}

// 便利函数：创建专用的重试器
export function createRetrier(
  config: Partial<RetryConfig>,
  circuitBreakerKey?: string
) {
  return async <T>(operation: () => Promise<T>): Promise<RetryResult<T>> => {
    return retryManager.executeWithRetry(operation, config, circuitBreakerKey);
  };
}

// 预设的重试配置
export const RETRY_CONFIGS = {
  // 网络请求重试配置
  NETWORK: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffStrategy: "exponential" as const,
    retryableErrors: ["NETWORK_ERROR", "TIMEOUT", "CONNECTION_ERROR"],
  },

  // 数据库操作重试配置
  DATABASE: {
    maxAttempts: 2,
    baseDelay: 500,
    maxDelay: 5000,
    backoffStrategy: "linear" as const,
    retryableErrors: [
      "DATABASE_CONNECTION_ERROR",
      "OPERATION_TIMEOUT",
      "CONCURRENT_OPERATION_CONFLICT",
    ],
  },

  // API调用重试配置
  API_CALL: {
    maxAttempts: 4,
    baseDelay: 2000,
    maxDelay: 15000,
    backoffStrategy: "exponential" as const,
    retryableErrors: [
      "RATE_LIMIT_EXCEEDED",
      "TEMPORARY_FAILURE",
      "NETWORK_ERROR",
      "TIMEOUT",
    ],
  },

  // 快速重试配置（用于轻量级操作）
  FAST: {
    maxAttempts: 2,
    baseDelay: 200,
    maxDelay: 1000,
    backoffStrategy: "fixed" as const,
    jitter: false,
  },
} as const;

// 导出重试管理器实例
export { retryManager };
export default RetryManager;
