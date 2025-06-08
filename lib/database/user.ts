import { prisma } from "@/lib/prisma";
import type { User, UserWithRelations } from "@/lib/types/database";
import { z } from "zod";

const UserSchema = z.object({
  telegramId: z
    .union([z.string(), z.number(), z.bigint()])
    .transform((v) => BigInt(v)),
  firstName: z.string(),
  lastName: z.string(),
  username: z.string(),
});

/**
 * 根据 telegramId 获取用户信息
 * @param telegramId telegramId
 * @returns 用户信息
 */
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

/**
 * 添加用户（如果已存在则更新）
 * @param user 用户信息
 * @returns 用户信息
 */
export async function addUser(user: User): Promise<UserWithRelations> {
  const validatedUser = UserSchema.parse(user);

  try {
    // 尝试创建新用户
    return await prisma.user.create({
      data: {
        ...validatedUser,
        settings: {
          create: {
            contentLanguage: "zh",
            allowDiscovery: true,
            allowDirectMessages: true,
            showOnlineStatus: true,
            allowFollow: true,
            notifyOnNewFollower: true,
            notifyOnBottleReply: true,
            notifyOnBottleLike: true,
            notifyOnDirectMessage: true,
            notifyOnAchievement: true,
            adultContentFilter: true,
          },
        },
        stats: {
          create: {
            bottlesCreated: 0,
            bottlesDiscovered: 0,
            repliesReceived: 0,
            repliesSent: 0,
            likesReceived: 0,
            likesGiven: 0,
            followersCount: 0,
            followingCount: 0,
            achievementsCount: 0,
            dailyStreak: 0,
            longestStreak: 0,
          },
        },
      },
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
  } catch (error: any) {
    // 如果是唯一约束错误，说明用户已存在，执行更新操作
    if (error.code === "P2002" && error.meta?.target?.includes("telegramId")) {
      return await prisma.user.update({
        where: { telegramId: validatedUser.telegramId },
        data: {
          firstName: validatedUser.firstName,
          lastName: validatedUser.lastName,
          username: validatedUser.username,
          updatedAt: new Date(),
        },
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

    // 如果不是唯一约束错误，重新抛出异常
    throw error;
  }
}
