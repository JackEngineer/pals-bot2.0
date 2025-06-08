"use client";

import React from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// 会话状态接口
interface ConversationStatus {
  id: string;
  exists: boolean;
  isActive: boolean;
  lastActivityAt: string | null;
  participantCount: number;
  hasUnreadMessages: boolean;
  lastMessageAt: string | null;
  lastChecked: number; // 添加本地检查时间戳
}

// 消息缓存接口
interface MessageCache {
  conversationId: string;
  messages: any[];
  lastMessageId: string | null;
  totalCount: number;
  hasMoreMessages: boolean;
  lastFetched: number;
}

// 用户信息缓存
interface UserCache {
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  lastUpdated: number;
}

// 缓存配置
interface CacheConfig {
  conversationStatusTTL: number; // 会话状态缓存时间
  messagesCacheTTL: number; // 消息缓存时间
  userCacheTTL: number; // 用户信息缓存时间
  maxConversationCache: number; // 最大缓存会话数
  maxMessageCache: number; // 最大缓存消息数
  enablePersistence: boolean; // 是否启用持久化
}

// Store 状态接口
interface ChatStatusStore {
  // 缓存数据
  conversationStatuses: Record<string, ConversationStatus>;
  messagesCaches: Record<string, MessageCache>;
  userCaches: Record<number, UserCache>;

  // 缓存配置
  config: CacheConfig;

  // 缓存统计
  stats: {
    hitCount: number;
    missCount: number;
    totalRequests: number;
    cacheSize: number;
    lastCleanup: number;
  };

  // 会话状态操作
  setConversationStatus: (id: string, status: ConversationStatus) => void;
  getConversationStatus: (id: string) => ConversationStatus | null;
  removeConversationStatus: (id: string) => void;
  batchSetConversationStatuses: (statuses: ConversationStatus[]) => void;

  // 消息缓存操作
  setMessagesCache: (
    conversationId: string,
    cache: Omit<MessageCache, "conversationId">
  ) => void;
  getMessagesCache: (conversationId: string) => MessageCache | null;
  appendMessages: (conversationId: string, newMessages: any[]) => void;
  prependMessages: (conversationId: string, oldMessages: any[]) => void;
  removeMessagesCache: (conversationId: string) => void;

  // 用户缓存操作
  setUserCache: (user: Omit<UserCache, "lastUpdated">) => void;
  getUserCache: (telegramId: number) => UserCache | null;
  removeUserCache: (telegramId: number) => void;

  // 缓存管理
  cleanExpiredCache: () => void;
  clearAllCache: () => void;
  updateConfig: (newConfig: Partial<CacheConfig>) => void;
  getCacheStats: () => {
    hitCount: number;
    missCount: number;
    totalRequests: number;
    cacheSize: number;
    lastCleanup: number;
    hitRate: number;
    conversationCacheCount: number;
    messageCacheCount: number;
    userCacheCount: number;
  };

  // 智能预取
  preloadConversationStatus: (id: string) => Promise<ConversationStatus | null>;
  preloadMessages: (conversationId: string) => Promise<MessageCache | null>;

  // 缓存同步
  syncWithServer: (conversationIds: string[]) => Promise<void>;
}

const DEFAULT_CONFIG: CacheConfig = {
  conversationStatusTTL: 30000, // 30秒
  messagesCacheTTL: 120000, // 2分钟
  userCacheTTL: 300000, // 5分钟
  maxConversationCache: 50, // 最多50个会话
  maxMessageCache: 20, // 最多20个消息缓存
  enablePersistence: true, // 启用持久化
};

