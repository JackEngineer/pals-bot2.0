import { prisma } from "@/lib/prisma";
import type {
  BottleWithRelations,
  UserWithRelations,
  ConversationWithMessages,
  AchievementWithProgress,
  PaginationParams,
  BottleFilters,
  UserFilters,
  PaginatedResponse,
  UserStatsSummary,
  BottleStatsSummary,
  CreateBottleData,
  CreateReplyData,
  UpdateUserSettingsData,
} from "@/lib/types/database";
import {
  Prisma,
  MediaType,
  BottleStatus,
  AchievementCategory,
} from "@prisma/client";

// ==================== 用户相关查询 ====================

export async function getUserByTelegramId(
  telegramId: bigint | number
): Promise<UserWithRelations | null> {
  return await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
    include: {
      settings: true,
      stats: true,
      achievements: {
        include: {
          achievement: true,
        },
      },
      followers: {
        include: {
          follower: true,
        },
      },
      following: {
        include: {
          following: true,
        },
      },
    },
  });
}

export async function createUserWithDefaults(userData: {
  telegramId: bigint | number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  avatarUrl?: string;
}): Promise<UserWithRelations> {
  return await prisma.$transaction(async (tx) => {
    // 创建用户
    const user = await tx.user.create({
      data: {
        telegramId: BigInt(userData.telegramId),
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        languageCode: userData.languageCode,
        avatarUrl: userData.avatarUrl,
      },
    });

    // 创建用户设置
    await tx.userSettings.create({
      data: {
        userId: user.id,
        contentLanguage: userData.languageCode || "zh",
      },
    });

    // 创建用户统计
    await tx.userStats.create({
      data: {
        userId: user.id,
      },
    });

    // 返回完整用户信息
    return (await tx.user.findUnique({
      where: { id: user.id },
      include: {
        settings: true,
        stats: true,
        achievements: {
          include: {
            achievement: true,
          },
        },
      },
    })) as UserWithRelations;
  });
}

export async function updateUserProfile(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
  }
): Promise<UserWithRelations> {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
    include: {
      settings: true,
      stats: true,
    },
  });
}

export async function updateUserSettings(
  userId: string,
  settings: UpdateUserSettingsData
): Promise<void> {
  await prisma.userSettings.upsert({
    where: { userId },
    update: {
      ...settings,
      updatedAt: new Date(),
    },
    create: {
      userId,
      ...settings,
    },
  });
}

export async function getUserStats(
  userId: string
): Promise<UserStatsSummary | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      stats: true,
    },
  });

  if (!user || !user.stats) return null;

  // 计算升级所需经验
  const nextLevelExp = calculateExpForLevel(user.level + 1);

  return {
    bottlesCreated: user.stats.bottlesCreated,
    bottlesDiscovered: user.stats.bottlesDiscovered,
    repliesReceived: user.stats.repliesReceived,
    repliesSent: user.stats.repliesSent,
    likesReceived: user.stats.likesReceived,
    likesGiven: user.stats.likesGiven,
    followersCount: user.stats.followersCount,
    followingCount: user.stats.followingCount,
    achievementsCount: user.stats.achievementsCount,
    dailyStreak: user.stats.dailyStreak,
    longestStreak: user.stats.longestStreak,
    level: user.level,
    experience: user.experience,
    nextLevelExp,
  };
}

// ==================== 漂流瓶相关查询 ====================

export async function createBottle(
  userId: string,
  data: CreateBottleData
): Promise<BottleWithRelations> {
  return await prisma.$transaction(async (tx) => {
    // 创建漂流瓶
    const bottle = await tx.bottle.create({
      data: {
        userId,
        content: data.content,
        mediaType: data.mediaType || MediaType.TEXT,
        mediaUrl: data.mediaUrl,
        bottleStyle: data.bottleStyle,
        latitude: data.latitude,
        longitude: data.longitude,
        location: data.location,
      },
    });

    // 添加标签关联
    if (data.tagIds && data.tagIds.length > 0) {
      await tx.bottleTag.createMany({
        data: data.tagIds.map((tagId) => ({
          bottleId: bottle.id,
          tagId,
        })),
      });

      // 更新标签使用计数
      await tx.tag.updateMany({
        where: { id: { in: data.tagIds } },
        data: { usageCount: { increment: 1 } },
      });
    }

    // 更新用户统计
    await tx.userStats.update({
      where: { userId },
      data: {
        bottlesCreated: { increment: 1 },
      },
    });

    // 检查成就
    await checkAndUnlockAchievements(tx, userId, "bottle_created");

    // 返回完整漂流瓶信息
    return (await getBottleById(bottle.id)) as BottleWithRelations;
  });
}

