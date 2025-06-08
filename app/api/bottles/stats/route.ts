import { NextRequest, NextResponse } from "next/server";
import { statisticsOperations } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // 获取查询参数中的日期（可选）
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get("date");
    const date = dateParam ? new Date(dateParam) : undefined;

    // 获取今日统计数据
    const stats = await statisticsOperations.getDailyStats(date);

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("获取今日统计失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "获取统计数据失败",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
