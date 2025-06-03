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
    if (!initData) {
      return { isValid: false, error: "缺少InitData参数" };
    }

    // 开发环境下的特殊处理
    if (!botToken && process.env.NODE_ENV === "development") {
      console.warn("⚠️ 开发环境：Bot Token未配置，使用简化认证模式");

      // 解析 InitData 但跳过签名验证
      const urlParams = new URLSearchParams(initData);
      const data: Record<string, any> = {};

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

      // 如果没有用户数据，尝试从 initDataUnsafe 获取
      if (!data.user && typeof window !== "undefined") {
        const unsafeUser = (window as any).Telegram?.WebApp?.initDataUnsafe
          ?.user;
        if (unsafeUser) {
          data.user = unsafeUser;
          data.auth_date = Math.floor(Date.now() / 1000);
          data.hash = "dev_mode";
        }
      }

      if (data.user) {
        return {
          isValid: true,
          data: data as TelegramInitData,
          debug: {
            mode: "开发环境简化认证",
            warning: "请配置正确的 TELEGRAM_BOT_TOKEN 以启用完整验证",
          },
        };
      }
    }

    if (!botToken) {
      return {
        isValid: false,
        error: "缺少Bot Token - 请在 .env.local 文件中配置 TELEGRAM_BOT_TOKEN",
        debug: {
          hint: "创建 .env.local 文件并添加: TELEGRAM_BOT_TOKEN=your_bot_token",
        },
      };
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

    // 按键名排序并构建检查字符串 - 严格按照Telegram文档
    const dataCheckString = Object.keys(data)
      .sort()
      .map((key) => {
        let value = data[key];
        // 对于对象类型，需要JSON stringify但不添加空格
        if (typeof value === "object") {
          value = JSON.stringify(value);
        }
        return `${key}=${value}`;
      })
      .join("\n");

    // 根据 Telegram 官方文档：
    // 1. secret_key = HMAC-SHA256(bot_token, "WebAppData")
    // 2. hash = HMAC-SHA256(data_check_string, secret_key)

    // 步骤1：生成secret key
    const secretKey = CryptoJS.HmacSHA256(botToken, "WebAppData");

    // 步骤2：计算期望的 hash
    const expectedHash = CryptoJS.HmacSHA256(
      dataCheckString,
      secretKey
    ).toString(CryptoJS.enc.Hex);

    // 详细调试信息
    const debugInfo = {
      step1_originalInitData: initData,
      step2_parsedData: data,
      step3_dataCheckString: dataCheckString,
      step4_dataCheckStringBytes: Array.from(
        new TextEncoder().encode(dataCheckString)
      ),
      step5_botToken: `${botToken.substring(0, 15)}...`,
      step6_secretKey: secretKey.toString(CryptoJS.enc.Hex),
      step7_expectedHash: expectedHash,
      step8_receivedHash: hash,
      step9_comparison: {
        receivedHash: hash,
        expectedHash: expectedHash,
        receivedLength: hash.length,
        expectedLength: expectedHash.length,
        areEqual: hash === expectedHash,
        receivedLowerCase: hash.toLowerCase(),
        expectedLowerCase: expectedHash.toLowerCase(),
        caseInsensitiveMatch: hash.toLowerCase() === expectedHash.toLowerCase(),
      },
      rawInitDataLength: initData.length,
      parsedKeysCount: Object.keys(data).length,
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
