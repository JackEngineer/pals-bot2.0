import { NextRequest, NextResponse } from "next/server";
import { addUser } from "@/lib/database/user";
import { bigIntToString } from "@/lib/database/utils";

// POST /api/user/add - 添加用户
export async function POST(request: NextRequest) {
  try {
    const { user } = await request.json();

    // 验证必要字段
    if (!user || !user.telegramId) {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          message: "缺少必要的用户信息",
        },
        { status: 400 }
      );
    }

    console.log("添加/更新用户:", user);
    const resultUser = await addUser(user);

    return NextResponse.json({
      success: true,
      data: bigIntToString(resultUser),
      message: "用户信息已保存",
    });
  } catch (error: any) {
    console.error("添加用户失败:", error);

    // 处理验证错误
    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          message: "用户数据格式不正确",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "添加用户失败",
      },
      { status: 500 }
    );
  }
}
