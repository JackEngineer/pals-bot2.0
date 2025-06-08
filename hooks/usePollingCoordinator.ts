"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  usePollingManager,
  PollingLevel,
  ActivityLevel,
} from "./usePollingManager";
import { useNetworkStatus, NetworkQuality } from "./useNetworkStatus";
import { useChatStatusStore } from "@/stores/chatStatusStore";

// 轮询任务接口
interface PollingTask {
  id: string;
  type: "conversation_status" | "messages" | "user_status" | "custom";
  priority: number; // 1-10, 数字越小优先级越高
  interval: number;
  callback: () => Promise<void>;
  lastExecuted: number;
  isActive: boolean;
  dependencies?: string[]; // 依赖的其他任务
  retryCount: number;
  maxRetries: number;
}

// 轮询统计
interface PollingStats {
  totalTasks: number;
  activeTasks: number;
  executedTasks: number;
  failedTasks: number;
  averageInterval: number;
  lastCoordination: number;
}

// 协调器配置
interface CoordinatorConfig {
  maxConcurrentTasks: number;
  taskTimeout: number;
  enablePriorityScheduling: boolean;
  enableBatching: boolean;
  batchWindow: number;
  adaptiveScheduling: boolean;
}

interface UsePollingCoordinatorOptions {
  isMainTab?: boolean;
  enableCrossTabCoordination?: boolean;
  config?: Partial<CoordinatorConfig>;
}

interface UsePollingCoordinatorReturn {
  registerTask: (
    task: Omit<PollingTask, "id" | "lastExecuted" | "retryCount">
  ) => string;
  unregisterTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<PollingTask>) => void;
  pauseTask: (taskId: string) => void;
  resumeTask: (taskId: string) => void;
  pauseAllTasks: () => void;
  resumeAllTasks: () => void;
  forceExecuteTask: (taskId: string) => Promise<void>;
  getTaskStatus: (taskId: string) => PollingTask | null;
  getStats: () => PollingStats;
  isMainCoordinator: boolean;
}

const DEFAULT_CONFIG: CoordinatorConfig = {
  maxConcurrentTasks: 3,
  taskTimeout: 10000,
  enablePriorityScheduling: true,
  enableBatching: true,
  batchWindow: 1000,
  adaptiveScheduling: true,
};

