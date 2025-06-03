import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    return NextResponse.json({
      hasBotToken: !!botToken,
      tokenPrefix: botToken
        ? `${botToken.split(":")[0]}:${botToken.split(":")[1]?.substring(0, 6)}`
        : null,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: "环境检查失败" }, { status: 500 });
  }
}
