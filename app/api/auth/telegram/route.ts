import { NextRequest, NextResponse } from "next/server";
import { validateTelegramInitData } from "@/lib/telegram-auth";

export async function POST(request: NextRequest) {
  try {
    const { initData } = await request.json();

    if (!initData) {
      return NextResponse.json({ error: "缺少initData参数" }, { status: 400 });
    }

    // 从环境变量获取 Bot Token
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { error: "服务器配置错误：缺少Bot Token" },
        { status: 500 }
      );
    }

    // 验证 InitData
    const validation = validateTelegramInitData(initData, botToken);

    if (!validation.isValid) {
      // 在开发环境中返回调试信息
      const response: any = { error: validation.error };
      if (process.env.NODE_ENV === "development" && validation.debug) {
        response.debug = validation.debug;
      }
      return NextResponse.json(response, { status: 401 });
    }

    // 验证成功，返回用户信息
    return NextResponse.json({
      success: true,
      user: validation.data?.user,
      authDate: validation.data?.auth_date,
    });
  } catch (error) {
    console.error("Telegram认证错误:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "此端点仅支持POST请求" }, { status: 405 });
}
