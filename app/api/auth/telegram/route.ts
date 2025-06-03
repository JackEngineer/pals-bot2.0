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
        {
          error: "服务器配置错误：缺少Bot Token",
          details: "请检查 .env.local 文件中的 TELEGRAM_BOT_TOKEN 配置",
          hint: "创建 .env.local 文件并添加: TELEGRAM_BOT_TOKEN=your_bot_token",
        },
        { status: 500 }
      );
    }

    // 验证 InitData
    const validation = validateTelegramInitData(initData, botToken);

    if (!validation.isValid) {
      // 构建详细的错误响应
      const response: any = {
        error: validation.error,
        authFailed: true,
      };

      // 在开发环境中返回调试信息
      if (process.env.NODE_ENV === "development" && validation.debug) {
        response.debug = validation.debug;
        response.troubleshooting = {
          possibleCauses: [
            "Bot Token 配置错误",
            "InitData 已过期（超过24小时）",
            "InitData 格式不正确",
            "网络传输过程中数据被修改",
          ],
          suggestions: [
            "检查 .env.local 中的 TELEGRAM_BOT_TOKEN 是否正确",
            "确认应用是通过 Telegram Bot 正确启动",
            "尝试重新启动 Telegram Mini App",
            "查看调试页面 /debug 获取更多信息",
          ],
        };
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
    return NextResponse.json(
      {
        error: "服务器内部错误",
        details: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "此端点仅支持POST请求" }, { status: 405 });
}
