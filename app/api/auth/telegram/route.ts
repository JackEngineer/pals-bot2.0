import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramAuth } from "@/lib/telegram-auth";

// 开发模式的模拟用户数据
const MOCK_USER = {
  id: 12345678912,
  first_name: "张",
  last_name: "三",
  username: "zhangsan",
  language_code: "zh",
  is_premium: false,
  photo_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan",
};

export async function POST(request: NextRequest) {
  try {
    const { initData } = await request.json();

    if (!initData) {
      return NextResponse.json(
        { error: "缺少 initData 参数" },
        { status: 400 }
      );
    }

    // 检查是否为开发模式
    const isDevelopmentMode =
      process.env.NODE_ENV === "development" ||
      process.env.VERCEL_ENV === "development";

    // 开发模式处理
    if (isDevelopmentMode) {
      // 如果是开发模式的特殊标识，直接返回模拟数据
      if (initData === "DEVELOPMENT_MODE_MOCK_DATA") {
        console.log("开发模式：返回模拟用户数据");
        return NextResponse.json({
          success: true,
          user: MOCK_USER,
          message: "开发模式身份验证成功",
        });
      }
    }

    // 从环境变量获取 Bot Token
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error("未配置 TELEGRAM_BOT_TOKEN 环境变量");

      // 在开发模式下，如果没有配置 Bot Token，返回模拟数据
      if (isDevelopmentMode) {
        console.log("开发模式：Bot Token 未配置，返回模拟数据");
        return NextResponse.json({
          success: true,
          user: MOCK_USER,
          message: "开发模式身份验证成功 (Bot Token 未配置)",
        });
      }

      return NextResponse.json({ error: "服务器配置错误" }, { status: 500 });
    }

    // 验证 Telegram InitData
    const verificationResult = verifyTelegramAuth(initData, botToken);

    if (!verificationResult.isValid) {
      // 在开发模式下，如果验证失败，返回模拟数据作为后备
      if (isDevelopmentMode) {
        console.log("开发模式：验证失败，返回模拟数据作为后备");
        return NextResponse.json({
          success: true,
          user: MOCK_USER,
          message: "开发模式身份验证成功 (后备模式)",
        });
      }

      return NextResponse.json(
        { error: verificationResult.error || "身份验证失败" },
        { status: 401 }
      );
    }

    // 验证成功，返回用户信息
    return NextResponse.json({
      success: true,
      user: verificationResult.user,
      message: "身份验证成功",
    });
  } catch (error) {
    console.error("处理身份验证请求时出错:", error);

    // 在开发模式下，即使出现错误也返回模拟数据
    const isDevelopmentMode =
      process.env.NODE_ENV === "development" ||
      process.env.VERCEL_ENV === "development";

    if (isDevelopmentMode) {
      console.log("开发模式：处理错误，返回模拟数据");
      return NextResponse.json({
        success: true,
        user: MOCK_USER,
        message: "开发模式身份验证成功 (错误恢复)",
      });
    }

    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

// 也支持 GET 请求（用于测试）
export async function GET() {
  const isDevelopmentMode =
    process.env.NODE_ENV === "development" ||
    process.env.VERCEL_ENV === "development";

  return NextResponse.json({
    message: "Telegram 身份验证 API",
    endpoint: "/api/auth/telegram",
    method: "POST",
    requiredFields: ["initData"],
    developmentMode: isDevelopmentMode,
    mockUser: isDevelopmentMode ? MOCK_USER : undefined,
  });
}
