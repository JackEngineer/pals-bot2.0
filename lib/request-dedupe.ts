"use client";

/**
 * 请求去重和合并管理器
 * 避免相同URL的并发请求，共享响应数据
 */

interface PendingRequest<T = any> {
  promise: Promise<T>;
  timestamp: number;
  abortController: AbortController;
  resolvers: Array<(value: T) => void>;
  rejectors: Array<(reason: any) => void>;
}

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expireAt: number;
}

interface RequestConfig {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  cacheTimeout?: number;
  enableCache?: boolean;
  dedupe?: boolean;
}

interface DedupeStats {
  totalRequests: number;
  deduplicatedRequests: number;
  cacheHits: number;
  cacheMisses: number;
  activeRequests: number;
  savedRequests: number;
}

class RequestDedupeManager {
  private pendingRequests = new Map<string, PendingRequest>();
  private cache = new Map<string, CacheEntry>();
  private stats: DedupeStats = {
    totalRequests: 0,
    deduplicatedRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    activeRequests: 0,
    savedRequests: 0,
  };

  private readonly DEFAULT_CACHE_TIMEOUT = 30000; // 30秒
  private readonly DEFAULT_REQUEST_TIMEOUT = 10000; // 10秒
  private readonly MAX_CACHE_SIZE = 100;

  /**
   * 生成请求的唯一键
   */
  private generateKey(url: string, config: RequestConfig = {}): string {
    const { method = "GET", body } = config;
    const bodyKey = body ? JSON.stringify(body) : "";
    return `${method}:${url}:${bodyKey}`;
  }

  /**
   * 清理过期的缓存条目
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expireAt <= now) {
        this.cache.delete(key);
      }
    }

    // 如果缓存超过最大大小，删除最旧的条目
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toDelete = entries.slice(0, entries.length - this.MAX_CACHE_SIZE);
      for (const [key] of toDelete) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 检查缓存
   */
  private checkCache<T>(key: string): T | null {
    this.cleanExpiredCache();

    const cached = this.cache.get(key);
    if (cached && cached.expireAt > Date.now()) {
      this.stats.cacheHits++;
      return cached.data as T;
    }

    this.stats.cacheMisses++;
    return null;
  }

