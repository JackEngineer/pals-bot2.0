import { NextRequest, NextResponse } from "next/server";

/**
 * 简单的ping端点，用于网络延迟检测
 * 返回时间戳和状态信息
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        serverTime: Date.now(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "PING_ERROR",
        message: "服务器响应失败",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * HEAD方法用于更轻量的延迟检测
 * 只返回响应头，不返回响应体
 */
export async function HEAD(request: NextRequest) {
  try {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Server-Time': Date.now().toString(),
        'X-Timestamp': new Date().toISOString(),
      },
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 500,
      headers: {
        'X-Error': 'PING_ERROR',
      },
    });
  }
} 