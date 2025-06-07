import { NextRequest, NextResponse } from "next/server";
import { addUser } from "@/lib/database/user";
import { bigIntToString } from "@/lib/database/utils";

// POST /api/user/add - 添加用户
export async function POST(request: NextRequest) {
  try {
    const { user } = await request.json();
    console.log(user);
    const newUser = await addUser(user);
    return NextResponse.json({
      success: true,
      data: bigIntToString(newUser),
    });
  } catch (error) {
    console.error(error);
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
