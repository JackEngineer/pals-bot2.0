import {
  PrismaClient,
  AchievementCategory,
  AchievementRarity,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌊 开始初始化漂流瓶应用数据...");

  // 初始化标签系统
  console.log("📱 创建初始标签...");
  const tags = await Promise.all([
    // 情感类标签
    prisma.tag.upsert({
      where: { name: "心情日记" },
      update: {},
      create: {
        name: "心情日记",
        description: "记录日常心情和感受",
        color: "#F59E0B",
      },
    }),
    prisma.tag.upsert({
      where: { name: "深夜想法" },
      update: {},
      create: {
        name: "深夜想法",
        description: "夜深人静时的思考",
        color: "#6366F1",
      },
    }),
    prisma.tag.upsert({
      where: { name: "治愈系" },
      update: {},
      create: {
        name: "治愈系",
        description: "温暖人心的内容",
        color: "#10B981",
      },
    }),
    prisma.tag.upsert({
      where: { name: "励志正能量" },
      update: {},
      create: {
        name: "励志正能量",
        description: "积极向上的内容",
        color: "#EF4444",
      },
    }),

    // 内容类型标签
    prisma.tag.upsert({
      where: { name: "故事分享" },
      update: {},
      create: {
        name: "故事分享",
        description: "有趣的故事和经历",
        color: "#8B5CF6",
      },
    }),
    prisma.tag.upsert({
      where: { name: "音乐推荐" },
      update: {},
      create: {
        name: "音乐推荐",
        description: "分享喜欢的音乐",
        color: "#EC4899",
      },
    }),
    prisma.tag.upsert({
      where: { name: "书籍影视" },
      update: {},
      create: {
        name: "书籍影视",
        description: "读书观影心得",
        color: "#06B6D4",
      },
    }),
    prisma.tag.upsert({
      where: { name: "生活感悟" },
      update: {},
      create: {
        name: "生活感悟",
        description: "对生活的思考和感悟",
        color: "#84CC16",
      },
    }),

    // 主题类标签
    prisma.tag.upsert({
      where: { name: "爱情" },
      update: {},
      create: {
        name: "爱情",
        description: "关于爱情的话题",
        color: "#F472B6",
      },
    }),
    prisma.tag.upsert({
      where: { name: "友情" },
      update: {},
      create: {
        name: "友情",
        description: "友谊相关的内容",
        color: "#3B82F6",
      },
    }),
    prisma.tag.upsert({
      where: { name: "家庭" },
      update: {},
      create: {
        name: "家庭",
        description: "家庭生活和亲情",
        color: "#F97316",
      },
    }),
    prisma.tag.upsert({
      where: { name: "工作学习" },
      update: {},
      create: {
        name: "工作学习",
        description: "职场和学习相关",
        color: "#6B7280",
      },
    }),

    // 特殊标签
    prisma.tag.upsert({
      where: { name: "寻找共鸣" },
      update: {},
      create: {
        name: "寻找共鸣",
        description: "希望找到有同感的人",
        color: "#14B8A6",
      },
    }),
    prisma.tag.upsert({
      where: { name: "匿名倾诉" },
      update: {},
      create: {
        name: "匿名倾诉",
        description: "需要倾诉但不想暴露身份",
        color: "#64748B",
      },
    }),
    prisma.tag.upsert({
      where: { name: "海洋心情" },
      update: {},
      create: {
        name: "海洋心情",
        description: "如海洋般深邃的心情",
        color: "#0EA5E9",
      },
    }),
  ]);

  console.log(`✅ 创建了 ${tags.length} 个标签`);

  // 初始化成就系统
  console.log("🏆 创建成就系统...");

  const achievements = await Promise.all([
    // 社交类成就
    prisma.achievement.upsert({
      where: { name: "初次相遇" },
      update: {},
      create: {
        name: "初次相遇",
        description: "发现你的第一个漂流瓶",
        icon: "🍃",
        category: AchievementCategory.DISCOVERY,
        rarity: AchievementRarity.COMMON,
        requirement: { type: "discovery_count", value: 1 },
        points: 10,
      },
    }),
    prisma.achievement.upsert({
      where: { name: "海洋探索者" },
      update: {},
      create: {
        name: "海洋探索者",
        description: "发现10个漂流瓶",
        icon: "🔍",
        category: AchievementCategory.DISCOVERY,
        rarity: AchievementRarity.UNCOMMON,
        requirement: { type: "discovery_count", value: 10 },
        points: 50,
      },
    }),
    prisma.achievement.upsert({
      where: { name: "深海寻宝者" },
      update: {},
      create: {
        name: "深海寻宝者",
        description: "发现50个漂流瓶",
        icon: "💎",
        category: AchievementCategory.DISCOVERY,
        rarity: AchievementRarity.RARE,
        requirement: { type: "discovery_count", value: 50 },
        points: 200,
      },
    }),

    // 创作类成就
    prisma.achievement.upsert({
      where: { name: "初试啼声" },
      update: {},
      create: {
        name: "初试啼声",
        description: "投递你的第一个漂流瓶",
        icon: "✍️",
        category: AchievementCategory.CREATION,
        rarity: AchievementRarity.COMMON,
        requirement: { type: "bottle_created", value: 1 },
        points: 15,
      },
    }),
    prisma.achievement.upsert({
      where: { name: "故事诗人" },
      update: {},
      create: {
        name: "故事诗人",
        description: "投递10个漂流瓶",
        icon: "📝",
        category: AchievementCategory.CREATION,
        rarity: AchievementRarity.UNCOMMON,
        requirement: { type: "bottle_created", value: 10 },
        points: 75,
      },
    }),
    prisma.achievement.upsert({
      where: { name: "海洋作家" },
      update: {},
      create: {
        name: "海洋作家",
        description: "投递50个漂流瓶",
        icon: "🖊️",
        category: AchievementCategory.CREATION,
        rarity: AchievementRarity.EPIC,
        requirement: { type: "bottle_created", value: 50 },
        points: 300,
      },
    }),

    // 社交类成就
    prisma.achievement.upsert({
      where: { name: "首次点赞" },
      update: {},
      create: {
        name: "首次点赞",
        description: "收到第一个点赞",
        icon: "👍",
        category: AchievementCategory.SOCIAL,
        rarity: AchievementRarity.COMMON,
        requirement: { type: "likes_received", value: 1 },
        points: 10,
      },
    }),
    prisma.achievement.upsert({
      where: { name: "人气王" },
      update: {},
      create: {
        name: "人气王",
        description: "收到100个点赞",
        icon: "⭐",
        category: AchievementCategory.SOCIAL,
        rarity: AchievementRarity.RARE,
        requirement: { type: "likes_received", value: 100 },
        points: 250,
      },
    }),
    prisma.achievement.upsert({
      where: { name: "初识好友" },
      update: {},
      create: {
        name: "初识好友",
        description: "获得第一个关注者",
        icon: "👥",
        category: AchievementCategory.SOCIAL,
        rarity: AchievementRarity.UNCOMMON,
        requirement: { type: "followers_count", value: 1 },
        points: 30,
      },
    }),

    // 互动类成就
    prisma.achievement.upsert({
      where: { name: "积极回应者" },
      update: {},
      create: {
        name: "积极回应者",
        description: "发送10条回复",
        icon: "💬",
        category: AchievementCategory.ENGAGEMENT,
        rarity: AchievementRarity.UNCOMMON,
        requirement: { type: "replies_sent", value: 10 },
        points: 60,
      },
    }),
    prisma.achievement.upsert({
      where: { name: "沟通达人" },
      update: {},
      create: {
        name: "沟通达人",
        description: "发送50条回复",
        icon: "🗨️",
        category: AchievementCategory.ENGAGEMENT,
        rarity: AchievementRarity.RARE,
        requirement: { type: "replies_sent", value: 50 },
        points: 200,
      },
    }),

    // 里程碑成就
    prisma.achievement.upsert({
      where: { name: "坚持一周" },
      update: {},
      create: {
        name: "坚持一周",
        description: "连续活跃7天",
        icon: "📅",
        category: AchievementCategory.MILESTONE,
        rarity: AchievementRarity.UNCOMMON,
        requirement: { type: "daily_streak", value: 7 },
        points: 80,
      },
    }),
    prisma.achievement.upsert({
      where: { name: "忠实用户" },
      update: {},
      create: {
        name: "忠实用户",
        description: "连续活跃30天",
        icon: "🔥",
        category: AchievementCategory.MILESTONE,
        rarity: AchievementRarity.EPIC,
        requirement: { type: "daily_streak", value: 30 },
        points: 500,
      },
    }),
    prisma.achievement.upsert({
      where: { name: "海洋传说" },
      update: {},
      create: {
        name: "海洋传说",
        description: "连续活跃100天",
        icon: "👑",
        category: AchievementCategory.MILESTONE,
        rarity: AchievementRarity.LEGENDARY,
        requirement: { type: "daily_streak", value: 100 },
        points: 1000,
      },
    }),

    // 特殊成就
    prisma.achievement.upsert({
      where: { name: "夜猫子" },
      update: {},
      create: {
        name: "夜猫子",
        description: "在深夜（23:00-05:00）投递漂流瓶",
        icon: "🌙",
        category: AchievementCategory.SPECIAL,
        rarity: AchievementRarity.UNCOMMON,
        requirement: { type: "night_bottle", value: 1 },
        points: 40,
      },
    }),
    prisma.achievement.upsert({
      where: { name: "早起鸟儿" },
      update: {},
      create: {
        name: "早起鸟儿",
        description: "在清晨（05:00-07:00）投递漂流瓶",
        icon: "🌅",
        category: AchievementCategory.SPECIAL,
        rarity: AchievementRarity.UNCOMMON,
        requirement: { type: "morning_bottle", value: 1 },
        points: 40,
      },
    }),
    prisma.achievement.upsert({
      where: { name: "海洋之心" },
      update: {},
      create: {
        name: "海洋之心",
        description: "使用海洋主题投递第一个漂流瓶",
        icon: "💙",
        category: AchievementCategory.SPECIAL,
        rarity: AchievementRarity.RARE,
        requirement: { type: "ocean_themed_bottle", value: 1 },
        points: 100,
      },
    }),
    prisma.achievement.upsert({
      where: { name: "多媒体艺术家" },
      update: {},
      create: {
        name: "多媒体艺术家",
        description: "分别投递文字、图片和语音漂流瓶",
        icon: "🎨",
        category: AchievementCategory.SPECIAL,
        rarity: AchievementRarity.EPIC,
        requirement: { type: "multimedia_bottles", value: 3 },
        points: 300,
      },
    }),
  ]);

  console.log(`✅ 创建了 ${achievements.length} 个成就`);

  // 可选：创建一个系统用户用于系统消息
  const systemUser = await prisma.user.upsert({
    where: { telegramId: BigInt(0) },
    update: {},
    create: {
      telegramId: BigInt(0),
      firstName: "漂流瓶小助手",
      username: "bottle_assistant",
      bio: "我是漂流瓶应用的官方小助手，为您提供系统通知和帮助！",
      isVerified: true,
      level: 100,
      experience: 99999,
    },
  });

  console.log("🤖 创建了系统用户");

  // 为系统用户创建设置和统计
  await prisma.userSettings.upsert({
    where: { userId: systemUser.id },
    update: {},
    create: {
      userId: systemUser.id,
      allowDiscovery: false,
      allowDirectMessages: false,
      allowFollow: false,
    },
  });

  await prisma.userStats.upsert({
    where: { userId: systemUser.id },
    update: {},
    create: {
      userId: systemUser.id,
    },
  });

  console.log("🌊 数据初始化完成！");

  // 输出统计信息
  const tagCount = await prisma.tag.count();
  const achievementCount = await prisma.achievement.count();
  const userCount = await prisma.user.count();

  console.log("\n📊 数据库统计：");
  console.log(`- 标签数量: ${tagCount}`);
  console.log(`- 成就数量: ${achievementCount}`);
  console.log(`- 用户数量: ${userCount}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ 种子数据初始化失败:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
