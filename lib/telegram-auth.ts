const crypto = require("crypto");

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
      containsPercent: initData.includes("%"),
      containsBackslash: initData.includes("\\"),
      sampleData: initData.substring(0, 200) + "...",
    });

    // 手动解析参数（避免自动解码）
    const pairs = initData.split("&");
    const data: Record<string, any> = {};

    // 收集所有参数，保持原始编码
    for (const pair of pairs) {
      const [key, value] = pair.split("=", 2);
      data[key] = value;
    }

    // 提取并验证 hash
    const receivedHash = data.hash;
    if (!receivedHash) {
      return { isValid: false, error: "缺少hash参数" };
    }

    // 移除 hash 和 signature 参数
    delete data.hash;
    delete data.signature;

    // 按字母顺序排序参数并构建数据检查字符串
    const dataCheckString = Object.keys(data)
      .sort()
      .map((key) => `${key}=${data[key]}`)
      .join("\n");

    console.log("🔧 数据检查字符串:", dataCheckString);

    // 调试user字段编码
    if (data.user) {
      console.log("👤 User字段调试:", {
        rawUser: data.user,
        containsBackslash: data.user.includes("\\"),
        containsPercent: data.user.includes("%"),
        length: data.user.length,
      });
    }

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

  // 优先从 Telegram WebApp API 获取
  if (window.Telegram?.WebApp?.initData) {
    console.log("🔄 从 Telegram WebApp API 获取 initData");
    return window.Telegram.WebApp.initData;
  }

  // 从 URL 参数获取（作为备用方案）
  const urlParams = new URLSearchParams(window.location.search);
  const initDataFromUrl = urlParams.get("tgWebAppData");
  if (initDataFromUrl) {
    console.log("🔄 从 URL 参数获取 initData");
    // URL参数已经被URLSearchParams自动解码一次了
    // 检查是否需要再次解码（如果数据仍然包含%编码）
    try {
      if (initDataFromUrl.includes("%")) {
        console.log("⚠️ 检测到URL编码字符，尝试解码");
        const decoded = decodeURIComponent(initDataFromUrl);
        console.log("🔍 解码前:", initDataFromUrl.substring(0, 100) + "...");
        console.log("🔍 解码后:", decoded.substring(0, 100) + "...");
        return decoded;
      }
      return initDataFromUrl;
    } catch (e) {
      console.warn("⚠️ URL解码失败，使用原始数据:", e);
      return initDataFromUrl;
    }
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

/**
 * 本地对比 Telegram hash 校验工具
 * @param initData - Telegram WebApp 获取的初始化数据字符串
 * @param botToken - Telegram Bot Token
 */
export function checkTelegramHashDebug(initData: string, botToken: string) {
  const pairs = initData.split("&");
  const data: Record<string, any> = {};
  for (const pair of pairs) {
    const [key, value] = pair.split("=", 2);
    data[key] = value;
  }
  const receivedHash = data.hash;
  delete data.hash;
  delete data.signature; // 移除 signature 字段
  const dataCheckString = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join("\n");
  const secretKey = crypto
    .createHmac("sha256", botToken)
    .update("WebAppData")
    .digest();
  const expectedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");
  console.log("【DEBUG】dataCheckString:\n", dataCheckString);
  console.log("【DEBUG】secretKey (hex):", secretKey.toString("hex"));
  console.log("【DEBUG】expectedHash:", expectedHash);
  console.log("【DEBUG】receivedHash:", receivedHash);
  if (expectedHash === receivedHash) {
    console.log("✅ Hash 校验通过");
    return true;
  } else {
    console.log("❌ Hash 校验失败");
    return false;
  }
}

// ====== 本地命令行调试入口 ======
if (require.main === module) {
  // 你可以在这里填写你的 initData 和 botToken 进行本地测试
  const initData = process.env.TG_INIT_DATA || ""; // 推荐用环境变量传递，避免泄漏
  const botToken = process.env.TG_BOT_TOKEN || "";
  if (!initData || !botToken) {
    console.log("请通过环境变量 TG_INIT_DATA 和 TG_BOT_TOKEN 传入参数");
    process.exit(1);
  }
  checkTelegramHashDebug(initData, botToken);
}