export async function getBottleById(
  bottleId: string,
  viewerId?: string
): Promise<BottleWithRelations | null> {
  const bottle = await prisma.bottle.findUnique({
    where: { id: bottleId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          avatarUrl: true,
          level: true,
          isVerified: true,
        },
      },
      replies: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatarUrl: true,
              level: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 10,
      },
      likes: viewerId
        ? {
            where: { userId: viewerId },
            take: 1,
          }
        : false,
      bookmarks: viewerId
        ? {
            where: { userId: viewerId },
            take: 1,
          }
        : false,
      tags: {
        include: {
          tag: true,
        },
      },
      _count: {
        select: {
          likes: true,
          replies: true,
          discoveries: true,
        },
      },
    },
  });

  // 如果有观看者且不是作者，增加浏览次数
  if (bottle && viewerId && bottle.userId !== viewerId) {
    await prisma.bottle.update({
      where: { id: bottleId },
      data: { viewCount: { increment: 1 } },
    });
  }

  return bottle;
}

export async function getRandomBottles(
  userId: string,
  filters: BottleFilters = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResponse<BottleWithRelations>> {
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  // 构建查询条件
  const where: Prisma.BottleWhereInput = {
    // 排除自己的漂流瓶
    userId: { not: userId },
    // 排除已发现的漂流瓶
    discoveries: {
      none: { userId },
    },
    status: BottleStatus.ACTIVE,
    isActive: true,
    ...buildBottleFilters(filters),
  };

  const [bottles, total] = await Promise.all([
    prisma.bottle.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatarUrl: true,
            level: true,
            isVerified: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
            discoveries: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.bottle.count({ where }),
  ]);

  return {
    data: bottles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

export async function discoverBottle(
  userId: string,
  bottleId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // 创建发现记录
    await tx.discovery.create({
      data: {
        userId,
        bottleId,
      },
    });

    // 更新用户统计
    await tx.userStats.update({
      where: { userId },
      data: {
        bottlesDiscovered: { increment: 1 },
      },
    });

    // 检查成就
    await checkAndUnlockAchievements(tx, userId, "discovery_count");
  });
}

export async function likeBottle(
  userId: string,
  bottleId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // 创建点赞记录
    await tx.bottleLike.create({
      data: {
        userId,
        bottleId,
      },
    });

    // 更新漂流瓶统计
    await tx.bottle.update({
      where: { id: bottleId },
      data: { likeCount: { increment: 1 } },
    });

    // 更新用户统计
    await tx.userStats.update({
      where: { userId },
      data: {
        likesGiven: { increment: 1 },
      },
    });

    // 获取漂流瓶作者并更新其统计
    const bottle = await tx.bottle.findUnique({
      where: { id: bottleId },
      select: { userId: true },
    });

    if (bottle) {
      await tx.userStats.update({
        where: { userId: bottle.userId },
        data: {
          likesReceived: { increment: 1 },
        },
      });

      // 检查作者的成就
      await checkAndUnlockAchievements(tx, bottle.userId, "likes_received");
    }
  });
}

export async function unlikeBottle(
  userId: string,
  bottleId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // 删除点赞记录
    await tx.bottleLike.delete({
      where: {
        userId_bottleId: {
          userId,
          bottleId,
        },
      },
    });

    // 更新漂流瓶统计
    await tx.bottle.update({
      where: { id: bottleId },
      data: { likeCount: { decrement: 1 } },
    });

    // 更新用户统计
    await tx.userStats.update({
      where: { userId },
      data: {
        likesGiven: { decrement: 1 },
      },
    });

    // 获取漂流瓶作者并更新其统计
    const bottle = await tx.bottle.findUnique({
      where: { id: bottleId },
      select: { userId: true },
    });

    if (bottle) {
      await tx.userStats.update({
        where: { userId: bottle.userId },
        data: {
          likesReceived: { decrement: 1 },
        },
      });
    }
  });
}

export async function createReply(
  userId: string,
  data: CreateReplyData
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // 创建回复
    await tx.reply.create({
      data: {
        userId,
        bottleId: data.bottleId,
        content: data.content,
        mediaType: data.mediaType || MediaType.TEXT,
        mediaUrl: data.mediaUrl,
      },
    });

    // 更新漂流瓶统计
    await tx.bottle.update({
      where: { id: data.bottleId },
      data: { replyCount: { increment: 1 } },
    });

    // 更新用户统计
    await tx.userStats.update({
      where: { userId },
      data: {
        repliesSent: { increment: 1 },
      },
    });

    // 获取漂流瓶作者并更新其统计
    const bottle = await tx.bottle.findUnique({
      where: { id: data.bottleId },
      select: { userId: true },
    });

    if (bottle) {
      await tx.userStats.update({
        where: { userId: bottle.userId },
        data: {
          repliesReceived: { increment: 1 },
        },
      });
    }

    // 检查成就
    await checkAndUnlockAchievements(tx, userId, "replies_sent");
  });
}

