"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useNetworkStatus, NetworkQuality } from "./useNetworkStatus";
import { useUserActivity, UserActivityState } from "./useUserActivity";
import { useChatStatusStore } from "@/stores/chatStatusStore";
import { executeWithRetry, RETRY_CONFIGS } from "@/lib/retry-manager";

// 恢复事件类型
export enum RecoveryEventType {
  PAGE_VISIBLE = "page_visible",
  NETWORK_RECOVERY = "network_recovery",
  TAB_FOCUS = "tab_focus",
  USER_ACTIVITY = "user_activity",
  MANUAL = "manual",
}

// 恢复任务类型
export enum RecoveryTaskType {
  CONVERSATION_STATUS = "conversation_status",
  MESSAGES = "messages",
  USER_STATUS = "user_status",
  CACHE_SYNC = "cache_sync",
  FULL_SYNC = "full_sync",
}

// 恢复配置
interface RecoveryConfig {
  enableAutoRecovery: boolean;
  recoveryDelay: number; // 恢复延迟（毫秒）
  maxRecoveryAttempts: number; // 最大恢复尝试次数
  enableBatchRecovery: boolean; // 启用批量恢复
  priorityTasks: RecoveryTaskType[]; // 优先任务列表
  backgroundSyncInterval: number; // 后台同步间隔
}

// 恢复任务
interface RecoveryTask {
  type: RecoveryTaskType;
  priority: number;
  timeout: number;
  data?: any;
  callback: () => Promise<void>;
}

// 恢复状态
interface RecoveryState {
  isRecovering: boolean;
  lastRecoveryTime: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  activeRecoveryType: RecoveryEventType | null;
  recoveryHistory: RecoveryRecord[];
}

// 恢复记录
interface RecoveryRecord {
  timestamp: number;
  eventType: RecoveryEventType;
  taskType: RecoveryTaskType;
  success: boolean;
  duration: number;
  error?: string;
}

interface UseStateRecoveryOptions {
  conversationId?: string;
  config?: Partial<RecoveryConfig>;
  onRecoveryStart?: (eventType: RecoveryEventType) => void;
  onRecoveryComplete?: (success: boolean, results: RecoveryRecord[]) => void;
  onRecoveryError?: (error: Error, taskType: RecoveryTaskType) => void;
}

interface UseStateRecoveryReturn {
  recoveryState: RecoveryState;
  triggerRecovery: (
    eventType: RecoveryEventType,
    taskTypes?: RecoveryTaskType[]
  ) => Promise<void>;
  pauseAutoRecovery: () => void;
  resumeAutoRecovery: () => void;
  getRecoveryStats: () => RecoveryStats;
  clearRecoveryHistory: () => void;
}

interface RecoveryStats {
  totalRecoveries: number;
  successRate: number;
  averageRecoveryTime: number;
  lastRecoveryTime: number;
  recentFailures: number;
}

const DEFAULT_CONFIG: RecoveryConfig = {
  enableAutoRecovery: true,
  recoveryDelay: 1000,
  maxRecoveryAttempts: 3,
  enableBatchRecovery: true,
  priorityTasks: [
    RecoveryTaskType.CONVERSATION_STATUS,
    RecoveryTaskType.MESSAGES,
    RecoveryTaskType.USER_STATUS,
    RecoveryTaskType.CACHE_SYNC,
  ],
  backgroundSyncInterval: 30000, // 30秒
};

