import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return NextResponse.json({ error: "Bot Token 未配置" }, { status: 400 });
    }

    // 调用 Telegram Bot API 验证 Token
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getMe`
    );
    const result = await response.json();

    if (result.ok) {
      return NextResponse.json({
        valid: true,
        bot: {
          id: result.result.id,
          username: result.result.username,
          first_name: result.result.first_name,
          can_join_groups: result.result.can_join_groups,
          can_read_all_group_messages:
            result.result.can_read_all_group_messages,
          supports_inline_queries: result.result.supports_inline_queries,
        },
        tokenPrefix: `${botToken.split(":")[0]}:${botToken
          .split(":")[1]
          ?.substring(0, 6)}...`,
      });
    } else {
      return NextResponse.json(
        {
          valid: false,
          error: result.description || "Bot Token 无效",
          errorCode: result.error_code,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        valid: false,
        error: "验证失败",
        details: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}