export function usePollingCoordinator(
  options: UsePollingCoordinatorOptions = {}
): UsePollingCoordinatorReturn {
  const {
    isMainTab = true,
    enableCrossTabCoordination = true,
    config: userConfig = {},
  } = options;

  const config = { ...DEFAULT_CONFIG, ...userConfig };

  // Hooks
  const pollingManager = usePollingManager();
  const networkStatus = useNetworkStatus();
  const chatStore = useChatStatusStore();

  // State
  const [tasks, setTasks] = useState<Map<string, PollingTask>>(new Map());
  const [isMainCoordinator, setIsMainCoordinator] = useState(isMainTab);
  const [stats, setStats] = useState<PollingStats>({
    totalTasks: 0,
    activeTasks: 0,
    executedTasks: 0,
    failedTasks: 0,
    averageInterval: 0,
    lastCoordination: Date.now(),
  });

  // Refs
  const coordinatorRef = useRef<NodeJS.Timeout | null>(null);
  const executingTasks = useRef<Set<string>>(new Set());
  const taskQueue = useRef<string[]>([]);
  const batchedTasks = useRef<Map<string, string[]>>(new Map());

  // 生成任务ID
  const generateTaskId = useCallback(() => {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // 计算自适应间隔
  const calculateAdaptiveInterval = useCallback(
    (task: PollingTask): number => {
      if (!config.adaptiveScheduling) return task.interval;

      let adaptiveInterval = task.interval;

      // 根据网络状态调整
      const networkMultiplier = networkStatus.getOptimalPollingInterval(1);
      adaptiveInterval *= networkMultiplier;

      // 根据用户活动状态调整
      const activityMultiplier = (() => {
        switch (pollingManager.activityLevel) {
          case ActivityLevel.HIDDEN:
            return 0; // 暂停
          case ActivityLevel.IDLE:
            return 2.0;
          case ActivityLevel.ACTIVE:
            return 1.0;
          case ActivityLevel.TYPING:
            return 0.5;
          case ActivityLevel.VERY_ACTIVE:
            return 0.3;
          default:
            return 1.0;
        }
      })();

      adaptiveInterval *= activityMultiplier;

      // 根据任务优先级调整
      const priorityMultiplier =
        task.priority <= 3 ? 0.8 : task.priority >= 7 ? 1.5 : 1.0;
      adaptiveInterval *= priorityMultiplier;

      return Math.max(1000, Math.round(adaptiveInterval));
    },
    [networkStatus, pollingManager.activityLevel, config.adaptiveScheduling]
  );

  // 检查任务是否可以执行
  const canExecuteTask = useCallback(
    (task: PollingTask): boolean => {
      if (!task.isActive) return false;
      if (executingTasks.current.has(task.id)) return false;
      if (!networkStatus.isNetworkSuitable(NetworkQuality.SLOW)) return false;

      const adaptiveInterval = calculateAdaptiveInterval(task);
      const timeSinceLastExecution = Date.now() - task.lastExecuted;

      return timeSinceLastExecution >= adaptiveInterval;
    },
    [networkStatus, calculateAdaptiveInterval]
  );

  // 执行单个任务
  const executeTask = useCallback(
    async (taskId: string): Promise<void> => {
      const task = tasks.get(taskId);
      if (!task || !canExecuteTask(task)) return;

      executingTasks.current.add(taskId);

      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error("Task timeout")),
            config.taskTimeout
          );
        });

        await Promise.race([task.callback(), timeoutPromise]);

        // 更新任务状态
        setTasks((prev) => {
          const updated = new Map(prev);
          const updatedTask = updated.get(taskId);
          if (updatedTask) {
            updatedTask.lastExecuted = Date.now();
            updatedTask.retryCount = 0;
          }
          return updated;
        });

        setStats((prev) => ({
          ...prev,
          executedTasks: prev.executedTasks + 1,
        }));
      } catch (error) {
        console.warn(`轮询任务执行失败 ${taskId}:`, error);

        // 更新重试计数
        setTasks((prev) => {
          const updated = new Map(prev);
          const updatedTask = updated.get(taskId);
          if (updatedTask) {
            updatedTask.retryCount++;
            if (updatedTask.retryCount >= updatedTask.maxRetries) {
              updatedTask.isActive = false;
            }
          }
          return updated;
        });

        setStats((prev) => ({
          ...prev,
          failedTasks: prev.failedTasks + 1,
        }));
      } finally {
        executingTasks.current.delete(taskId);
      }
    },
    [tasks, canExecuteTask, config.taskTimeout]
  );

  // 批量执行相似任务
  const executeBatchedTasks = useCallback(
    async (taskType: string, taskIds: string[]): Promise<void> => {
      if (taskIds.length === 0) return;

      try {
        switch (taskType) {
          case "conversation_status":
            // 批量检查会话状态
            const conversationIds = taskIds
              .map((id) => {
                const task = tasks.get(id);
                return task?.dependencies?.[0]; // 假设依赖中有conversationId
              })
              .filter(Boolean) as string[];

            if (conversationIds.length > 0) {
              // 这里调用批量API
              console.log(`批量检查会话状态: ${conversationIds.length} 个会话`);
              await chatStore.syncWithServer(conversationIds);
            }
            break;

          default:
            // 对于其他类型，逐个执行
            for (const taskId of taskIds) {
              await executeTask(taskId);
            }
        }

        // 更新所有批量任务的执行时间
        setTasks((prev) => {
          const updated = new Map(prev);
          taskIds.forEach((taskId) => {
            const task = updated.get(taskId);
            if (task) {
              task.lastExecuted = Date.now();
              task.retryCount = 0;
            }
          });
          return updated;
        });
      } catch (error) {
        console.warn(`批量任务执行失败:`, error);

        // 标记失败的任务
        setTasks((prev) => {
          const updated = new Map(prev);
          taskIds.forEach((taskId) => {
            const task = updated.get(taskId);
            if (task) {
              task.retryCount++;
            }
          });
          return updated;
        });
      }
    },
    [tasks, executeTask, chatStore]
  );

  // 协调器主循环
  const coordinationLoop = useCallback(async () => {
    if (!isMainCoordinator) return;

    const now = Date.now();
    const readyTasks: string[] = [];
    const batchGroups = new Map<string, string[]>();

    // 收集可执行的任务
    for (const [taskId, task] of tasks.entries()) {
      if (canExecuteTask(task)) {
        readyTasks.push(taskId);

        // 如果启用批处理，按类型分组
        if (config.enableBatching) {
          const groupKey = task.type;
          if (!batchGroups.has(groupKey)) {
            batchGroups.set(groupKey, []);
          }
          batchGroups.get(groupKey)!.push(taskId);
        }
      }
    }

    // 按优先级排序
    if (config.enablePriorityScheduling) {
      readyTasks.sort((a, b) => {
        const taskA = tasks.get(a);
        const taskB = tasks.get(b);
        return (taskA?.priority || 10) - (taskB?.priority || 10);
      });
    }

    // 限制并发任务数
    const tasksToExecute = readyTasks.slice(0, config.maxConcurrentTasks);

    // 执行任务
    if (config.enableBatching) {
      // 批量执行
      for (const [taskType, taskIds] of batchGroups.entries()) {
        const limitedTaskIds = taskIds.slice(0, config.maxConcurrentTasks);
        if (limitedTaskIds.length > 1) {
          await executeBatchedTasks(taskType, limitedTaskIds);
        } else if (limitedTaskIds.length === 1) {
          await executeTask(limitedTaskIds[0]);
        }
      }
    } else {
      // 逐个执行
      const promises = tasksToExecute.map((taskId) => executeTask(taskId));
      await Promise.allSettled(promises);
    }

    // 更新统计
    setStats((prev) => ({
      ...prev,
      totalTasks: tasks.size,
      activeTasks: Array.from(tasks.values()).filter((t) => t.isActive).length,
      averageInterval:
        Array.from(tasks.values()).reduce((sum, t) => sum + t.interval, 0) /
          tasks.size || 0,
      lastCoordination: now,
    }));
  }, [
    tasks,
    isMainCoordinator,
    canExecuteTask,
    executeTask,
    executeBatchedTasks,
    config,
  ]);

  // 启动协调器
  useEffect(() => {
    if (!isMainCoordinator) return;

    const startCoordination = () => {
      if (coordinatorRef.current) {
        clearInterval(coordinatorRef.current);
      }

      const interval = pollingManager.currentInterval || PollingLevel.NORMAL;
      coordinatorRef.current = setInterval(
        coordinationLoop,
        Math.max(1000, interval / 2)
      );
    };

    startCoordination();

    return () => {
      if (coordinatorRef.current) {
        clearInterval(coordinatorRef.current);
      }
    };
  }, [coordinationLoop, isMainCoordinator, pollingManager.currentInterval]);

  // 跨标签页协调
  useEffect(() => {
    if (!enableCrossTabCoordination) return;

    const handleVisibilityChange = () => {
      if (!document.hidden && !isMainCoordinator) {
        // 页面重新激活，检查是否需要成为主协调器
        setTimeout(() => {
          setIsMainCoordinator(true);
        }, 1000);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "polling_coordinator_heartbeat") {
        const data = JSON.parse(event.newValue || "{}");
        if (data.timestamp && Date.now() - data.timestamp < 5000) {
          // 有其他主协调器在运行
          if (isMainCoordinator) {
            setIsMainCoordinator(false);
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorage);

    // 定期发送心跳
    const heartbeatInterval = setInterval(() => {
      if (isMainCoordinator) {
        localStorage.setItem(
          "polling_coordinator_heartbeat",
          JSON.stringify({
            timestamp: Date.now(),
            tabId: Math.random().toString(36).substr(2, 9),
          })
        );
      }
    }, 3000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorage);
      clearInterval(heartbeatInterval);
    };
  }, [enableCrossTabCoordination, isMainCoordinator]);

  // API 方法
  const registerTask = useCallback(
    (
      taskData: Omit<PollingTask, "id" | "lastExecuted" | "retryCount">
    ): string => {
      const taskId = generateTaskId();
      const task: PollingTask = {
        ...taskData,
        id: taskId,
        lastExecuted: 0,
        retryCount: 0,
      };

      setTasks((prev) => new Map(prev).set(taskId, task));
      return taskId;
    },
    [generateTaskId]
  );

  const unregisterTask = useCallback((taskId: string) => {
    setTasks((prev) => {
      const updated = new Map(prev);
      updated.delete(taskId);
      return updated;
    });
    executingTasks.current.delete(taskId);
  }, []);

  const updateTask = useCallback(
    (taskId: string, updates: Partial<PollingTask>) => {
      setTasks((prev) => {
        const updated = new Map(prev);
        const task = updated.get(taskId);
        if (task) {
          Object.assign(task, updates);
        }
        return updated;
      });
    },
    []
  );

  const pauseTask = useCallback(
    (taskId: string) => {
      updateTask(taskId, { isActive: false });
    },
    [updateTask]
  );

  const resumeTask = useCallback(
    (taskId: string) => {
      updateTask(taskId, { isActive: true });
    },
    [updateTask]
  );

  const pauseAllTasks = useCallback(() => {
    setTasks((prev) => {
      const updated = new Map(prev);
      for (const task of updated.values()) {
        task.isActive = false;
      }
      return updated;
    });
  }, []);

  const resumeAllTasks = useCallback(() => {
    setTasks((prev) => {
      const updated = new Map(prev);
      for (const task of updated.values()) {
        task.isActive = true;
      }
      return updated;
    });
  }, []);

  const forceExecuteTask = useCallback(
    async (taskId: string) => {
      await executeTask(taskId);
    },
    [executeTask]
  );

  const getTaskStatus = useCallback(
    (taskId: string): PollingTask | null => {
      return tasks.get(taskId) || null;
    },
    [tasks]
  );

  const getStats = useCallback(() => stats, [stats]);

  return {
    registerTask,
    unregisterTask,
    updateTask,
    pauseTask,
    resumeTask,
    pauseAllTasks,
    resumeAllTasks,
    forceExecuteTask,
    getTaskStatus,
    getStats,
    isMainCoordinator,
  };
}