  /**
   * 设置缓存
   */
  private setCache<T>(key: string, data: T, cacheTimeout: number): void {
    if (!cacheTimeout || cacheTimeout <= 0) return;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expireAt: Date.now() + cacheTimeout,
    });
  }

  /**
   * 执行真实的请求
   */
  private async executeRequest<T>(
    url: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const {
      method = "GET",
      headers = {},
      body,
      timeout = this.DEFAULT_REQUEST_TIMEOUT,
    } = config;

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, timeout);

    try {
      const fetchConfig: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        signal: abortController.signal,
      };

      if (
        body &&
        (method === "POST" || method === "PUT" || method === "PATCH")
      ) {
        fetchConfig.body =
          typeof body === "string" ? body : JSON.stringify(body);
      }

      const response = await fetch(url, fetchConfig);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 去重请求方法
   */
  async request<T = any>(url: string, config: RequestConfig = {}): Promise<T> {
    const {
      cacheTimeout = this.DEFAULT_CACHE_TIMEOUT,
      enableCache = true,
      dedupe = true,
    } = config;

    this.stats.totalRequests++;

    const key = this.generateKey(url, config);

    // 检查缓存
    if (enableCache) {
      const cached = this.checkCache<T>(key);
      if (cached !== null) {
        return cached;
      }
    }

    // 检查是否有进行中的相同请求
    if (dedupe && this.pendingRequests.has(key)) {
      this.stats.deduplicatedRequests++;
      this.stats.savedRequests++;

      const pending = this.pendingRequests.get(key)!;

      // 返回一个新的Promise，它会在原始请求完成时resolve
      return new Promise<T>((resolve, reject) => {
        pending.resolvers.push(resolve);
        pending.rejectors.push(reject);
      });
    }

    // 创建新的请求
    const abortController = new AbortController();
    const resolvers: Array<(value: T) => void> = [];
    const rejectors: Array<(reason: any) => void> = [];

    const promise = this.executeRequest<T>(url, {
      ...config,
      timeout: config.timeout || this.DEFAULT_REQUEST_TIMEOUT,
    });

    const pendingRequest: PendingRequest<T> = {
      promise,
      timestamp: Date.now(),
      abortController,
      resolvers,
      rejectors,
    };

    this.pendingRequests.set(key, pendingRequest);
    this.stats.activeRequests = this.pendingRequests.size;

    try {
      const result = await promise;

      // 设置缓存
      if (enableCache) {
        this.setCache(key, result, cacheTimeout);
      }

      // 通知所有等待的请求
      resolvers.forEach((resolve) => resolve(result));

      return result;
    } catch (error) {
      // 通知所有等待的请求
      rejectors.forEach((reject) => reject(error));
      throw error;
    } finally {
      // 清理pending请求
      this.pendingRequests.delete(key);
      this.stats.activeRequests = this.pendingRequests.size;
    }
  }

  /**
   * 取消特定URL的请求
   */
  cancelRequest(url: string, config: RequestConfig = {}): boolean {
    const key = this.generateKey(url, config);
    const pending = this.pendingRequests.get(key);

    if (pending) {
      pending.abortController.abort();

      // 通知所有等待的请求
      const error = new Error("Request cancelled");
      pending.rejectors.forEach((reject) => reject(error));

      this.pendingRequests.delete(key);
      this.stats.activeRequests = this.pendingRequests.size;
      return true;
    }

    return false;
  }

  /**
   * 取消所有进行中的请求
   */
  cancelAllRequests(): void {
    const error = new Error("All requests cancelled");

    for (const [key, pending] of this.pendingRequests.entries()) {
      pending.abortController.abort();
      pending.rejectors.forEach((reject) => reject(error));
    }

    this.pendingRequests.clear();
    this.stats.activeRequests = 0;
  }

  /**
   * 清除特定URL的缓存
   */
  clearCache(url?: string, config?: RequestConfig): void {
    if (url) {
      const key = this.generateKey(url, config || {});
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * 预热缓存
   */
  async warmupCache<T>(url: string, config: RequestConfig = {}): Promise<T> {
    const key = this.generateKey(url, config);

    // 如果缓存中已存在且未过期，直接返回
    const cached = this.checkCache<T>(key);
    if (cached !== null) {
      return cached;
    }

    // 执行请求并缓存结果
    return this.request<T>(url, config);
  }

  /**
   * 批量预热缓存
   */
  async batchWarmup(
    requests: Array<{ url: string; config?: RequestConfig }>
  ): Promise<any[]> {
    const promises = requests.map(({ url, config }) =>
      this.warmupCache(url, config || {}).catch((error) => {
        console.warn(`预热缓存失败 ${url}:`, error);
        return null;
      })
    );

    return Promise.all(promises);
  }

  /**
   * 获取统计信息
   */
  getStats(): DedupeStats {
    this.cleanExpiredCache();

    return {
      ...this.stats,
      savedRequests: this.stats.deduplicatedRequests + this.stats.cacheHits,
    };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      deduplicatedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      activeRequests: this.pendingRequests.size,
      savedRequests: 0,
    };
  }

  /**
   * 获取缓存信息
   */
  getCacheInfo(): { size: number; keys: string[] } {
    this.cleanExpiredCache();

    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// 全局实例
const requestDedupeManager = new RequestDedupeManager();

// 导出便利函数
export const dedupeRequest = <T = any>(
  url: string,
  config?: RequestConfig
): Promise<T> => {
  return requestDedupeManager.request<T>(url, config);
};

export const cancelRequest = (url: string, config?: RequestConfig): boolean => {
  return requestDedupeManager.cancelRequest(url, config);
};

export const cancelAllRequests = (): void => {
  requestDedupeManager.cancelAllRequests();
};

export const clearCache = (url?: string, config?: RequestConfig): void => {
  requestDedupeManager.clearCache(url, config);
};

export const warmupCache = <T = any>(
  url: string,
  config?: RequestConfig
): Promise<T> => {
  return requestDedupeManager.warmupCache<T>(url, config);
};

export const batchWarmup = (
  requests: Array<{ url: string; config?: RequestConfig }>
): Promise<any[]> => {
  return requestDedupeManager.batchWarmup(requests);
};

export const getDedupeStats = (): DedupeStats => {
  return requestDedupeManager.getStats();
};

export const resetDedupeStats = (): void => {
  requestDedupeManager.resetStats();
};

export const getCacheInfo = (): { size: number; keys: string[] } => {
  return requestDedupeManager.getCacheInfo();
};

export { RequestDedupeManager };
export type { RequestConfig, DedupeStats };