export const useChatStatusStore = create<ChatStatusStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      conversationStatuses: {},
      messagesCaches: {},
      userCaches: {},
      config: DEFAULT_CONFIG,
      stats: {
        hitCount: 0,
        missCount: 0,
        totalRequests: 0,
        cacheSize: 0,
        lastCleanup: Date.now(),
      },

      // 会话状态操作
      setConversationStatus: (id: string, status: ConversationStatus) => {
        const state = get();

        set({
          conversationStatuses: {
            ...state.conversationStatuses,
            [id]: {
              ...status,
              lastChecked: Date.now(),
            },
          },
          stats: {
            ...state.stats,
            cacheSize: Object.keys(state.conversationStatuses).length + 1,
          },
        });

        // 检查是否需要清理缓存
        get().cleanExpiredCache();
      },

      getConversationStatus: (id: string) => {
        const state = get();
        const status = state.conversationStatuses[id];

        set({
          stats: {
            ...state.stats,
            totalRequests: state.stats.totalRequests + 1,
            hitCount: status ? state.stats.hitCount + 1 : state.stats.hitCount,
            missCount: status
              ? state.stats.missCount
              : state.stats.missCount + 1,
          },
        });

        if (!status) return null;

        // 检查是否过期
        const isExpired =
          Date.now() - status.lastChecked > state.config.conversationStatusTTL;
        if (isExpired) {
          get().removeConversationStatus(id);
          return null;
        }

        return status;
      },

      removeConversationStatus: (id: string) => {
        const state = get();
        const { [id]: removed, ...rest } = state.conversationStatuses;

        set({
          conversationStatuses: rest,
          stats: {
            ...state.stats,
            cacheSize: Object.keys(rest).length,
          },
        });
      },

      batchSetConversationStatuses: (statuses: ConversationStatus[]) => {
        const state = get();
        const now = Date.now();

        const newStatuses = statuses.reduce((acc, status) => {
          acc[status.id] = {
            ...status,
            lastChecked: now,
          };
          return acc;
        }, {} as Record<string, ConversationStatus>);

        set({
          conversationStatuses: {
            ...state.conversationStatuses,
            ...newStatuses,
          },
          stats: {
            ...state.stats,
            cacheSize: Object.keys({
              ...state.conversationStatuses,
              ...newStatuses,
            }).length,
          },
        });

        get().cleanExpiredCache();
      },

      // 消息缓存操作
      setMessagesCache: (
        conversationId: string,
        cache: Omit<MessageCache, "conversationId">
      ) => {
        const state = get();

        set({
          messagesCaches: {
            ...state.messagesCaches,
            [conversationId]: {
              ...cache,
              conversationId,
              lastFetched: Date.now(),
            },
          },
        });

        get().cleanExpiredCache();
      },

      getMessagesCache: (conversationId: string) => {
        const state = get();
        const cache = state.messagesCaches[conversationId];

        if (!cache) return null;

        // 检查是否过期
        const isExpired =
          Date.now() - cache.lastFetched > state.config.messagesCacheTTL;
        if (isExpired) {
          get().removeMessagesCache(conversationId);
          return null;
        }

        return cache;
      },

      appendMessages: (conversationId: string, newMessages: any[]) => {
        const state = get();
        const existingCache = state.messagesCaches[conversationId];

        if (!existingCache) return;

        const updatedMessages = [...existingCache.messages, ...newMessages];
        const lastMessage = newMessages[newMessages.length - 1];

        set({
          messagesCaches: {
            ...state.messagesCaches,
            [conversationId]: {
              ...existingCache,
              messages: updatedMessages,
              lastMessageId: lastMessage?.id || existingCache.lastMessageId,
              totalCount: existingCache.totalCount + newMessages.length,
              lastFetched: Date.now(),
            },
          },
        });
      },

      prependMessages: (conversationId: string, oldMessages: any[]) => {
        const state = get();
        const existingCache = state.messagesCaches[conversationId];

        if (!existingCache) return;

        const updatedMessages = [...oldMessages, ...existingCache.messages];

        set({
          messagesCaches: {
            ...state.messagesCaches,
            [conversationId]: {
              ...existingCache,
              messages: updatedMessages,
              totalCount: existingCache.totalCount + oldMessages.length,
              lastFetched: Date.now(),
            },
          },
        });
      },

      removeMessagesCache: (conversationId: string) => {
        const state = get();
        const { [conversationId]: removed, ...rest } = state.messagesCaches;

        set({
          messagesCaches: rest,
        });
      },

      // 用户缓存操作
      setUserCache: (user: Omit<UserCache, "lastUpdated">) => {
        const state = get();

        set({
          userCaches: {
            ...state.userCaches,
            [user.telegramId]: {
              ...user,
              lastUpdated: Date.now(),
            },
          },
        });
      },

      getUserCache: (telegramId: number) => {
        const state = get();
        const user = state.userCaches[telegramId];

        if (!user) return null;

        // 检查是否过期
        const isExpired =
          Date.now() - user.lastUpdated > state.config.userCacheTTL;
        if (isExpired) {
          get().removeUserCache(telegramId);
          return null;
        }

        return user;
      },

      removeUserCache: (telegramId: number) => {
        const state = get();
        const { [telegramId]: removed, ...rest } = state.userCaches;

        set({
          userCaches: rest,
        });
      },

      // 缓存管理
      cleanExpiredCache: () => {
        const state = get();
        const now = Date.now();

        // 清理过期的会话状态
        const validConversationStatuses = Object.entries(
          state.conversationStatuses
        )
          .filter(
            ([_, status]) =>
              now - status.lastChecked < state.config.conversationStatusTTL
          )
          .reduce((acc, [id, status]) => {
            acc[id] = status;
            return acc;
          }, {} as Record<string, ConversationStatus>);

        // 清理过期的消息缓存
        const validMessagesCaches = Object.entries(state.messagesCaches)
          .filter(
            ([_, cache]) =>
              now - cache.lastFetched < state.config.messagesCacheTTL
          )
          .reduce((acc, [id, cache]) => {
            acc[id] = cache;
            return acc;
          }, {} as Record<string, MessageCache>);

        // 清理过期的用户缓存
        const validUserCaches = Object.entries(state.userCaches)
          .filter(
            ([_, user]) => now - user.lastUpdated < state.config.userCacheTTL
          )
          .reduce((acc, [id, user]) => {
            acc[parseInt(id)] = user;
            return acc;
          }, {} as Record<number, UserCache>);

        // 限制缓存大小
        const conversationEntries = Object.entries(validConversationStatuses);
        if (conversationEntries.length > state.config.maxConversationCache) {
          conversationEntries.sort(
            (a, b) => b[1].lastChecked - a[1].lastChecked
          );
          const limitedConversations = conversationEntries
            .slice(0, state.config.maxConversationCache)
            .reduce((acc, [id, status]) => {
              acc[id] = status;
              return acc;
            }, {} as Record<string, ConversationStatus>);

          set({
            conversationStatuses: limitedConversations,
          });
        } else {
          set({
            conversationStatuses: validConversationStatuses,
          });
        }

        // 限制消息缓存大小
        const messageCacheEntries = Object.entries(validMessagesCaches);
        if (messageCacheEntries.length > state.config.maxMessageCache) {
          messageCacheEntries.sort(
            (a, b) => b[1].lastFetched - a[1].lastFetched
          );
          const limitedMessageCaches = messageCacheEntries
            .slice(0, state.config.maxMessageCache)
            .reduce((acc, [id, cache]) => {
              acc[id] = cache;
              return acc;
            }, {} as Record<string, MessageCache>);

          set({
            messagesCaches: limitedMessageCaches,
          });
        } else {
          set({
            messagesCaches: validMessagesCaches,
          });
        }

        set({
          userCaches: validUserCaches,
          stats: {
            ...state.stats,
            lastCleanup: now,
            cacheSize: Object.keys(validConversationStatuses).length,
          },
        });
      },

      clearAllCache: () => {
        set({
          conversationStatuses: {},
          messagesCaches: {},
          userCaches: {},
          stats: {
            hitCount: 0,
            missCount: 0,
            totalRequests: 0,
            cacheSize: 0,
            lastCleanup: Date.now(),
          },
        });
      },

      updateConfig: (newConfig: Partial<CacheConfig>) => {
        const state = get();

        set({
          config: {
            ...state.config,
            ...newConfig,
          },
        });

        // 立即清理缓存以应用新配置
        get().cleanExpiredCache();
      },

      getCacheStats: () => {
        const state = get();
        return {
          ...state.stats,
          hitRate:
            state.stats.totalRequests > 0
              ? state.stats.hitCount / state.stats.totalRequests
              : 0,
          conversationCacheCount: Object.keys(state.conversationStatuses)
            .length,
          messageCacheCount: Object.keys(state.messagesCaches).length,
          userCacheCount: Object.keys(state.userCaches).length,
        };
      },

      // 智能预取（占位符，需要结合实际API）
      preloadConversationStatus: async (id: string) => {
        // 这里需要调用实际的API
        // 为了示例，我们返回null
        console.log(`预加载会话状态: ${id}`);
        return null;
      },

      preloadMessages: async (conversationId: string) => {
        // 这里需要调用实际的API
        // 为了示例，我们返回null
        console.log(`预加载消息: ${conversationId}`);
        return null;
      },

      // 缓存同步（占位符，需要结合实际API）
      syncWithServer: async (conversationIds: string[]) => {
        // 这里需要调用批量状态检查API
        console.log(`同步服务器状态: ${conversationIds.length} 个会话`);
      },
    }),
    {
      name: "chat-status-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // 只持久化会话状态和用户缓存，消息缓存不持久化
        conversationStatuses: state.conversationStatuses,
        userCaches: state.userCaches,
        config: state.config,
      }),
    }
  )
);

// 创建一个hook用于自动清理缓存
export const useCacheCleanup = () => {
  const cleanExpiredCache = useChatStatusStore(
    (state) => state.cleanExpiredCache
  );

  // 每隔5分钟自动清理一次缓存
  React.useEffect(() => {
    const interval = setInterval(() => {
      cleanExpiredCache();
    }, 300000); // 5分钟

    return () => clearInterval(interval);
  }, [cleanExpiredCache]);
};
