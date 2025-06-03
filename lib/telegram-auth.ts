import CryptoJS from "crypto-js";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface TelegramInitData {
  user?: TelegramUser;
  chat_instance?: string;
  chat_type?: string;
  auth_date: number;
  hash: string;
  start_param?: string;
  query_id?: string;
  [key: string]: any;
}

/**
 * 验证 Telegram InitData 的真实性
 * @param initData - 从 Telegram WebApp 获取的初始化数据字符串
 * @param botToken - Telegram Bot Token
 * @returns 验证结果和解析后的数据
 */
export function validateTelegramInitData(
  initData: string,
  botToken: string
): { isValid: boolean; data?: TelegramInitData; error?: string; debug?: any } {
  try {
    if (!initData || !botToken) {
      return { isValid: false, error: "缺少必要参数" };
    }

    // 解析 URL 编码的数据
    const urlParams = new URLSearchParams(initData);
    const data: Record<string, any> = {};

    // 使用 Array.from 来兼容不同环境
    Array.from(urlParams.entries()).forEach(([key, value]) => {
      if (key === "user") {
        try {
          data[key] = JSON.parse(value);
        } catch {
          data[key] = value;
        }
      } else {
        data[key] = value;
      }
    });

    // 提取 hash
    const hash = data.hash;
    if (!hash) {
      return { isValid: false, error: "缺少hash参数" };
    }

    // 移除 hash 参数
    delete data.hash;

    // 按键名排序并构建检查字符串
    const dataCheckString = Object.keys(data)
      .sort()
      .map((key) => {
        const value =
          typeof data[key] === "object" ? JSON.stringify(data[key]) : data[key];
        return `${key}=${value}`;
      })
      .join("\n");

    // 根据 Telegram 官方文档：
    // 1. secret_key = HMAC-SHA256(bot_token, "WebAppData")
    // 2. hash = HMAC-SHA256(data_check_string, secret_key)
    const secretKey = CryptoJS.HmacSHA256(botToken, "WebAppData");

    // 计算期望的 hash
    const expectedHash = CryptoJS.HmacSHA256(
      dataCheckString,
      secretKey
    ).toString();

    // 调试信息
    const debugInfo = {
      originalInitData: initData,
      parsedData: data,
      dataCheckString,
      receivedHash: hash,
      expectedHash,
      botTokenLength: botToken.length,
      secretKeyHex: secretKey.toString(), // 添加这个用于调试
    };

    // 验证 hash
    const isValid = hash === expectedHash;

    if (!isValid) {
      return {
        isValid: false,
        error: "Hash验证失败",
        debug: debugInfo,
      };
    }

    // 检查时间戳（可选，防止重放攻击）
    const authDate = parseInt(data.auth_date);
    if (isNaN(authDate)) {
      return { isValid: false, error: "无效的auth_date" };
    }

    // 检查数据是否过期（例如24小时）
    const currentTime = Math.floor(Date.now() / 1000);
    const maxAge = 24 * 60 * 60; // 24小时
    if (currentTime - authDate > maxAge) {
      return { isValid: false, error: "数据已过期" };
    }

    return {
      isValid: true,
      data: {
        ...data,
        hash,
        auth_date: authDate,
      } as TelegramInitData,
    };
  } catch (error) {
    return {
      isValid: false,
      error: `验证过程中发生错误: ${
        error instanceof Error ? error.message : "未知错误"
      }`,
    };
  }
}

/**
 * 从 Telegram WebApp 获取 InitData
 * @returns InitData 字符串或 null
 */
export function getTelegramInitData(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  // 尝试从 Telegram WebApp SDK 获取
  if ((window as any).Telegram?.WebApp?.initData) {
    return (window as any).Telegram.WebApp.initData;
  }

  // 尝试从 URL 参数获取（开发环境）
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("initData");
}

/**
 * 解析 InitData 字符串为对象
 * @param initData - InitData 字符串
 * @returns 解析后的对象
 */
export function parseInitData(initData: string): TelegramInitData | null {
  try {
    const urlParams = new URLSearchParams(initData);
    const data: Record<string, any> = {};

    Array.from(urlParams.entries()).forEach(([key, value]) => {
      if (key === "user") {
        try {
          data[key] = JSON.parse(value);
        } catch {
          data[key] = value;
        }
      } else if (key === "auth_date") {
        data[key] = parseInt(value);
      } else {
        data[key] = value;
      }
    });

    return data as TelegramInitData;
  } catch {
    return null;
  }
}
