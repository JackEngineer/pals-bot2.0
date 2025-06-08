import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatConversation } from "../../utils/util";

interface Context {
  params: {
    id: string;
  };
}

// GET /api/chat/conversations/[id]/detail - 获取会话的详情
export async function GET(request: NextRequest, { params }: Context) {
    try {
        const { id } = params;
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        if (!userId) {
            return NextResponse.json({
                success: false,
                error: "MISSING_USER_ID",
                message: "缺少用户ID",
            }, { status: 400 });
        }
        const conversation = await prisma.conversation.findUnique({
            where: {
                id,
            },
            include: {
                user1: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    avatarUrl: true,
                  },
                },
                user2: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    avatarUrl: true,
                  },
                },
                messages: {
                  orderBy: { createdAt: "desc" },
                  take: 1,
                  select: {
                    id: true,
                    content: true,
                    mediaType: true,
                    createdAt: true,
                    isRead: true,
                    senderId: true,
                  },
                },
            },
        });
        return NextResponse.json({
            success: true,
            data: formatConversation(conversation, userId),
            message: "获取会话详情成功",
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("获取会话详情失败:", error);
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