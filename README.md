# Pals Bot 2.0 - Telegram 漂流瓶 Mini App

> 🚀 基于 Next.js 和 Telegram Mini App 平台打造的现代化漂流瓶应用

## 📖 项目概述

Pals Bot 2.0 是一个运行在 Telegram 生态内的漂流瓶应用，让用户可以投递匿名消息、发现他人的心声，在数字海洋中寻找心灵共鸣。通过 Telegram Mini App 技术，用户无需下载额外应用即可享受流畅的交互体验。

### 🎯 核心功能

- **📝 消息投递**: 用户可以编写文字、图片、语音消息投入漂流瓶
- **🌊 漂流发现**: 随机获取其他用户投递的漂流瓶消息
- **💌 私信回复**: 对感兴趣的漂流瓶进行匿名回复
- **🎨 个性装饰**: 自定义漂流瓶外观和消息样式
- **📊 统计面板**: 查看投递、收到、回复等数据统计
- **🔒 隐私保护**: 完全匿名，保护用户隐私安全

## 🏗️ 技术架构

### 前端技术栈

```typescript
Frontend Framework: Next.js 14 (App Router)
Language: TypeScript
Styling: Tailwind CSS + Shadcn/ui
State Management: Zustand
Telegram Integration: @telegram-apps/sdk-react
UI Components: Framer Motion (动画)
Development: ESLint + Prettier + Husky
```

### 后端技术栈

```typescript
Runtime: Node.js (Vercel Serverless Functions)
Database: Neon PostgreSQL (Serverless)
ORM: Prisma
Authentication: Telegram InitData 验证
File Storage: Vercel Blob (图片/语音)
Cache: Upstash Redis (可选)
```

### 基础设施

```yaml
Hosting: Vercel (零配置部署)
Domain: Vercel 免费域名 (支持自定义域名)
SSL: 自动 HTTPS 证书
CDN: Vercel Edge Network
Analytics: Vercel Analytics + Sentry
```

## 🎨 系统设计

### 数据库设计

```sql
-- 用户表
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 漂流瓶表
CREATE TABLE bottles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  content TEXT NOT NULL,
  media_type VARCHAR(50), -- 'text', 'image', 'audio'
  media_url TEXT,
  bottle_style JSONB, -- 瓶子外观配置
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 发现记录表
CREATE TABLE discoveries (
  id SERIAL PRIMARY KEY,
  bottle_id INTEGER REFERENCES bottles(id),
  discoverer_id INTEGER REFERENCES users(id),
  discovered_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(bottle_id, discoverer_id)
);

-- 回复表
CREATE TABLE replies (
  id SERIAL PRIMARY KEY,
  bottle_id INTEGER REFERENCES bottles(id),
  from_user_id INTEGER REFERENCES users(id),
  to_user_id INTEGER REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API 设计

```typescript
// RESTful API 端点
POST   /api/auth/login          # Telegram 用户认证
GET    /api/bottles/random      # 获取随机漂流瓶
POST   /api/bottles             # 投递新漂流瓶
POST   /api/bottles/:id/reply   # 回复漂流瓶
GET    /api/user/statistics     # 用户数据统计
POST   /api/upload              # 媒体文件上传
```

## 🔧 开发环境设置

### 环境要求

- Node.js 18+
- npm/yarn/pnpm
- Git

### 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/pals-bot2.0.git
cd pals-bot2.0

# 2. 安装依赖
npm install

# 3. 环境配置
cp .env.example .env.local
# 编辑 .env.local 文件，填入必要的环境变量

# 4. 数据库设置
npx prisma db push
npx prisma generate

# 5. 启动开发服务器
npm run dev
```

### 环境变量配置

