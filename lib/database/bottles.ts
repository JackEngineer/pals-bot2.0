import { prisma } from "@/lib/prisma";
import type { Bottle } from "@/lib/types/database";
import { z } from "zod";

const CreateBottleSchema = z.object({
  userId: z.string().min(1, "用户ID不能为空"),
  content: z.string().min(1, "内容不能为空").max(1000, "内容不能超过1000字符"),
  mediaType: z.enum(["TEXT", "IMAGE", "AUDIO"]).optional().default("TEXT"),
  mediaUrl: z.string().url().optional(),
  bottleStyle: z
    .object({
      color: z.string(),
      pattern: z.string(),
      decoration: z.string(),
    })
    .optional(),
});

/**
 * 创建漂流瓶
 * @param bottle 漂流瓶信息
 * @returns 漂流瓶信息
 */
export async function createBottle(bottle: Bottle): Promise<any> {
  const normalized = normalizeBottleInput(bottle);
  const validatedBottle = CreateBottleSchema.parse(normalized);
  const newBottle = await prisma.bottle.create({
    data: validatedBottle,
  });
  return newBottle;
}

/**
 * 规范化前端传入的漂流瓶参数，自动修正类型和枚举
 */
export function normalizeBottleInput(input: any) {
  return {
    ...input,
    userId: input.userId ? String(input.userId) : undefined,
    mediaType: input.mediaType
      ? String(input.mediaType).toUpperCase()
      : undefined,
    mediaUrl:
      input.mediaUrl && isValidUrl(input.mediaUrl) ? input.mediaUrl : undefined,
  };
}

function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
