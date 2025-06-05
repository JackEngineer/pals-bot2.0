import CryptoJS from "crypto-js";
import crypto from "crypto";

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
    if (!initData) {
      return { isValid: false, error: "缺少InitData参数" };
    }

    if (!botToken) {
      return {
        isValid: false,
        error: "缺少Bot Token - 请在环境变量中配置 TELEGRAM_BOT_TOKEN",
        debug: {
          hint: "请在Vercel中设置环境变量 TELEGRAM_BOT_TOKEN",
          envExample: "TELEGRAM_BOT_TOKEN=your_bot_token_here",
        },
      };
    }

    console.log("🔍 开始验证 InitData:", {
      initDataLength: initData.length,
      botTokenPrefix: botToken.substring(0, 15) + "...",
    });

    // 解析 URL 编码的数据
    const urlParams = new URLSearchParams(initData);
    const data: Record<string, any> = {};

    // 收集所有参数
    for (const [key, value] of urlParams.entries()) {
      data[key] = value; // 全部保留原始字符串
    }

    // 提取并验证 hash
    const receivedHash = data.hash;
    if (!receivedHash) {
      return { isValid: false, error: "缺少hash参数" };
    }

    // 移除 hash 参数
    delete data.hash;

    // 按字母顺序排序参数并构建数据检查字符串
    const dataCheckString = Object.keys(data)
      .sort()
      .map((key) => `${key}=${data[key]}`)
      .join("\n");

    console.log("🔧 数据检查字符串:", dataCheckString);

    // 按照 Telegram 官方文档计算 hash（使用 node 原生 crypto）
    // 1. secret_key = HMAC-SHA256("WebAppData", botToken)
    const secretKey = crypto
      .createHmac("sha256", botToken)
      .update("WebAppData")
      .digest();

    // 2. hash = HMAC-SHA256(data_check_string, secret_key)
    const expectedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    console.log("🔑 Hash比较:", {
      received: receivedHash,
      expected: expectedHash,
      match: receivedHash === expectedHash,
    });

    // 验证 hash
    if (receivedHash !== expectedHash) {
      return {
        isValid: false,
        error: "Hash验证失败",
        debug: {
          receivedHash,
          expectedHash,
          dataCheckString,
          suggestion: "请检查Bot Token是否正确，或尝试重新打开应用",
        },
      };
    }

    // 验证时间戳
    const authDate = data.auth_date;
    if (isNaN(authDate)) {
      return { isValid: false, error: "无效的auth_date" };
    }
    console.log("✅ InitData验证成功");

    // 解析 user 字段为对象
    let userObj: TelegramUser | undefined = undefined;
    if (data.user) {
      try {
        userObj = JSON.parse(data.user);
      } catch (e) {
        console.error("❌ 解析用户数据失败:", e);
        return { isValid: false, error: "用户数据格式错误" };
      }
    }

    return {
      isValid: true,
      data: {
        ...data,
        user: userObj,
        hash: receivedHash,
        auth_date: authDate,
      } as TelegramInitData,
    };
  } catch (error) {
    console.error("❌ 验证过程中发生错误:", error);
    return {
      isValid: false,
      error:
        "验证过程中发生错误: " +
        (error instanceof Error ? error.message : "未知错误"),
    };
  }
}

/**
 * 获取 Telegram InitData
 */
export function getTelegramInitData(): string | null {
  if (typeof window === "undefined") return null;

  // 优先从 URL 参数获取
  const urlParams = new URLSearchParams(window.location.search);
  const initDataFromUrl = urlParams.get("tgWebAppData");
  if (initDataFromUrl) {
    return decodeURIComponent(initDataFromUrl);
  }

  // 从 Telegram WebApp API 获取
  if (window.Telegram?.WebApp?.initData) {
    return window.Telegram.WebApp.initData;
  }

  return null;
}

/**
 * 解析 InitData 字符串
 */
export function parseInitData(initData: string): TelegramInitData | null {
  try {
    const urlParams = new URLSearchParams(initData);
    const result: any = {};

    for (const [key, value] of urlParams.entries()) {
      if (key === "user") {
        result[key] = JSON.parse(value);
      } else if (key === "auth_date") {
        result[key] = value;
      } else {
        result[key] = value;
      }
    }

    return result as TelegramInitData;
  } catch (error) {
    console.error("解析 InitData 失败:", error);
    return null;
  }
}
