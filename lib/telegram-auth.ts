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
 * 根据 Telegram 官方文档：https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
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
      sampleData: initData.substring(0, 200) + "...",
    });

    // 检测并处理多重URL编码问题
    let processedInitData = initData;

    // 如果包含 %26 或 %3D，说明可能被多重编码了
    if (initData.includes("%26") || initData.includes("%3D")) {
      console.log("🔧 检测到多重编码，进行预处理...");
      try {
        processedInitData = decodeURIComponent(initData);
        console.log(
          "🔧 预解码完成，长度从",
          initData.length,
          "变为",
          processedInitData.length
        );
      } catch (e) {
        console.warn("⚠️ 预解码失败，使用原始数据:", e);
        processedInitData = initData;
      }
    }

    // 按照 Telegram 官方文档正确解析参数
    // 重要：不要对整个 initData 进行 decodeURIComponent，而是分别处理每个参数
    const urlParams = new URLSearchParams(processedInitData);
    const data: Record<string, string> = {};

    // 收集所有参数，保持 URLSearchParams 解析后的状态
    for (const [key, value] of urlParams.entries()) {
      data[key] = value;
    }

    console.log("📋 解析到的参数:", Object.keys(data));

    // 提取并验证 hash
    const receivedHash = data.hash;
    if (!receivedHash) {
      return { isValid: false, error: "缺少hash参数" };
    }

    // 移除 hash 和 signature 参数（根据Telegram官方文档）
    const dataForCheck = { ...data };
    delete dataForCheck.hash;
    delete dataForCheck.signature; // Telegram官方文档要求排除signature参数

    // 按字母顺序排序参数并构建数据检查字符串
    // 重要：这里使用的是 URLSearchParams 已经解析的值，符合 Telegram 规范
    const dataCheckString = Object.keys(dataForCheck)
      .sort()
      .map((key) => `${key}=${dataForCheck[key]}`)
      .join("\n");

    console.log("🔧 数据检查字符串:\n", dataCheckString);

    // 按照 Telegram 官方文档计算 hash
    // 1. secret_key = HMAC-SHA256("WebAppData", botToken)
    const secretKey = crypto
      .createHmac("sha256", botToken)
      .update("WebAppData")
      .digest();

    // 2. hash = HMAC-SHA256(data_check_string, secret_key)
    const expectedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString, "utf8")
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
          paramCount: Object.keys(dataForCheck).length,
          suggestion: "请检查Bot Token是否正确，或尝试重新打开应用",
        },
      };
    }

    // 验证时间戳
    const authDate = parseInt(data.auth_date);
    if (isNaN(authDate)) {
      return { isValid: false, error: "无效的auth_date" };
    }

    // 验证是否在24小时内（可选）
    const now = Math.floor(Date.now() / 1000);
    const timeDiff = now - authDate;
    if (timeDiff > 86400) {
      // 24小时 = 86400秒
      console.warn("⚠️ InitData 超过24小时，但仍然验证通过");
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
    const rawData = window.Telegram.WebApp.initData;
    console.log("🔄 从 Telegram WebApp API 获取 initData");
    console.log("📊 原始数据统计:", {
      length: rawData.length,
      containsHash: rawData.includes("hash="),
      containsAuthDate: rawData.includes("auth_date="),
      containsQueryId: rawData.includes("query_id="),
      fieldCount: rawData.split("&").length,
      firstPart: rawData.substring(0, 200) + "...",
      lastPart: "..." + rawData.substring(rawData.length - 200),
    });
    return rawData;
  }

  // 从 URL 参数获取（作为备用方案）
  const urlParams = new URLSearchParams(window.location.search);
  const initDataFromUrl = urlParams.get("tgWebAppData");
  if (initDataFromUrl) {
    console.log("🔄 从 URL 参数获取 initData");

    // 检查是否有其他相关参数（chat_instance, auth_date, hash等）
    // 这些可能因为URL解析问题被分离为独立参数
    const additionalParams = [];
    for (const [key, value] of urlParams.entries()) {
      if (
        key !== "tgWebAppData" &&
        (key === "chat_instance" ||
          key === "chat_type" ||
          key === "auth_date" ||
          key === "hash" ||
          key === "signature" ||
          key === "query_id" ||
          key === "start_param")
      ) {
        additionalParams.push(`${key}=${value}`);
      }
    }

    // 重建完整的initData
    let fullInitData = initDataFromUrl;
    if (additionalParams.length > 0) {
      fullInitData = initDataFromUrl + "&" + additionalParams.join("&");
      console.log("🔧 从URL参数重建完整 initData:", {
        original: initDataFromUrl,
        additional: additionalParams,
        rebuilt: fullInitData.substring(0, 200) + "...",
      });
    }

    console.log("📊 URL数据统计:", {
      length: fullInitData.length,
      containsHash: fullInitData.includes("hash="),
      containsAuthDate: fullInitData.includes("auth_date="),
      containsQueryId: fullInitData.includes("query_id="),
      fieldCount: fullInitData.split("&").length,
    });

    // 检查是否需要再次解码（如果数据仍然包含%编码）
    try {
      if (fullInitData.includes("%")) {
        console.log("⚠️ 检测到URL编码字符，尝试解码");
        const decoded = decodeURIComponent(fullInitData);
        console.log("🔍 解码前:", fullInitData.substring(0, 100) + "...");
        console.log("🔍 解码后:", decoded.substring(0, 100) + "...");
        return decoded;
      }
      return fullInitData;
    } catch (e) {
      console.warn("⚠️ URL解码失败，使用原始数据:", e);
      return fullInitData;
    }
  }

  console.warn("❌ 无法获取 initData - 不在 Telegram 环境中");
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
  // 使用与主验证函数相同的逻辑
  const urlParams = new URLSearchParams(initData);
  const data: Record<string, string> = {};

  for (const [key, value] of urlParams.entries()) {
    data[key] = value;
  }

  const receivedHash = data.hash;
  delete data.hash;
  delete data.signature; // Telegram官方文档要求排除signature参数

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
    .update(dataCheckString, "utf8")
    .digest("hex");

  console.log("【DEBUG】dataCheckString:\n", dataCheckString);
  console.log("【DEBUG】secretKey (hex):", secretKey.toString("hex"));
  console.log("【DEBUG】expectedHash:", expectedHash);
  console.log("【DEBUG】receivedHash:", receivedHash);
  console.log("【DEBUG】参数数量:", Object.keys(data).length);

  if (expectedHash === receivedHash) {
    console.log("✅ Hash 校验通过");
    return true;
  } else {
    console.log("❌ Hash 校验失败");
    console.log("【DEBUG】可能的原因:");
    console.log("1. Bot Token 不正确");
    console.log("2. InitData 被修改或损坏");
    console.log("3. 参数编码处理不当");
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
