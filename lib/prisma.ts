import { PrismaClient } from "@prisma/client";

// 创建 Prisma 客户端实例 (单例模式)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// 用户相关操作
export const userOperations = {
  // 根据 Telegram ID 创建或获取用户
  async upsertByTelegramId(telegramUser: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  }) {
    return prisma.user.upsert({
      where: { telegramId: telegramUser.id },
      update: {
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        username: telegramUser.username,
        languageCode: telegramUser.language_code,
      },
      create: {
        telegramId: telegramUser.id,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        username: telegramUser.username,
        languageCode: telegramUser.language_code,
      },
    });
  },

  // 根据 ID 获取用户
  async getById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        bottles: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            bottles: true,
            replies: true,
            discoveries: true,
          },
        },
      },
    });
  },
};

// 漂流瓶相关操作
export const bottleOperations = {
  // 创建新漂流瓶
  async create(data: {
    userId: string;
    content: string;
    mediaType?: "TEXT" | "IMAGE" | "AUDIO";
    mediaUrl?: string;
    bottleStyle?: any;
  }) {
    return prisma.bottle.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            username: true,
          },
        },
      },
    });
  },

  // 获取随机漂流瓶 (排除用户自己的)
  async getRandomForUser(userId: string, excludeDiscovered: boolean = true) {
    const whereClause: any = {
      userId: { not: userId },
      isActive: true,
    };

    // 排除已发现的漂流瓶
    if (excludeDiscovered) {
      whereClause.discoveries = {
        none: { userId },
      };
    }

    // 先获取符合条件的漂流瓶数量
    const count = await prisma.bottle.count({ where: whereClause });

    if (count === 0) return null;

    // 随机跳过一些记录
    const skip = Math.floor(Math.random() * count);

    return prisma.bottle.findFirst({
      where: whereClause,
      skip,
      include: {
        user: {
          select: {
            firstName: true,
            // 不包含敏感信息，保持匿名
          },
        },
        _count: {
          select: {
            replies: true,
            discoveries: true,
          },
        },
      },
    });
  },

  // 记录用户发现漂流瓶
  async recordDiscovery(userId: string, bottleId: string) {
    return prisma.discovery.upsert({
      where: {
        userId_bottleId: {
          userId,
          bottleId,
        },
      },
      update: {}, // 已存在则不做任何更新
      create: {
        userId,
        bottleId,
      },
    });
  },

  // 获取漂流瓶详情
  async getById(id: string) {
    return prisma.bottle.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            firstName: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                firstName: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: {
            replies: true,
            discoveries: true,
          },
        },
      },
    });
  },
};

// 回复相关操作
export const replyOperations = {
  // 创建回复
  async create(data: {
    content: string;
    userId: string;
    bottleId: string;
    mediaType?: "TEXT" | "IMAGE" | "AUDIO";
    mediaUrl?: string;
  }) {
    return prisma.reply.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
          },
        },
        bottle: {
          select: {
            id: true,
            content: true,
          },
        },
      },
    });
  },

  // 获取漂流瓶的所有回复
  async getByBottleId(bottleId: string) {
    return prisma.reply.findMany({
      where: { bottleId },
      include: {
        user: {
          select: {
            firstName: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  },
};

// 统计数据操作
export const statisticsOperations = {
  // 获取用户统计
  async getUserStats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            bottles: true,
            replies: true,
            discoveries: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      totalBottles: user._count.bottles,
      totalReplies: user._count.replies,
      totalDiscoveries: user._count.discoveries,
      joinedAt: user.createdAt,
    };
  },

  // 获取全局统计
  async getGlobalStats() {
    const [totalUsers, totalBottles, totalReplies] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.bottle.count({ where: { isActive: true } }),
      prisma.reply.count(),
    ]);

    return {
      totalUsers,
      totalBottles,
      totalReplies,
    };
  },
};

export default prisma;
