import { NextRequest, NextResponse } from "next/server";
import { bottleOperations } from "@/lib/prisma";
import { getRandomBottle } from "@/lib/database/bottles";

// GET /api/bottles/random - 获取随机漂流瓶
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_USER_ID",
          message: "缺少用户ID",
        },
        { status: 400 }
      );
    }

    // 获取随机漂流瓶
    const bottle = await getRandomBottle(userId);

    if (!bottle) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "暂时没有新的漂流瓶，稍后再试试吧～",
      });
    }

    // 记录用户发现了这个漂流瓶
    await bottleOperations.recordDiscovery(userId, bottle.id);

    return NextResponse.json({
      success: true,
      data: {
        id: bottle.id,
        content: bottle.content,
        mediaType: bottle.mediaType,
        mediaUrl: bottle.mediaUrl,
        bottleStyle: bottle.bottleStyle,
        createdAt: bottle.createdAt,
        author: {
          firstName: bottle.user.firstName, // 保持部分匿名
        },
        stats: {
          replies: bottle._count.replies,
          discoveries: bottle._count.discoveries,
        },
      },
    });
  } catch (error) {
    console.error("获取漂流瓶失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "服务器内部错误",
      },
      { status: 500 }
    );
  }
}
