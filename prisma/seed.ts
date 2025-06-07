import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 开始种子数据播种...");

  // 1. 创建测试用户
  const users = await Promise.all([
    prisma.user.upsert({
      where: { telegramId: 100001 },
      update: {},
      create: {
        telegramId: 100001,
        firstName: "小明",
        lastName: "张",
        username: "xiaoming",
        languageCode: "zh",
      },
    }),
    prisma.user.upsert({
      where: { telegramId: 100002 },
      update: {},
      create: {
        telegramId: 100002,
        firstName: "小红",
        username: "xiaohong",
        languageCode: "zh",
      },
    }),
    prisma.user.upsert({
      where: { telegramId: 100003 },
      update: {},
      create: {
        telegramId: 100003,
        firstName: "Alice",
        username: "alice",
        languageCode: "en",
      },
    }),
  ]);

  console.log(`✅ 创建了 ${users.length} 个用户`);

  // 2. 创建示例漂流瓶
  const bottles = [
    {
      content: "今天的夕阳特别美，想和大家分享这份美好 🌅",
      mediaType: "TEXT" as const,
      bottleStyle: {
        color: "ocean",
        pattern: "waves",
        decoration: "stars",
      },
    },
    {
      content: "刚刚听了一首很棒的歌，心情变得超级好！音乐真的有治愈的力量 🎵",
      mediaType: "TEXT" as const,
      bottleStyle: {
        color: "deepblue",
        pattern: "gradient",
        decoration: "hearts",
      },
    },
    {
      content:
        "在图书馆学习的午后，阳光透过窗户洒在书页上，这就是我喜欢的宁静时光 📚",
      mediaType: "TEXT" as const,
      bottleStyle: {
        color: "teal",
        pattern: "solid",
        decoration: "bubbles",
      },
    },
    {
      content:
        "Hello from the other side of the world! 🌍 Hope everyone is having a great day!",
      mediaType: "TEXT" as const,
      bottleStyle: {
        color: "cyan",
        pattern: "striped",
        decoration: "waves",
      },
    },
    {
      content:
        "刚做了一道新菜，味道还不错！有时候自己动手做饭真的很有成就感 👨‍🍳",
      mediaType: "TEXT" as const,
      bottleStyle: {
        color: "ocean",
        pattern: "dotted",
        decoration: "stars",
      },
    },
  ];

  const createdBottles = [];
  for (let i = 0; i < bottles.length; i++) {
    const bottle = await prisma.bottle.create({
      data: {
        ...bottles[i],
        userId: users[i % users.length].id, // 轮流分配给不同用户
      },
    });
    createdBottles.push(bottle);
  }

  console.log(`✅ 创建了 ${createdBottles.length} 个漂流瓶`);

  // 3. 创建一些回复
  const replies = [
    {
      bottleId: createdBottles[0].id,
      userId: users[1].id,
      content: "确实很美！我也喜欢看夕阳 🌇",
    },
    {
      bottleId: createdBottles[0].id,
      userId: users[2].id,
      content: "Beautiful sunset! Thanks for sharing ☀️",
    },
    {
      bottleId: createdBottles[1].id,
      userId: users[0].id,
      content: "能分享一下是什么歌吗？",
    },
    {
      bottleId: createdBottles[2].id,
      userId: users[2].id,
      content: "I love reading in libraries too! So peaceful 📖",
    },
  ];

  const createdReplies = await Promise.all(
    replies.map((reply) => prisma.reply.create({ data: reply }))
  );

  console.log(`✅ 创建了 ${createdReplies.length} 个回复`);

  // 4. 创建一些发现记录
  const discoveries = [
    { userId: users[0].id, bottleId: createdBottles[1].id },
    { userId: users[0].id, bottleId: createdBottles[2].id },
    { userId: users[1].id, bottleId: createdBottles[0].id },
    { userId: users[1].id, bottleId: createdBottles[3].id },
    { userId: users[2].id, bottleId: createdBottles[0].id },
    { userId: users[2].id, bottleId: createdBottles[2].id },
  ];

  const createdDiscoveries = await Promise.all(
    discoveries.map((discovery) => prisma.discovery.create({ data: discovery }))
  );

  console.log(`✅ 创建了 ${createdDiscoveries.length} 个发现记录`);

  // 5. 显示统计信息
  const totalUsers = await prisma.user.count();
  const totalBottles = await prisma.bottle.count();
  const totalReplies = await prisma.reply.count();
  const totalDiscoveries = await prisma.discovery.count();

  console.log("\n📊 数据库统计:");
  console.log(`👥 用户总数: ${totalUsers}`);
  console.log(`🍾 漂流瓶总数: ${totalBottles}`);
  console.log(`💬 回复总数: ${totalReplies}`);
  console.log(`🔍 发现记录总数: ${totalDiscoveries}`);

  console.log("\n🎉 种子数据播种完成!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ 种子数据播种失败:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
