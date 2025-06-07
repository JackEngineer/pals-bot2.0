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
 * 添加用户
 * @param user 用户信息
 * @returns 用户信息
 */
export async function addUser(user: User): Promise<UserWithRelations> {
  const validatedUser = UserSchema.parse(user);
  return await prisma.user.create({
    data: {
      ...validatedUser
    }
  });
}
