import { NextRequest, NextResponse } from "next/server";
import {
  validateTelegramInitData,
  checkTelegramHashDebug,
} from "@/lib/telegram-auth";

export async function POST(request: NextRequest) {
  try {
    const { initData } = await request.json();

    if (!initData) {
      return NextResponse.json({ error: "缺少initData参数" }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: "缺少Bot Token" }, { status: 500 });
    }

    console.log("=== Telegram Hash 调试 API ===");
    console.log("收到的 initData:", initData.substring(0, 200) + "...");
    console.log("Bot Token 前缀:", botToken.substring(0, 15) + "...");

    // 使用调试函数进行验证
    const debugResult = checkTelegramHashDebug(initData, botToken);

    // 使用主验证函数进行验证
    const mainResult = validateTelegramInitData(initData, botToken);

    return NextResponse.json({
      success: true,
      debugResult,
      mainResult,
      initDataLength: initData.length,
      botTokenPrefix: botToken.substring(0, 15) + "...",
    });
  } catch (error) {
    console.error("调试API错误:", error);
    return NextResponse.json(
      {
        error: "调试过程中发生错误",
        details: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Telegram Hash 调试 API",
    usage: "POST请求，发送 { initData: 'your_init_data_here' }",
  });
}
