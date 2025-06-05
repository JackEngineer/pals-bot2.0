import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramAuth } from "@/lib/telegram-auth";

export async function POST(request: NextRequest) {
  try {
    const { initData } = await request.json();

    if (!initData) {
      return NextResponse.json(
        { error: "缺少 initData 参数" },
        { status: 400 }
      );
    }

    // 从环境变量获取 Bot Token
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error("未配置 TELEGRAM_BOT_TOKEN 环境变量");
      return NextResponse.json({ error: "服务器配置错误" }, { status: 500 });
    }

    // 验证 Telegram InitData
    const verificationResult = verifyTelegramAuth(initData, botToken);

    if (!verificationResult.isValid) {
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
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

// 也支持 GET 请求（用于测试）
export async function GET() {
  return NextResponse.json({
    message: "Telegram 身份验证 API",
    endpoint: "/api/auth/telegram",
    method: "POST",
    requiredFields: ["initData"],
  });
}