```env
# Telegram Bot 配置
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret

# 数据库配置
DATABASE_URL=your_neon_database_url

# Vercel Blob 存储
BLOB_READ_WRITE_TOKEN=your_blob_token

# 可选：Redis 缓存
REDIS_URL=your_upstash_redis_url

# 应用配置
NEXTAUTH_SECRET=your_nextauth_secret
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 🚀 部署策略

### Vercel 部署流程

```yaml
# vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "functions": { "app/api/**/*.ts": { "maxDuration": 30 } },
  "env":
    {
      "TELEGRAM_BOT_TOKEN": "@telegram_bot_token",
      "DATABASE_URL": "@database_url",
    },
}
```

### 自动化部署

1. **GitHub Actions CI/CD**

```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
```

2. **数据库迁移**

```bash
# 生产环境数据库迁移
npx prisma db push --accept-data-loss
```

## 🔒 安全考虑

### Telegram InitData 验证

本项目实现了完整的 Telegram InitData 验证系统，确保用户身份的真实性和数据的安全性。

#### 核心组件

1. **验证工具库** (`lib/telegram-auth.ts`)

   - InitData 解析和验证
   - HMAC-SHA256 签名验证
   - 时间戳有效性检查

2. **API 路由** (`app/api/auth/telegram/route.ts`)

   - RESTful 身份验证端点
   - 环境变量配置检查
   - 详细的错误响应

3. **React Hook** (`hooks/useTelegramAuth.ts`)

   - 自动身份验证
   - 状态管理
   - 错误处理

4. **UI 组件** (`components/TelegramAuth.tsx`)
   - 美观的认证状态展示
   - 用户信息显示
   - 交互式操作

#### 验证流程

```typescript
// 1. 核心验证函数
import { verifyTelegramAuth } from "@/lib/telegram-auth";

export async function authenticateUser(initData: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN!;
  const result = verifyTelegramAuth(initData, botToken);

  if (!result.isValid) {
    throw new Error(result.error || "认证失败");
  }

  return result.user;
}

// 2. API 路由验证
// /app/api/auth/telegram/route.ts
export async function POST(request: NextRequest) {
  const { initData } = await request.json();
  const verification = verifyTelegramAuth(initData, botToken);

  if (!verification.isValid) {
    return NextResponse.json(
      {
        error: verification.error,
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user: verification.user,
    message: "身份验证成功",
  });
}

// 3. 前端 Hook 使用
import { useTelegramAuth } from "@/hooks/useTelegramAuth";

function AuthComponent() {
  const {
    isLoading,
    isAuthenticated,
    user,
    error,
    authenticate,
    logout,
    clearError,
  } = useTelegramAuth();

  if (isAuthenticated) {
    return (
      <div>
        <h1>欢迎, {user?.first_name}!</h1>
        <button onClick={logout}>登出</button>
      </div>
    );
  }

  return <div>认证失败: {error}</div>;
}

// 4. 使用认证组件
import TelegramAuth from "@/components/TelegramAuth";

function App() {
  return (
    <div>
      <TelegramAuth />
    </div>
  );
}
```

#### 安全特性

- **HMAC-SHA256 验证**: 使用 Telegram Bot Token 验证数据完整性和来源
- **时间戳检查**: 防止重放攻击，默认 5 分钟有效期（可配置）
- **数据解析验证**: 严格验证 InitData 格式和必要字段
- **错误处理**: 详细的错误分类和用户友好的提示信息
- **类型安全**: 完整的 TypeScript 类型定义

#### 功能特点

- **自动认证**: 应用启动时自动获取 Telegram InitData 并验证
- **手动重试**: 提供重新认证和错误清除功能
- **美观界面**: 响应式设计，适配移动端和桌面端
- **状态管理**: 完整的加载、成功、失败状态处理
- **用户信息**: 展示头像、姓名、用户名等完整信息

#### 开发测试

访问 `/test` 页面可以在开发环境中测试认证功能：

```bash
# 启动开发服务器
npm run dev

# 访问测试页面
http://localhost:3000/test
```

测试页面功能：

- **自动认证状态检查**: 实时显示当前认证状态
- **手动测试**: 支持输入自定义 InitData 进行测试
- **模拟数据**: 生成测试用的模拟 InitData
- **API 文档**: 显示详细的 API 端点信息
- **环境检查**: 检测 Telegram WebApp SDK 加载状态

### 用户认证安全

```typescript
// 认证中间件示例
export async function authMiddleware(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401 });
  }

  const initData = authHeader.replace("Bearer ", "");
  const validation = validateTelegramInitData(
    initData,
    process.env.TELEGRAM_BOT_TOKEN!
  );

  if (!validation.isValid) {
    return new Response("Invalid authentication", { status: 401 });
  }

  // 继续处理请求
  return NextResponse.next();
}
```

### 数据安全

- **匿名化处理**: 所有漂流瓶内容与用户身份完全分离
- **InitData 验证**: 确保请求来自真实的 Telegram 用户
- **内容审核**: 实现基础的内容过滤和举报机制
- **速率限制**: 防止恶意刷屏和垃圾信息
- **数据加密**: 敏感数据在数据库中加密存储

## ⚡ 性能优化

### 前端优化

```typescript
// 1. 代码分割和懒加载
const BottleEditor = dynamic(() => import("@/components/BottleEditor"), {
  loading: () => <BottleEditorSkeleton />,
});