// ==================== 成就系统查询 ====================

export async function getUserAchievements(
  userId: string
): Promise<AchievementWithProgress[]> {
  const achievements = await prisma.achievement.findMany({
    where: { isActive: true },
    include: {
      userAchievements: {
        where: { userId },
        take: 1,
      },
    },
    orderBy: [{ category: "asc" }, { rarity: "asc" }, { points: "asc" }],
  });

  return achievements.map((achievement) => ({
    ...achievement,
    userAchievement: achievement.userAchievements[0] || undefined,
    isUnlocked: achievement.userAchievements.length > 0,
    progress: achievement.userAchievements[0]?.progress || 0,
  }));
}

export async function checkAndUnlockAchievements(
  tx: Prisma.TransactionClient,
  userId: string,
  triggerType: string
): Promise<void> {
  // 获取用户统计数据
  const userStats = await tx.userStats.findUnique({
    where: { userId },
  });

  if (!userStats) return;

  // 获取相关的成就
  const achievements = await tx.achievement.findMany({
    where: {
      isActive: true,
      userAchievements: {
        none: { userId },
      },
    },
  });

  // 检查每个成就
  for (const achievement of achievements) {
    const requirement = achievement.requirement as any;

    if (requirement.type === triggerType) {
      let currentValue = 0;

      switch (requirement.type) {
        case "discovery_count":
          currentValue = userStats.bottlesDiscovered;
          break;
        case "bottle_created":
          currentValue = userStats.bottlesCreated;
          break;
        case "likes_received":
          currentValue = userStats.likesReceived;
          break;
        case "followers_count":
          currentValue = userStats.followersCount;
          break;
        case "replies_sent":
          currentValue = userStats.repliesSent;
          break;
        case "daily_streak":
          currentValue = userStats.dailyStreak;
          break;
      }

      // 检查是否达到要求
      if (currentValue >= requirement.value) {
        // 解锁成就
        await tx.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            progress: 1.0,
          },
        });

        // 更新用户经验和成就计数
        await tx.user.update({
          where: { id: userId },
          data: {
            experience: { increment: achievement.points },
          },
        });

        await tx.userStats.update({
          where: { userId },
          data: {
            achievementsCount: { increment: 1 },
          },
        });

        // 创建通知
        await tx.notification.create({
          data: {
            userId,
            type: "ACHIEVEMENT_UNLOCKED",
            title: "🏆 成就解锁！",
            content: `恭喜您解锁了「${achievement.name}」成就！`,
            data: {
              achievementId: achievement.id,
              achievementName: achievement.name,
              points: achievement.points,
            },
          },
        });
      }
    }
  }
}

// ==================== 工具函数 ====================

function buildBottleFilters(filters: BottleFilters): Prisma.BottleWhereInput {
  const where: Prisma.BottleWhereInput = {};

  if (filters.mediaType) {
    where.mediaType = filters.mediaType;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.tags && filters.tags.length > 0) {
    where.tags = {
      some: {
        tagId: { in: filters.tags },
      },
    };
  }

  if (filters.search) {
    where.content = {
      contains: filters.search,
      mode: "insensitive",
    };
  }

  if (filters.hasLocation !== undefined) {
    if (filters.hasLocation) {
      where.OR = [
        { latitude: { not: null } },
        { longitude: { not: null } },
        { location: { not: null } },
      ];
    } else {
      where.AND = [{ latitude: null }, { longitude: null }, { location: null }];
    }
  }

  if (filters.dateFrom) {
    where.createdAt = { gte: filters.dateFrom };
  }

  if (filters.dateTo) {
    where.createdAt = {
      ...where.createdAt,
      lte: filters.dateTo,
    };
  }

  return where;
}

function calculateExpForLevel(level: number): number {
  // 指数增长公式：下一级所需经验 = 100 * (level ^ 1.5)
  return Math.floor(100 * Math.pow(level, 1.5));
}

// ==================== 标签查询 ====================

export async function getAllTags(): Promise<any[]> {
  return await prisma.tag.findMany({
    where: { isActive: true },
    orderBy: { usageCount: "desc" },
  });
}

export async function getPopularTags(limit: number = 10): Promise<any[]> {
  return await prisma.tag.findMany({
    where: { isActive: true },
    orderBy: { usageCount: "desc" },
    take: limit,
  });
}
