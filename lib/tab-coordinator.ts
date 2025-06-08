"use client";

/**
 * 浏览器标签页协调机制
 * 管理多个标签页之间的资源共享和任务协调
 */

import { recordUserExperience, UXQuality } from "@/lib/analytics";

// 标签页信息接口
export interface TabInfo {
  id: string;
  url: string;
  title: string;
  isActive: boolean;
  isMaster: boolean;
  isVisible: boolean;
  createdAt: number;
  lastActivity: number;
  userAgent: string;
  windowId?: string;
  parentTabId?: string;
  capabilities: TabCapabilities;
}

// 标签页能力
export interface TabCapabilities {
  canFocus: boolean;
  canNotify: boolean;
  canStore: boolean;
  canNetwork: boolean;
  canWorker: boolean;
  canAudio: boolean;
  canVideo: boolean;
  hasPermissions: string[];
}

// 协调任务类型
export enum TaskType {
  POLLING = "polling", // 轮询任务
  NOTIFICATION = "notification", // 通知任务
  STORAGE = "storage", // 存储任务
  NETWORK = "network", // 网络任务
  ANALYTICS = "analytics", // 分析任务
  CLEANUP = "cleanup", // 清理任务
  BACKGROUND = "background", // 后台任务
}

// 任务分配信息
export interface TaskAssignment {
  taskType: TaskType;
  assignedTo: string;
  priority: number;
  interval?: number;
  lastExecution?: number;
  metadata?: Record<string, any>;
}

// 协调状态
export interface CoordinationStatus {
  totalTabs: number;
  activeTabs: number;
  masterTabId: string | null;
  taskAssignments: TaskAssignment[];
  resourceUsage: {
    networkRequests: number;
    storageOperations: number;
    backgroundTasks: number;
  };
  lastCoordination: number;
}

// 消息类型
export enum MessageType {
  TAB_REGISTER = "tab_register",
  TAB_UPDATE = "tab_update",
  TAB_UNREGISTER = "tab_unregister",
  MASTER_ELECTION = "master_election",
  TASK_ASSIGNMENT = "task_assignment",
  TASK_RESULT = "task_result",
  RESOURCE_REQUEST = "resource_request",
  RESOURCE_RESPONSE = "resource_response",
  COORDINATION_UPDATE = "coordination_update",
}

// 资源类型
export enum ResourceType {
  NETWORK_SLOT = "network_slot",
  STORAGE_LOCK = "storage_lock",
  NOTIFICATION_PERMISSION = "notification_permission",
  AUDIO_CONTEXT = "audio_context",
  VIDEO_STREAM = "video_stream",
  WORKER_THREAD = "worker_thread",
}

// 资源请求
export interface ResourceRequest {
  id: string;
  type: ResourceType;
  requesterTabId: string;
  priority: number;
  duration?: number;
  metadata?: Record<string, any>;
}

// 标签页协调器类
class TabCoordinator {
  private currentTab: TabInfo | null = null;
  private registeredTabs: Map<string, TabInfo> = new Map();
  private taskAssignments: Map<TaskType, TaskAssignment> = new Map();
  private resourceRequests: Map<string, ResourceRequest> = new Map();
  private activeResources: Map<ResourceType, string> = new Map(); // 资源类型 -> 持有者标签页ID

  private channel: BroadcastChannel | null = null;
  private channelName: string;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private coordinationInterval: NodeJS.Timeout | null = null;

  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor(channelName: string = "tab_coordinator") {
    this.channelName = channelName;
    this.init();
  }

  // 初始化协调器
  private init(): void {
    this.currentTab = this.createTabInfo();
    this.setupBroadcastChannel();
    this.startHeartbeat();
    this.startCoordination();
    this.registerEventListeners();

    // 注册当前标签页
    this.registerTab();
  }

