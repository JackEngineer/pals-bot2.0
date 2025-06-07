import { NextRequest, NextResponse } from "next/server";
import { getUserByTelegramId } from "@/lib/database/user";

// GET /api/user/telegram/{id}
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: telegramId } = params;
    if (!telegramId) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_TELEGRAM_ID",
          message: "缺少 telegramId 参数",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    const user = await getUserByTelegramId(BigInt(telegramId));
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          error: "USER_NOT_FOUND",
          message: "未找到对应用户",
          data: null,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }
    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        telegramId: user.telegramId.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        languageCode: user.languageCode,
        createdAt: user.createdAt,
        isActive: user.isActive,
        // 可扩展更多字段
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "获取用户信息失败",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