// 2. 图片优化
import { Image } from "next/image";
<Image
  src={bottleImage}
  alt="漂流瓶"
  width={300}
  height={300}
  priority={false}
  placeholder="blur"
/>;

// 3. 缓存策略
const SWR_CONFIG = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 10000,
};
```

### 后端优化

```typescript
// 1. 数据库查询优化
const bottles = await prisma.bottle.findMany({
  select: { id: true, content: true, created_at: true },
  where: { is_active: true },
  orderBy: { created_at: "desc" },
  take: 10,
});

// 2. Redis 缓存
const cachedBottle = await redis.get(`bottle:${id}`);
if (cachedBottle) return JSON.parse(cachedBottle);
```

## 🧪 测试策略

### 测试覆盖

```typescript
// 1. 单元测试 (Jest)
describe("BottleService", () => {
  test("should create bottle successfully", async () => {
    const bottle = await BottleService.create(mockBottleData);
    expect(bottle.id).toBeDefined();
  });
});

// 2. 集成测试 (Playwright)
test("user can discover and reply to bottles", async ({ page }) => {
  await page.goto("/discover");
  await page.click('[data-testid="discover-button"]');
  await page.fill('[data-testid="reply-input"]', "Hello from test!");
});

// 3. Telegram Mini App 测试
// 使用 Eruda 在移动端调试
```

## 📊 监控和分析

### 应用监控

```typescript
// Sentry 错误监控
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
});

// 自定义埋点
export function trackBottleCreated(userId: string) {
  analytics.track("Bottle Created", {
    userId,
    timestamp: new Date().toISOString(),
  });
}
```

### 业务指标

- **DAU/MAU**: 日活跃/月活跃用户数
- **投递率**: 用户投递漂流瓶的频率
- **发现率**: 漂流瓶被发现的概率
- **回复率**: 用户回复漂流瓶的比例
- **留存率**: 用户在不同时间段的留存情况

## 🔮 未来规划

### Phase 1: 核心功能 (MVP)

- [x] 基础漂流瓶投递和发现
- [x] 简单的回复功能
- [x] Telegram 集成

### Phase 2: 增强体验

- [ ] 多媒体内容支持 (图片、语音)
- [ ] 漂流瓶装饰和主题
- [ ] 用户统计面板
- [ ] 内容举报系统

### Phase 3: 社交功能

- [ ] 好友系统 (基于 Telegram 联系人)
- [ ] 群组漂流瓶
- [ ] 漂流瓶收藏功能
- [ ] 心情标签和筛选

### Phase 4: 高级功能

- [ ] AI 内容推荐
- [ ] 地理位置漂流瓶
- [ ] 定时投递功能
- [ ] 多语言支持

## 🤝 贡献指南

### 开发流程

1. Fork 项目到个人仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 代码规范

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:e2e": "playwright test"
  }
}
```

## 📞 联系方式

- **项目仓库**: [GitHub Repository](https://github.com/yourusername/pals-bot2.0)
- **问题反馈**: [Issues](https://github.com/yourusername/pals-bot2.0/issues)
- **讨论交流**: [Discussions](https://github.com/yourusername/pals-bot2.0/discussions)

## 📄 许可证

本项目采用 [MIT License](./LICENSE) 开源协议。

---

_让每一个漂流瓶都承载着真诚的心意，在数字海洋中寻找共鸣。_ 🌊

## 📚 相关资源

- [Telegram Mini Apps 官方文档](https://core.telegram.org/bots/webapps)
- [Next.js 文档](https://nextjs.org/docs)
- [Vercel 部署指南](https://vercel.com/docs)
- [Prisma 数据库工具](https://www.prisma.io/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)