  // 创建标签页信息
  private createTabInfo(): TabInfo {
    return {
      id: this.generateTabId(),
      url: window.location.href,
      title: document.title,
      isActive: document.hasFocus(),
      isMaster: false,
      isVisible: document.visibilityState === "visible",
      createdAt: Date.now(),
      lastActivity: Date.now(),
      userAgent: navigator.userAgent,
      capabilities: this.detectTabCapabilities(),
    };
  }

  // 生成标签页ID
  private generateTabId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `tab_${timestamp}_${random}`;
  }

  // 检测标签页能力
  private detectTabCapabilities(): TabCapabilities {
    return {
      canFocus: "focus" in window,
      canNotify:
        "Notification" in window && Notification.permission === "granted",
      canStore: "localStorage" in window && "sessionStorage" in window,
      canNetwork: "fetch" in window,
      canWorker: "Worker" in window,
      canAudio: "AudioContext" in window || "webkitAudioContext" in window,
      canVideo:
        "MediaDevices" in window && "getUserMedia" in navigator.mediaDevices,
      hasPermissions: this.getGrantedPermissions(),
    };
  }

  // 获取已授权的权限
  private getGrantedPermissions(): string[] {
    const permissions = [];

    if ("permissions" in navigator) {
      // 注意：permissions.query是异步的，这里只能获取部分信息
      if (Notification.permission === "granted")
        permissions.push("notifications");
      if ("geolocation" in navigator) permissions.push("geolocation");
    }

    return permissions;
  }

  // 设置广播通道
  private setupBroadcastChannel(): void {
    this.channel = new BroadcastChannel(this.channelName);
    this.channel.addEventListener(
      "message",
      this.handleChannelMessage.bind(this)
    );
  }

  // 处理频道消息
  private handleChannelMessage(event: MessageEvent): void {
    const { type, data, senderId, timestamp } = event.data;

    // 忽略自己发送的消息
    if (senderId === this.currentTab?.id) return;

    switch (type) {
      case MessageType.TAB_REGISTER:
        this.handleTabRegister(data);
        break;
      case MessageType.TAB_UPDATE:
        this.handleTabUpdate(data);
        break;
      case MessageType.TAB_UNREGISTER:
        this.handleTabUnregister(data);
        break;
      case MessageType.MASTER_ELECTION:
        this.handleMasterElection(data);
        break;
      case MessageType.TASK_ASSIGNMENT:
        this.handleTaskAssignment(data);
        break;
      case MessageType.TASK_RESULT:
        this.handleTaskResult(data);
        break;
      case MessageType.RESOURCE_REQUEST:
        this.handleResourceRequest(data);
        break;
      case MessageType.RESOURCE_RESPONSE:
        this.handleResourceResponse(data);
        break;
      case MessageType.COORDINATION_UPDATE:
        this.handleCoordinationUpdate(data);
        break;
    }

    // 触发事件监听器
    this.emitEvent(type, data);
  }

  // 注册标签页
  registerTab(): void {
    if (!this.currentTab) return;

    this.registeredTabs.set(this.currentTab.id, this.currentTab);

    this.broadcastMessage(MessageType.TAB_REGISTER, this.currentTab);

    // 延迟启动主标签页选举
    setTimeout(() => this.electMasterTab(), 1000);
  }

  // 处理标签页注册
  private handleTabRegister(tabInfo: TabInfo): void {
    this.registeredTabs.set(tabInfo.id, tabInfo);

    // 如果没有主标签页，启动选举
    if (!this.getMasterTab()) {
      setTimeout(() => this.electMasterTab(), 500);
    }

    // 记录标签页注册
    recordUserExperience(UXQuality.GOOD, "tab_coordination", {
      interactionType: "tab_registered",
      connectionStatus: `${this.registeredTabs.size}_tabs`,
    });
  }

  // 处理标签页更新
  private handleTabUpdate(tabInfo: TabInfo): void {
    this.registeredTabs.set(tabInfo.id, tabInfo);
  }

  // 处理标签页注销
  private handleTabUnregister(data: { tabId: string }): void {
    const tab = this.registeredTabs.get(data.tabId);
    this.registeredTabs.delete(data.tabId);

    // 如果关闭的是主标签页，重新选举
    if (tab?.isMaster) {
      setTimeout(() => this.electMasterTab(), 500);
    }

    // 重新分配该标签页的任务
    this.redistributeTasks(data.tabId);

    // 释放该标签页持有的资源
    this.releaseTabResources(data.tabId);
  }

  // 主标签页选举
  electMasterTab(): void {
    const tabs = Array.from(this.registeredTabs.values());
    if (tabs.length === 0) return;

    // 计算每个标签页的评分
    const scoredTabs = tabs.map((tab) => ({
      tab,
      score: this.calculateTabScore(tab),
    }));

    // 选择评分最高的标签页
    scoredTabs.sort((a, b) => b.score - a.score);
    const newMaster = scoredTabs[0].tab;

    // 更新所有标签页的主标签页状态
    for (const tab of tabs) {
      tab.isMaster = tab.id === newMaster.id;
      this.registeredTabs.set(tab.id, tab);
    }

    // 如果当前标签页是新主标签页
    if (this.currentTab && newMaster.id === this.currentTab.id) {
      this.currentTab.isMaster = true;

      // 重新分配任务
      this.assignTasks();

      recordUserExperience(UXQuality.GOOD, "tab_coordination", {
        interactionType: "master_elected",
        connectionStatus: "master",
      });
    } else if (this.currentTab) {
      this.currentTab.isMaster = false;
    }

    // 广播选举结果
    this.broadcastMessage(MessageType.MASTER_ELECTION, {
      masterId: newMaster.id,
      tabs: Array.from(this.registeredTabs.values()),
    });
  }

  // 计算标签页评分
  private calculateTabScore(tab: TabInfo): number {
    let score = 0;

    // 可见性评分
    if (tab.isVisible) score += 20;
    if (tab.isActive) score += 15;

    // 能力评分
    const capabilities = tab.capabilities;
    if (capabilities.canNotify) score += 10;
    if (capabilities.canWorker) score += 10;
    if (capabilities.canStore) score += 5;
    if (capabilities.canNetwork) score += 5;

    // 创建时间评分（较新的标签页得分高）
    const age = Date.now() - tab.createdAt;
    score += Math.max(0, 20 - age / 60000); // 1分钟内创建的标签页得满分

    // 活跃度评分
    const timeSinceActivity = Date.now() - tab.lastActivity;
    if (timeSinceActivity < 5000) score += 10; // 5秒内有活动
    else if (timeSinceActivity < 30000) score += 5; // 30秒内有活动

    return score;
  }

  // 任务分配
  assignTasks(): void {
    if (!this.currentTab?.isMaster) return;

    const tabs = Array.from(this.registeredTabs.values());
    const activeTabs = tabs.filter(
      (tab) => tab.isVisible && tab.lastActivity > Date.now() - 30000
    );

    // 定义任务配置
    const taskConfigs = [
      {
        type: TaskType.POLLING,
        priority: 1,
        interval: 5000,
        requiresVisible: false,
      },
      {
        type: TaskType.NOTIFICATION,
        priority: 2,
        interval: 0,
        requiresVisible: true,
      },
      {
        type: TaskType.STORAGE,
        priority: 3,
        interval: 10000,
        requiresVisible: false,
      },
      {
        type: TaskType.NETWORK,
        priority: 1,
        interval: 0,
        requiresVisible: false,
      },
      {
        type: TaskType.ANALYTICS,
        priority: 4,
        interval: 30000,
        requiresVisible: false,
      },
      {
        type: TaskType.CLEANUP,
        priority: 5,
        interval: 60000,
        requiresVisible: false,
      },
      {
        type: TaskType.BACKGROUND,
        priority: 6,
        interval: 0,
        requiresVisible: false,
      },
    ];

    // 为每个任务分配最合适的标签页
    for (const config of taskConfigs) {
      const suitableTabs = (config.requiresVisible ? activeTabs : tabs)
        .filter((tab) => this.isTabSuitableForTask(tab, config.type))
        .sort((a, b) => this.calculateTabScore(b) - this.calculateTabScore(a));

      if (suitableTabs.length > 0) {
        const assignment: TaskAssignment = {
          taskType: config.type,
          assignedTo: suitableTabs[0].id,
          priority: config.priority,
          interval: config.interval,
          lastExecution: 0,
        };

        this.taskAssignments.set(config.type, assignment);

        // 广播任务分配
        this.broadcastMessage(MessageType.TASK_ASSIGNMENT, assignment);
      }
    }
  }

  // 检查标签页是否适合执行任务
  private isTabSuitableForTask(tab: TabInfo, taskType: TaskType): boolean {
    const capabilities = tab.capabilities;

    switch (taskType) {
      case TaskType.POLLING:
        return capabilities.canNetwork && tab.isVisible;
      case TaskType.NOTIFICATION:
        return capabilities.canNotify && tab.isActive;
      case TaskType.STORAGE:
        return capabilities.canStore;
      case TaskType.NETWORK:
        return capabilities.canNetwork;
      case TaskType.ANALYTICS:
        return capabilities.canStore && capabilities.canNetwork;
      case TaskType.CLEANUP:
        return capabilities.canStore;
      case TaskType.BACKGROUND:
        return capabilities.canWorker;
      default:
        return true;
    }
  }

  // 处理任务分配
  private handleTaskAssignment(assignment: TaskAssignment): void {
    if (assignment.assignedTo !== this.currentTab?.id) return;

    // 执行分配的任务
    this.executeTask(assignment);
  }

  // 执行任务
  private executeTask(assignment: TaskAssignment): void {
    const now = Date.now();

    // 检查是否需要执行
    if (assignment.interval && assignment.lastExecution) {
      const timeSinceLastExecution = now - assignment.lastExecution;
      if (timeSinceLastExecution < assignment.interval) {
        return; // 还没到执行时间
      }
    }

    assignment.lastExecution = now;

    // 根据任务类型执行相应逻辑
    switch (assignment.taskType) {
      case TaskType.POLLING:
        this.executePollingTask();
        break;
      case TaskType.NOTIFICATION:
        this.executeNotificationTask();
        break;
      case TaskType.STORAGE:
        this.executeStorageTask();
        break;
      case TaskType.ANALYTICS:
        this.executeAnalyticsTask();
        break;
      case TaskType.CLEANUP:
        this.executeCleanupTask();
        break;
      case TaskType.BACKGROUND:
        this.executeBackgroundTask();
        break;
    }

    // 报告任务结果
    this.broadcastMessage(MessageType.TASK_RESULT, {
      taskType: assignment.taskType,
      executedBy: this.currentTab?.id,
      timestamp: now,
      success: true,
    });
  }

  // 执行轮询任务
  private executePollingTask(): void {
    // 触发轮询事件
    this.emitEvent("polling_tick", { timestamp: Date.now() });
  }

  // 执行通知任务
  private executeNotificationTask(): void {
    // 检查是否有待发送的通知
    this.emitEvent("notification_check", { timestamp: Date.now() });
  }

  // 执行存储任务
  private executeStorageTask(): void {
    // 清理过期的存储数据
    const expiredKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if ((key && key.startsWith("temp_")) || key?.includes("_expired_")) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => localStorage.removeItem(key));
  }

  // 执行分析任务
  private executeAnalyticsTask(): void {
    // 发送分析数据
    this.emitEvent("analytics_report", {
      timestamp: Date.now(),
      tabCount: this.registeredTabs.size,
    });
  }

  // 执行清理任务
  private executeCleanupTask(): void {
    // 清理无效的标签页注册
    const now = Date.now();
    const staleThreshold = 60000; // 1分钟无活动

    const staleTabs = Array.from(this.registeredTabs.entries())
      .filter(([_, tab]) => now - tab.lastActivity > staleThreshold)
      .map(([id]) => id);

    staleTabs.forEach((tabId) => {
      this.registeredTabs.delete(tabId);
      this.releaseTabResources(tabId);
    });
  }

  // 执行后台任务
  private executeBackgroundTask(): void {
    // 执行不影响用户体验的后台任务
    this.emitEvent("background_task", { timestamp: Date.now() });
  }

  // 重新分配任务
  private redistributeTasks(departedTabId: string): void {
    if (!this.currentTab?.isMaster) return;

    // 找到需要重新分配的任务
    const tasksToReassign = Array.from(this.taskAssignments.values()).filter(
      (assignment) => assignment.assignedTo === departedTabId
    );

    if (tasksToReassign.length > 0) {
      // 重新分配任务
      this.assignTasks();
    }
  }

  // 释放标签页资源
  private releaseTabResources(tabId: string): void {
    // 释放该标签页持有的所有资源
    for (const [resourceType, holderId] of this.activeResources.entries()) {
      if (holderId === tabId) {
        this.activeResources.delete(resourceType);

        // 广播资源释放
        this.broadcastMessage(MessageType.RESOURCE_RESPONSE, {
          type: resourceType,
          granted: false,
          releasedBy: tabId,
        });
      }
    }
  }

  // 请求资源
  requestResource(
    type: ResourceType,
    priority: number = 1,
    duration?: number
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const requestId = `req_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const request: ResourceRequest = {
        id: requestId,
        type,
        requesterTabId: this.currentTab?.id || "",
        priority,
        duration,
      };

      this.resourceRequests.set(requestId, request);

      // 检查资源是否可用
      if (!this.activeResources.has(type)) {
        // 资源可用，立即分配
        this.activeResources.set(type, request.requesterTabId);
        resolve(true);
      } else {
        // 资源被占用，广播请求
        this.broadcastMessage(MessageType.RESOURCE_REQUEST, request);

        // 设置超时
        setTimeout(() => {
          this.resourceRequests.delete(requestId);
          resolve(false);
        }, 5000);
      }
    });
  }

  // 处理资源请求
  private handleResourceRequest(request: ResourceRequest): void {
    // 如果当前标签页持有资源，考虑是否释放
    const currentHolder = this.activeResources.get(request.type);

    if (currentHolder === this.currentTab?.id) {
      // 比较优先级，决定是否释放
      const shouldRelease = this.shouldReleaseResource(request);

      if (shouldRelease) {
        this.activeResources.delete(request.type);

        // 广播资源释放
        this.broadcastMessage(MessageType.RESOURCE_RESPONSE, {
          requestId: request.id,
          type: request.type,
          granted: true,
          grantedTo: request.requesterTabId,
        });
      }
    }
  }

  // 判断是否应该释放资源
  private shouldReleaseResource(request: ResourceRequest): boolean {
    // 简单的优先级比较策略
    return request.priority > 1 && !this.currentTab?.isVisible;
  }

  // 处理资源响应
  private handleResourceResponse(response: any): void {
    const request = this.resourceRequests.get(response.requestId);

    if (request && request.requesterTabId === this.currentTab?.id) {
      if (response.granted) {
        this.activeResources.set(response.type, this.currentTab.id);
      }

      this.resourceRequests.delete(response.requestId);
    }
  }

  // 获取主标签页
  getMasterTab(): TabInfo | null {
    return (
      Array.from(this.registeredTabs.values()).find((tab) => tab.isMaster) ||
      null
    );
  }

  // 获取协调状态
  getCoordinationStatus(): CoordinationStatus {
    const activeTabs = Array.from(this.registeredTabs.values()).filter(
      (tab) => tab.isVisible && Date.now() - tab.lastActivity < 30000
    );

    return {
      totalTabs: this.registeredTabs.size,
      activeTabs: activeTabs.length,
      masterTabId: this.getMasterTab()?.id || null,
      taskAssignments: Array.from(this.taskAssignments.values()),
      resourceUsage: {
        networkRequests: 0, // 这需要从实际使用中统计
        storageOperations: 0,
        backgroundTasks: 0,
      },
      lastCoordination: Date.now(),
    };
  }

  // 广播消息
  private broadcastMessage(type: MessageType, data: any): void {
    if (this.channel && this.currentTab) {
      this.channel.postMessage({
        type,
        data,
        senderId: this.currentTab.id,
        timestamp: Date.now(),
      });
    }
  }

  // 开始心跳
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.currentTab) {
        this.currentTab.lastActivity = Date.now();
        this.currentTab.isActive = document.hasFocus();
        this.currentTab.isVisible = document.visibilityState === "visible";

        this.broadcastMessage(MessageType.TAB_UPDATE, this.currentTab);
      }
    }, 5000);
  }

  // 开始协调
  private startCoordination(): void {
    this.coordinationInterval = setInterval(() => {
      if (this.currentTab?.isMaster) {
        // 主标签页负责协调任务
        this.executeCoordinationTasks();
      }
    }, 10000);
  }

  // 执行协调任务
  private executeCoordinationTasks(): void {
    // 检查任务分配是否需要调整
    const shouldReassign = this.shouldReassignTasks();
    if (shouldReassign) {
      this.assignTasks();
    }

    // 广播协调更新
    this.broadcastMessage(
      MessageType.COORDINATION_UPDATE,
      this.getCoordinationStatus()
    );
  }

  // 检查是否需要重新分配任务
  private shouldReassignTasks(): boolean {
    const activeTabs = Array.from(this.registeredTabs.values()).filter(
      (tab) => tab.isVisible
    );

    // 如果活跃标签页数量发生变化，重新分配
    return activeTabs.length !== this.taskAssignments.size;
  }

  // 处理协调更新
  private handleCoordinationUpdate(status: CoordinationStatus): void {
    // 更新本地状态
    this.emitEvent("coordination_update", status);
  }

  // 注册事件监听器
  private registerEventListeners(): void {
    // 页面可见性变化
    document.addEventListener("visibilitychange", () => {
      if (this.currentTab) {
        this.currentTab.isVisible = document.visibilityState === "visible";
        this.currentTab.lastActivity = Date.now();
      }
    });

    // 页面焦点变化
    window.addEventListener("focus", () => {
      if (this.currentTab) {
        this.currentTab.isActive = true;
        this.currentTab.lastActivity = Date.now();
      }
    });

    window.addEventListener("blur", () => {
      if (this.currentTab) {
        this.currentTab.isActive = false;
      }
    });

    // 页面卸载
    window.addEventListener("beforeunload", () => {
      this.unregisterTab();
    });
  }

  // 注销标签页
  unregisterTab(): void {
    if (this.currentTab) {
      this.broadcastMessage(MessageType.TAB_UNREGISTER, {
        tabId: this.currentTab.id,
      });
    }
  }

  // 事件系统
  addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  removeEventListener(event: string, callback: Function): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emitEvent(event: string, data: any): void {
    this.eventListeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`事件监听器执行失败 [${event}]:`, error);
      }
    });
  }

  // 销毁协调器
  destroy(): void {
    this.unregisterTab();

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.coordinationInterval) {
      clearInterval(this.coordinationInterval);
    }

    if (this.channel) {
      this.channel.close();
    }

    this.eventListeners.clear();
    this.registeredTabs.clear();
    this.taskAssignments.clear();
    this.resourceRequests.clear();
    this.activeResources.clear();
  }
}

// 导出便利函数和单例实例
let globalCoordinator: TabCoordinator | null = null;

export function getTabCoordinator(channelName?: string): TabCoordinator {
  if (!globalCoordinator) {
    globalCoordinator = new TabCoordinator(channelName);
  }
  return globalCoordinator;
}

export function createTabCoordinator(channelName?: string): TabCoordinator {
  return new TabCoordinator(channelName);
}

// 导出类型和枚举
export type {
  TabInfo,
  TabCapabilities,
  TaskAssignment,
  CoordinationStatus,
  ResourceRequest,
};
export { TaskType, MessageType, ResourceType };
export default TabCoordinator;