export function useStateRecovery(
  options: UseStateRecoveryOptions = {}
): UseStateRecoveryReturn {
  const {
    conversationId,
    config: userConfig = {},
    onRecoveryStart,
    onRecoveryComplete,
    onRecoveryError,
  } = options;

  const config = { ...DEFAULT_CONFIG, ...userConfig };

  // Hooks
  const networkStatus = useNetworkStatus();
  const userActivity = useUserActivity();
  const chatStore = useChatStatusStore();

  // State
  const [recoveryState, setRecoveryState] = useState<RecoveryState>({
    isRecovering: false,
    lastRecoveryTime: 0,
    successfulRecoveries: 0,
    failedRecoveries: 0,
    activeRecoveryType: null,
    recoveryHistory: [],
  });

  const [isAutoRecoveryPaused, setIsAutoRecoveryPaused] = useState(false);

  // Refs
  const lastNetworkState = useRef(networkStatus.networkState);
  const backgroundSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRecoveringRef = useRef(false);

  // 创建恢复任务
  const createRecoveryTasks = useCallback(
    (taskTypes?: RecoveryTaskType[]): RecoveryTask[] => {
      const targetTypes = taskTypes || config.priorityTasks;
      const tasks: RecoveryTask[] = [];

      targetTypes.forEach((taskType, index) => {
        let task: RecoveryTask;

        switch (taskType) {
          case RecoveryTaskType.CONVERSATION_STATUS:
            task = {
              type: taskType,
              priority: index + 1,
              timeout: 5000,
              callback: async () => {
                if (conversationId) {
                  // 检查特定会话状态
                  console.log(`恢复会话状态: ${conversationId}`);
                  const cachedStatus =
                    chatStore.getConversationStatus(conversationId);
                  if (!cachedStatus) {
                    // 如果缓存中没有，强制刷新
                    await chatStore.syncWithServer([conversationId]);
                  }
                } else {
                  // 恢复所有会话状态
                  console.log("恢复所有会话状态");
                  // 这里可以调用批量状态检查
                }
              },
            };
            break;

          case RecoveryTaskType.MESSAGES:
            task = {
              type: taskType,
              priority: index + 1,
              timeout: 8000,
              callback: async () => {
                if (conversationId) {
                  console.log(`恢复会话消息: ${conversationId}`);
                  // 检查消息缓存是否需要刷新
                  const messageCache =
                    chatStore.getMessagesCache(conversationId);
                  if (
                    !messageCache ||
                    Date.now() - messageCache.lastFetched > 60000
                  ) {
                    // 缓存过期，需要重新获取
                    console.log("消息缓存过期，重新获取");
                    // 这里需要调用实际的消息获取API
                  }
                }
              },
            };
            break;

          case RecoveryTaskType.USER_STATUS:
            task = {
              type: taskType,
              priority: index + 1,
              timeout: 3000,
              callback: async () => {
                console.log("恢复用户状态");
                // 重置用户活动统计
                userActivity.resetActivity();
              },
            };
            break;

          case RecoveryTaskType.CACHE_SYNC:
            task = {
              type: taskType,
              priority: index + 1,
              timeout: 5000,
              callback: async () => {
                console.log("同步缓存状态");
                // 清理过期缓存
                chatStore.cleanExpiredCache();
              },
            };
            break;

          case RecoveryTaskType.FULL_SYNC:
            task = {
              type: taskType,
              priority: index + 1,
              timeout: 15000,
              callback: async () => {
                console.log("执行完整状态同步");
                // 清理所有缓存并重新获取
                chatStore.clearAllCache();
                if (conversationId) {
                  await chatStore.syncWithServer([conversationId]);
                }
              },
            };
            break;

          default:
            return;
        }

        tasks.push(task);
      });

      // 按优先级排序
      return tasks.sort((a, b) => a.priority - b.priority);
    },
    [config.priorityTasks, conversationId, chatStore, userActivity]
  );

  // 执行恢复任务
  const executeRecoveryTask = useCallback(
    async (task: RecoveryTask): Promise<RecoveryRecord> => {
      const startTime = Date.now();

      try {
        console.log(`执行恢复任务: ${task.type}`);

        const result = await executeWithRetry(
          task.callback,
          {
            ...RETRY_CONFIGS.NETWORK,
            maxAttempts: 2, // 恢复任务使用较少的重试次数
            retryableErrors: [...RETRY_CONFIGS.NETWORK.retryableErrors], // 创建可变副本
          },
          `recovery_${task.type}`
        );

        const duration = Date.now() - startTime;

        if (result.success) {
          return {
            timestamp: startTime,
            eventType:
              recoveryState.activeRecoveryType || RecoveryEventType.MANUAL,
            taskType: task.type,
            success: true,
            duration,
          };
        } else {
          throw result.error || new Error(`恢复任务失败: ${task.type}`);
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        console.error(`恢复任务失败: ${task.type}`, error);

        if (onRecoveryError) {
          onRecoveryError(
            error instanceof Error ? error : new Error(errorMessage),
            task.type
          );
        }

        return {
          timestamp: startTime,
          eventType:
            recoveryState.activeRecoveryType || RecoveryEventType.MANUAL,
          taskType: task.type,
          success: false,
          duration,
          error: errorMessage,
        };
      }
    },
    [recoveryState.activeRecoveryType, onRecoveryError]
  );

  // 执行恢复流程
  const executeRecovery = useCallback(
    async (
      eventType: RecoveryEventType,
      taskTypes?: RecoveryTaskType[]
    ): Promise<void> => {
      if (isRecoveringRef.current) {
        console.log("恢复流程已在进行中，跳过此次恢复");
        return;
      }

      isRecoveringRef.current = true;

      setRecoveryState((prev) => ({
        ...prev,
        isRecovering: true,
        activeRecoveryType: eventType,
      }));

      if (onRecoveryStart) {
        onRecoveryStart(eventType);
      }

      const recoveryStartTime = Date.now();
      const tasks = createRecoveryTasks(taskTypes);
      const results: RecoveryRecord[] = [];

      try {
        if (config.enableBatchRecovery) {
          // 批量执行恢复任务
          const promises = tasks.map((task) => executeRecoveryTask(task));
          const taskResults = await Promise.allSettled(promises);

          taskResults.forEach((result, index) => {
            if (result.status === "fulfilled") {
              results.push(result.value);
            } else {
              results.push({
                timestamp: Date.now(),
                eventType,
                taskType: tasks[index].type,
                success: false,
                duration: 0,
                error: result.reason?.message || "任务执行失败",
              });
            }
          });
        } else {
          // 串行执行恢复任务
          for (const task of tasks) {
            const result = await executeRecoveryTask(task);
            results.push(result);

            // 如果是高优先级任务失败，可以选择中断后续任务
            if (!result.success && task.priority <= 2) {
              console.warn(`高优先级恢复任务失败，中断后续任务: ${task.type}`);
              break;
            }
          }
        }

        const successfulTasks = results.filter((r) => r.success).length;
        const totalDuration = Date.now() - recoveryStartTime;

        // 更新恢复状态
        setRecoveryState((prev) => ({
          ...prev,
          isRecovering: false,
          activeRecoveryType: null,
          lastRecoveryTime: Date.now(),
          successfulRecoveries:
            successfulTasks > 0
              ? prev.successfulRecoveries + 1
              : prev.successfulRecoveries,
          failedRecoveries:
            successfulTasks === 0
              ? prev.failedRecoveries + 1
              : prev.failedRecoveries,
          recoveryHistory: [...prev.recoveryHistory, ...results].slice(-50), // 保留最近50条记录
        }));

        if (onRecoveryComplete) {
          onRecoveryComplete(successfulTasks > 0, results);
        }

        console.log(
          `恢复流程完成: ${successfulTasks}/${results.length} 个任务成功，耗时 ${totalDuration}ms`
        );
      } catch (error) {
        console.error("恢复流程执行失败:", error);

        setRecoveryState((prev) => ({
          ...prev,
          isRecovering: false,
          activeRecoveryType: null,
          failedRecoveries: prev.failedRecoveries + 1,
        }));

        if (onRecoveryComplete) {
          onRecoveryComplete(false, results);
        }
      } finally {
        isRecoveringRef.current = false;
      }
    },
    [
      config.enableBatchRecovery,
      createRecoveryTasks,
      executeRecoveryTask,
      onRecoveryStart,
      onRecoveryComplete,
    ]
  );

  // 触发恢复（带延迟）
  const triggerRecovery = useCallback(
    async (
      eventType: RecoveryEventType,
      taskTypes?: RecoveryTaskType[]
    ): Promise<void> => {
      if (
        !config.enableAutoRecovery &&
        eventType !== RecoveryEventType.MANUAL
      ) {
        return;
      }

      if (isAutoRecoveryPaused && eventType !== RecoveryEventType.MANUAL) {
        console.log("自动恢复已暂停，跳过恢复");
        return;
      }

      // 清除之前的恢复定时器
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current);
      }

      console.log(`计划执行恢复: ${eventType}, 延迟 ${config.recoveryDelay}ms`);

      recoveryTimeoutRef.current = setTimeout(() => {
        executeRecovery(eventType, taskTypes);
      }, config.recoveryDelay);
    },
    [
      config.enableAutoRecovery,
      config.recoveryDelay,
      isAutoRecoveryPaused,
      executeRecovery,
    ]
  );

  // 监听页面可见性变化
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("页面重新可见，触发状态恢复");
        triggerRecovery(RecoveryEventType.PAGE_VISIBLE);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [triggerRecovery]);

  // 监听网络状态恢复
  useEffect(() => {
    const currentNetworkState = networkStatus.networkState;
    const previousNetworkState = lastNetworkState.current;

    // 检查网络恢复
    if (!previousNetworkState.isOnline && currentNetworkState.isOnline) {
      console.log("网络已恢复，触发状态恢复");
      triggerRecovery(RecoveryEventType.NETWORK_RECOVERY);
    }

    // 检查网络质量提升
    if (previousNetworkState.quality !== currentNetworkState.quality) {
      const qualityLevels = ["offline", "poor", "slow", "good", "excellent"];
      const previousLevel = qualityLevels.indexOf(previousNetworkState.quality);
      const currentLevel = qualityLevels.indexOf(currentNetworkState.quality);

      if (currentLevel > previousLevel && currentLevel >= 2) {
        // slow及以上
        console.log("网络质量提升，触发状态恢复");
        triggerRecovery(RecoveryEventType.NETWORK_RECOVERY, [
          RecoveryTaskType.CONVERSATION_STATUS,
          RecoveryTaskType.CACHE_SYNC,
        ]);
      }
    }

    lastNetworkState.current = currentNetworkState;
  }, [networkStatus.networkState, triggerRecovery]);

  // 监听用户活动恢复
  useEffect(() => {
    if (
      userActivity.activityState === UserActivityState.ACTIVE &&
      userActivity.timeSinceLastActivity > 300000
    ) {
      // 5分钟无活动后重新活跃
      console.log("用户重新活跃，触发状态恢复");
      triggerRecovery(RecoveryEventType.USER_ACTIVITY, [
        RecoveryTaskType.CONVERSATION_STATUS,
        RecoveryTaskType.MESSAGES,
      ]);
    }
  }, [
    userActivity.activityState,
    userActivity.timeSinceLastActivity,
    triggerRecovery,
  ]);

  // 监听窗口焦点
  useEffect(() => {
    const handleFocus = () => {
      if (!userActivity.isFocused) {
        console.log("窗口重新获得焦点，触发状态恢复");
        triggerRecovery(RecoveryEventType.TAB_FOCUS);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [userActivity.isFocused, triggerRecovery]);

  // 后台同步
  useEffect(() => {
    if (!config.backgroundSyncInterval) return;

    const scheduleBackgroundSync = () => {
      if (backgroundSyncTimeoutRef.current) {
        clearTimeout(backgroundSyncTimeoutRef.current);
      }

      backgroundSyncTimeoutRef.current = setTimeout(() => {
        if (
          userActivity.activityState !== UserActivityState.HIDDEN &&
          networkStatus.isNetworkSuitable(NetworkQuality.SLOW)
        ) {
          console.log("执行后台同步");
          triggerRecovery(RecoveryEventType.MANUAL, [
            RecoveryTaskType.CACHE_SYNC,
          ]);
        }
        scheduleBackgroundSync(); // 递归调度
      }, config.backgroundSyncInterval);
    };

    scheduleBackgroundSync();

    return () => {
      if (backgroundSyncTimeoutRef.current) {
        clearTimeout(backgroundSyncTimeoutRef.current);
      }
    };
  }, [
    config.backgroundSyncInterval,
    userActivity.activityState,
    networkStatus,
    triggerRecovery,
  ]);

  // 暂停和恢复自动恢复
  const pauseAutoRecovery = useCallback(() => {
    setIsAutoRecoveryPaused(true);
    console.log("自动状态恢复已暂停");
  }, []);

  const resumeAutoRecovery = useCallback(() => {
    setIsAutoRecoveryPaused(false);
    console.log("自动状态恢复已恢复");
  }, []);

  // 获取恢复统计
  const getRecoveryStats = useCallback((): RecoveryStats => {
    const totalRecoveries =
      recoveryState.successfulRecoveries + recoveryState.failedRecoveries;
    const successRate =
      totalRecoveries > 0
        ? recoveryState.successfulRecoveries / totalRecoveries
        : 0;

    const recentHistory = recoveryState.recoveryHistory.slice(-10);
    const avgTime =
      recentHistory.length > 0
        ? recentHistory.reduce((sum, record) => sum + record.duration, 0) /
          recentHistory.length
        : 0;

    const recentFailures = recentHistory.filter(
      (record) => !record.success
    ).length;

    return {
      totalRecoveries,
      successRate,
      averageRecoveryTime: avgTime,
      lastRecoveryTime: recoveryState.lastRecoveryTime,
      recentFailures,
    };
  }, [recoveryState]);

  // 清理恢复历史
  const clearRecoveryHistory = useCallback(() => {
    setRecoveryState((prev) => ({
      ...prev,
      recoveryHistory: [],
      successfulRecoveries: 0,
      failedRecoveries: 0,
    }));
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current);
      }
      if (backgroundSyncTimeoutRef.current) {
        clearTimeout(backgroundSyncTimeoutRef.current);
      }
    };
  }, []);

  return {
    recoveryState,
    triggerRecovery,
    pauseAutoRecovery,
    resumeAutoRecovery,
    getRecoveryStats,
    clearRecoveryHistory,
  };
}
