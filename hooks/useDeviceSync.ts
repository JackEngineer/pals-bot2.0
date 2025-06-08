"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { recordUserExperience, UXQuality } from "@/lib/analytics";

/**
 * 设备同步机制
 * 实现多设备间的状态同步和协调
 */

// 设备信息接口
export interface DeviceInfo {
  id: string;
  name: string;
  type: "desktop" | "mobile" | "tablet";
  userAgent: string;
  screenSize: string;
  lastSeen: number;
  isActive: boolean;
  isMaster: boolean;
  syncVersion: number;
  capabilities: DeviceCapabilities;
}

// 设备能力
export interface DeviceCapabilities {
  hasNotifications: boolean;
  hasVibration: boolean;
  hasGeolocation: boolean;
  hasCamera: boolean;
  hasMicrophone: boolean;
  hasLocalStorage: boolean;
  hasIndexedDB: boolean;
  hasWebSocket: boolean;
  hasServiceWorker: boolean;
}

// 同步数据接口
export interface SyncData {
  timestamp: number;
  version: number;
  source: string;
  type: string;
  payload: any;
  checksum: string;
}

// 冲突解决策略
export enum ConflictResolution {
  LATEST_WINS = "latest_wins", // 最新的获胜
  MASTER_WINS = "master_wins", // 主设备获胜
  USER_CHOICE = "user_choice", // 用户选择
  MERGE = "merge", // 合并
  IGNORE = "ignore", // 忽略
}

// 同步状态
export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: number | null;
  syncError: string | null;
  pendingOperations: number;
  conflictsResolved: number;
  devicesConnected: number;
}

