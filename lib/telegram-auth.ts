import CryptoJS from "crypto-js";

/**
 * Telegram InitData 接口定义
 */
export interface TelegramInitData {
  query_id?: string;
  user?: TelegramUser;
  auth_date: number;
  hash: string;
  start_param?: string;
}

/**
 * Telegram 用户信息接口
 */
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

/**
 * 解析 Telegram InitData 字符串
 * @param initDataString - Telegram 传递的 initData 字符串
 * @returns 解析后的 InitData 对象
 */
export function parseInitData(initDataString: string): TelegramInitData {
  const urlParams = new URLSearchParams(initDataString);
  const data: any = {};

  for (const [key, value] of urlParams.entries()) {
    if (key === "user") {
      data[key] = JSON.parse(decodeURIComponent(value));
    } else if (key === "auth_date") {
      data[key] = parseInt(value, 10);
    } else {
      data[key] = value;
    }
  }

  return data as TelegramInitData;
}

/**
 * 验证 Telegram InitData 的有效性
 * @param initDataString - Telegram 传递的 initData 字符串
 * @param botToken - Telegram Bot Token
 * @returns 验证结果
 */
export function validateInitData(
  initDataString: string,
  botToken: string
): boolean {
  try {
    const urlParams = new URLSearchParams(initDataString);
    const hash = urlParams.get("hash");

    if (!hash) {
      return false;
    }

    // 移除 hash 参数
    urlParams.delete("hash");

    // 按键名排序并构建验证字符串
    const sortedParams = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    // 使用 bot token 生成密钥
    const secretKey = CryptoJS.HmacSHA256(botToken, "WebAppData");

    // 计算 HMAC-SHA256
    const calculatedHash = CryptoJS.HmacSHA256(
      sortedParams,
      secretKey
    ).toString();

    // 比较哈希值
    return calculatedHash === hash;
  } catch (error) {
    console.error("验证 InitData 时出错:", error);
    return false;
  }
}

/**
 * 检查 auth_date 是否在有效时间范围内（默认5分钟）
 * @param authDate - 认证时间戳
 * @param maxAgeSeconds - 最大有效时间（秒），默认300秒（5分钟）
 * @returns 是否在有效时间范围内
 */
export function isAuthDateValid(
  authDate: number,
  maxAgeSeconds: number = 300
): boolean {
  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime - authDate <= maxAgeSeconds;
}

/**
 * 完整验证 Telegram InitData
 * @param initDataString - Telegram 传递的 initData 字符串
 * @param botToken - Telegram Bot Token
 * @param maxAgeSeconds - 最大有效时间（秒）
 * @returns 验证结果和用户信息
 */
export function verifyTelegramAuth(
  initDataString: string,
  botToken: string,
  maxAgeSeconds: number = 300
): { isValid: boolean; user?: TelegramUser; error?: string } {
  try {
    // 解析 InitData
    const initData = parseInitData(initDataString);

    // 检查是否包含必要字段
    if (!initData.auth_date || !initData.hash) {
      return { isValid: false, error: "缺少必要的认证字段" };
    }

    // 验证时间有效性
    if (!isAuthDateValid(initData.auth_date, maxAgeSeconds)) {
      return { isValid: false, error: "认证时间已过期" };
    }

    // 验证签名
    if (!validateInitData(initDataString, botToken)) {
      return { isValid: false, error: "签名验证失败" };
    }

    return {
      isValid: true,
      user: initData.user,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "验证过程中发生未知错误",
    };
  }
}