// 设备同步钩子
export function useDeviceSync(userId?: string) {
  // 状态管理
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<DeviceInfo[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSync: null,
    syncError: null,
    pendingOperations: 0,
    conflictsResolved: 0,
    devicesConnected: 0,
  });

  // 存储键
  const storageKeys = {
    deviceInfo: `device_info_${userId || "anonymous"}`,
    devices: `connected_devices_${userId || "anonymous"}`,
    syncData: `sync_data_${userId || "anonymous"}`,
    masterElection: `master_election_${userId || "anonymous"}`,
  };

  // 定时器和通道引用
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const electionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const syncChannelRef = useRef<BroadcastChannel | null>(null);
  const pendingOperationsRef = useRef<Map<string, SyncData>>(new Map());

  // 生成设备唯一标识
  const generateDeviceId = useCallback((): string => {
    // 尝试从localStorage获取已存在的设备ID
    const existingId = localStorage.getItem("device_id");
    if (existingId) return existingId;

    // 基于设备特征生成唯一ID
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx?.fillText("Device fingerprint", 10, 10);
    const canvasFingerprint = canvas.toDataURL();

    const deviceFingerprint = [
      navigator.userAgent,
      navigator.language,
      navigator.platform,
      screen.width + "x" + screen.height,
      new Date().getTimezoneOffset(),
      canvasFingerprint.slice(-50), // 取canvas指纹的后50个字符
    ].join("|");

    const deviceId = btoa(deviceFingerprint).replace(/[+/=]/g, "").slice(0, 16);
    localStorage.setItem("device_id", deviceId);
    return deviceId;
  }, []);

  // 检测设备能力
  const detectDeviceCapabilities = useCallback((): DeviceCapabilities => {
    return {
      hasNotifications: "Notification" in window,
      hasVibration: "vibrate" in navigator,
      hasGeolocation: "geolocation" in navigator,
      hasCamera:
        "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices,
      hasMicrophone:
        "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices,
      hasLocalStorage: "localStorage" in window,
      hasIndexedDB: "indexedDB" in window,
      hasWebSocket: "WebSocket" in window,
      hasServiceWorker: "serviceWorker" in navigator,
    };
  }, []);

  // 获取设备类型
  const getDeviceType = useCallback((): "desktop" | "mobile" | "tablet" => {
    const userAgent = navigator.userAgent;

    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return "tablet";
    }

    if (
      /mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(
        userAgent
      )
    ) {
      return "mobile";
    }

    return "desktop";
  }, []);

  // 获取设备名称
  const getDeviceName = useCallback((): string => {
    const type = getDeviceType();
    const platform = navigator.platform;
    const userAgent = navigator.userAgent;

    // 尝试识别具体设备
    if (/iPhone/i.test(userAgent)) return "iPhone";
    if (/iPad/i.test(userAgent)) return "iPad";
    if (/Android/i.test(userAgent)) {
      const match = userAgent.match(/Android.*?([A-Z][A-Z0-9\s]+)/);
      return match ? match[1].trim() : "Android Device";
    }
    if (/Windows/i.test(platform)) return "Windows PC";
    if (/Mac/i.test(platform)) return "Mac";
    if (/Linux/i.test(platform)) return "Linux PC";

    return type.charAt(0).toUpperCase() + type.slice(1);
  }, [getDeviceType]);

  // 创建设备信息
  const createDeviceInfo = useCallback((): DeviceInfo => {
    return {
      id: generateDeviceId(),
      name: getDeviceName(),
      type: getDeviceType(),
      userAgent: navigator.userAgent,
      screenSize: `${screen.width}x${screen.height}`,
      lastSeen: Date.now(),
      isActive: true,
      isMaster: false,
      syncVersion: 1,
      capabilities: detectDeviceCapabilities(),
    };
  }, [
    generateDeviceId,
    getDeviceName,
    getDeviceType,
    detectDeviceCapabilities,
  ]);

  // 计算设备评分（用于主设备选举）
  const calculateDeviceScore = useCallback((device: DeviceInfo): number => {
    let score = 0;

    // 设备类型评分
    if (device.type === "desktop") score += 30;
    else if (device.type === "tablet") score += 20;
    else score += 10;

    // 屏幕大小评分
    const [width, height] = device.screenSize.split("x").map(Number);
    score += Math.min((width * height) / 100000, 20);

    // 能力评分
    const capabilities = device.capabilities;
    if (capabilities.hasNotifications) score += 5;
    if (capabilities.hasServiceWorker) score += 5;
    if (capabilities.hasWebSocket) score += 5;
    if (capabilities.hasIndexedDB) score += 5;

    // 活跃度评分
    const timeSinceLastSeen = Date.now() - device.lastSeen;
    if (timeSinceLastSeen < 5000) score += 10; // 5秒内活跃
    else if (timeSinceLastSeen < 30000) score += 5; // 30秒内活跃

    return score;
  }, []);

  // 主设备选举
  const electMasterDevice = useCallback(() => {
    const allDevices = [deviceInfo, ...connectedDevices].filter(
      (d): d is DeviceInfo => d !== null
    );

    if (allDevices.length === 0) return;

    // 计算每个设备的评分
    const scoredDevices = allDevices.map((device) => ({
      device,
      score: calculateDeviceScore(device),
    }));

    // 选择评分最高的设备作为主设备
    scoredDevices.sort((a, b) => b.score - a.score);
    const newMaster = scoredDevices[0].device;

    // 更新所有设备的主设备状态
    const updatedDevices = allDevices.map((device) => ({
      ...device,
      isMaster: device.id === newMaster.id,
    }));

    // 如果当前设备是新选出的主设备
    if (deviceInfo && newMaster.id === deviceInfo.id) {
      setDeviceInfo((prev) => (prev ? { ...prev, isMaster: true } : null));

      // 记录主设备选举
      recordUserExperience(UXQuality.GOOD, "device_sync", {
        interactionType: "master_elected",
        connectionStatus: "master",
      });
    } else if (deviceInfo) {
      setDeviceInfo((prev) => (prev ? { ...prev, isMaster: false } : null));
    }

    // 更新连接的设备列表
    setConnectedDevices(updatedDevices.filter((d) => d.id !== deviceInfo?.id));

    // 广播选举结果
    broadcastMessage({
      type: "master_elected",
      masterId: newMaster.id,
      devices: updatedDevices,
    });
  }, [deviceInfo, connectedDevices, calculateDeviceScore]);

  // 广播消息
  const broadcastMessage = useCallback(
    (message: any) => {
      if (syncChannelRef.current) {
        try {
          syncChannelRef.current.postMessage({
            ...message,
            timestamp: Date.now(),
            sourceDeviceId: deviceInfo?.id,
          });
        } catch (error) {
          console.error("广播消息失败:", error);
        }
      }
    },
    [deviceInfo?.id]
  );

  // 处理同步冲突
  const resolveConflict = useCallback(
    (
      localData: SyncData,
      remoteData: SyncData,
      strategy: ConflictResolution = ConflictResolution.LATEST_WINS
    ): SyncData => {
      switch (strategy) {
        case ConflictResolution.LATEST_WINS:
          return localData.timestamp > remoteData.timestamp
            ? localData
            : remoteData;

        case ConflictResolution.MASTER_WINS:
          const localIsMaster = deviceInfo?.isMaster;
          return localIsMaster ? localData : remoteData;

        case ConflictResolution.MERGE:
          // 简单的合并策略，实际应用中可能需要更复杂的逻辑
          return {
            ...remoteData,
            payload: { ...localData.payload, ...remoteData.payload },
            timestamp: Math.max(localData.timestamp, remoteData.timestamp),
            version: Math.max(localData.version, remoteData.version),
          };

        case ConflictResolution.IGNORE:
          return localData;

        default:
          return localData;
      }
    },
    [deviceInfo?.isMaster]
  );

  // 同步数据
  const syncData = useCallback(
    async (
      type: string,
      payload: any,
      conflictStrategy: ConflictResolution = ConflictResolution.LATEST_WINS
    ): Promise<boolean> => {
      if (!deviceInfo) return false;

      setSyncStatus((prev) => ({ ...prev, isSyncing: true, syncError: null }));

      try {
        const syncData: SyncData = {
          timestamp: Date.now(),
          version: deviceInfo.syncVersion + 1,
          source: deviceInfo.id,
          type,
          payload,
          checksum: generateChecksum(payload),
        };

        // 检查是否有冲突
        const existingData = localStorage.getItem(
          `${storageKeys.syncData}_${type}`
        );
        if (existingData) {
          const parsed: SyncData = JSON.parse(existingData);
          if (parsed.version >= syncData.version) {
            // 发生冲突，需要解决
            const resolvedData = resolveConflict(
              syncData,
              parsed,
              conflictStrategy
            );

            // 更新解决冲突的计数
            setSyncStatus((prev) => ({
              ...prev,
              conflictsResolved: prev.conflictsResolved + 1,
            }));

            // 使用解决后的数据
            Object.assign(syncData, resolvedData);
          }
        }

        // 存储到本地
        localStorage.setItem(
          `${storageKeys.syncData}_${type}`,
          JSON.stringify(syncData)
        );

        // 广播同步数据
        broadcastMessage({
          type: "sync_data",
          syncData,
        });

        // 更新设备同步版本
        setDeviceInfo((prev) =>
          prev
            ? {
                ...prev,
                syncVersion: syncData.version,
                lastSeen: Date.now(),
              }
            : null
        );

        setSyncStatus((prev) => ({
          ...prev,
          isSyncing: false,
          lastSync: Date.now(),
          pendingOperations: prev.pendingOperations - 1,
        }));

        return true;
      } catch (error) {
        console.error("数据同步失败:", error);
        setSyncStatus((prev) => ({
          ...prev,
          isSyncing: false,
          syncError: error instanceof Error ? error.message : "同步失败",
        }));
        return false;
      }
    },
    [deviceInfo, storageKeys.syncData, resolveConflict, broadcastMessage]
  );

  // 生成校验和
  const generateChecksum = useCallback((data: any): string => {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(16);
  }, []);

  // 处理接收到的消息
  const handleBroadcastMessage = useCallback(
    (event: MessageEvent) => {
      const { type, timestamp, sourceDeviceId, ...data } = event.data;

      // 忽略自己发送的消息
      if (sourceDeviceId === deviceInfo?.id) return;

      switch (type) {
        case "device_heartbeat":
          // 更新设备列表
          const { device } = data;
          setConnectedDevices((prev) => {
            const existingIndex = prev.findIndex((d) => d.id === device.id);
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = device;
              return updated;
            } else {
              return [...prev, device];
            }
          });
          break;

        case "device_disconnected":
          const { deviceId } = data;
          setConnectedDevices((prev) => prev.filter((d) => d.id !== deviceId));

          // 如果断开的是主设备，重新选举
          const disconnectedDevice = connectedDevices.find(
            (d) => d.id === deviceId
          );
          if (disconnectedDevice?.isMaster) {
            setTimeout(electMasterDevice, 1000); // 延迟1秒重新选举
          }
          break;

        case "sync_data":
          // 处理同步数据
          const { syncData: receivedData } = data;
          const existingDataKey = `${storageKeys.syncData}_${receivedData.type}`;
          const existingData = localStorage.getItem(existingDataKey);

          if (
            !existingData ||
            JSON.parse(existingData).version < receivedData.version
          ) {
            localStorage.setItem(existingDataKey, JSON.stringify(receivedData));

            // 触发同步事件
            window.dispatchEvent(
              new CustomEvent("deviceSyncUpdate", {
                detail: { type: receivedData.type, data: receivedData.payload },
              })
            );
          }
          break;

        case "master_elected":
          const { masterId, devices } = data;
          setConnectedDevices(
            devices.filter((d: DeviceInfo) => d.id !== deviceInfo?.id)
          );

          if (deviceInfo && masterId === deviceInfo.id) {
            setDeviceInfo((prev) =>
              prev ? { ...prev, isMaster: true } : null
            );
          } else if (deviceInfo) {
            setDeviceInfo((prev) =>
              prev ? { ...prev, isMaster: false } : null
            );
          }
          break;
      }
    },
    [deviceInfo, connectedDevices, storageKeys.syncData, electMasterDevice]
  );

  // 发送心跳
  const sendHeartbeat = useCallback(() => {
    if (!deviceInfo) return;

    const updatedDevice = {
      ...deviceInfo,
      lastSeen: Date.now(),
      isActive: document.visibilityState === "visible",
    };

    setDeviceInfo(updatedDevice);

    // 存储到本地
    localStorage.setItem(storageKeys.deviceInfo, JSON.stringify(updatedDevice));

    // 广播心跳
    broadcastMessage({
      type: "device_heartbeat",
      device: updatedDevice,
    });
  }, [deviceInfo, storageKeys.deviceInfo, broadcastMessage]);

  // 清理离线设备
  const cleanupOfflineDevices = useCallback(() => {
    const now = Date.now();
    const offlineThreshold = 30000; // 30秒没有心跳就认为离线

    setConnectedDevices((prev) => {
      const onlineDevices = prev.filter((device) => {
        const isOnline = now - device.lastSeen < offlineThreshold;

        // 如果设备离线，广播断开消息
        if (!isOnline) {
          broadcastMessage({
            type: "device_disconnected",
            deviceId: device.id,
          });
        }

        return isOnline;
      });

      // 更新同步状态
      setSyncStatus((prevStatus) => ({
        ...prevStatus,
        devicesConnected: onlineDevices.length,
      }));

      return onlineDevices;
    });
  }, [broadcastMessage]);

  // 获取同步数据
  const getSyncedData = useCallback(
    (type: string): any => {
      const data = localStorage.getItem(`${storageKeys.syncData}_${type}`);
      if (data) {
        const parsed: SyncData = JSON.parse(data);
        return parsed.payload;
      }
      return null;
    },
    [storageKeys.syncData]
  );

  // 初始化设备同步
  useEffect(() => {
    // 创建设备信息
    const device = createDeviceInfo();
    setDeviceInfo(device);

    // 设置BroadcastChannel
    const channelName = `device_sync_${userId || "anonymous"}`;
    syncChannelRef.current = new BroadcastChannel(channelName);
    syncChannelRef.current.addEventListener("message", handleBroadcastMessage);

    // 启动心跳定时器
    heartbeatTimerRef.current = setInterval(sendHeartbeat, 5000);

    // 启动清理定时器
    const cleanupTimer = setInterval(cleanupOfflineDevices, 10000);

    // 延迟启动主设备选举
    electionTimerRef.current = setTimeout(electMasterDevice, 2000);

    // 监听页面可见性变化
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeat();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 监听在线状态变化
    const handleOnlineStatusChange = () => {
      setSyncStatus((prev) => ({ ...prev, isOnline: navigator.onLine }));
      if (navigator.onLine) {
        sendHeartbeat();
        electMasterDevice();
      }
    };
    window.addEventListener("online", handleOnlineStatusChange);
    window.addEventListener("offline", handleOnlineStatusChange);

    return () => {
      // 清理资源
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      if (electionTimerRef.current) clearTimeout(electionTimerRef.current);
      clearInterval(cleanupTimer);

      if (syncChannelRef.current) {
        // 广播设备断开消息
        syncChannelRef.current.postMessage({
          type: "device_disconnected",
          deviceId: device.id,
          timestamp: Date.now(),
          sourceDeviceId: device.id,
        });

        syncChannelRef.current.removeEventListener(
          "message",
          handleBroadcastMessage
        );
        syncChannelRef.current.close();
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnlineStatusChange);
      window.removeEventListener("offline", handleOnlineStatusChange);
    };
  }, [
    userId,
    createDeviceInfo,
    handleBroadcastMessage,
    sendHeartbeat,
    cleanupOfflineDevices,
    electMasterDevice,
  ]);

  return {
    // 设备信息
    deviceInfo,
    connectedDevices,
    syncStatus,

    // 同步方法
    syncData,
    getSyncedData,

    // 设备管理
    electMasterDevice,

    // 实用方法
    generateChecksum,
    calculateDeviceScore,

    // 冲突解决
    resolveConflict,
  };
}
