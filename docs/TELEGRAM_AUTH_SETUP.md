# Telegram InitData 身份验证设置指南

## 📋 概述

本指南详细说明如何在 Pals Bot 2.0 中设置和使用 Telegram InitData 身份验证系统。

## 🚀 快速开始

### 1. 环境配置

确保您的 `.env.local` 文件包含以下环境变量：

```env
# 必需：Telegram Bot Token
TELEGRAM_BOT_TOKEN=7247001413:AAEOTpe1PSpw_ile6lBKG1RirUEqvWMClic

# 可选：应用 URL
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 2. 获取 Telegram Bot Token

1. 在 Telegram 中联系 [@BotFather](https://t.me/BotFather)
2. 使用 `/newbot` 命令创建新的 bot
3. 按照提示设置 bot 名称和用户名
4. 复制返回的 token 到环境变量中

### 3. 启动开发服务器

```bash
npm install
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看主页
访问 [http://localhost:3000/test](http://localhost:3000/test) 进行认证测试

## 🏗️ 架构说明

### 核心文件结构

```
lib/
├── telegram-auth.ts          # 验证工具函数
app/
├── api/
│   └── auth/
│       └── telegram/
│           └── route.ts      # 认证 API 端点
hooks/
├── useTelegramAuth.ts        # 认证 React Hook
components/
├── TelegramAuth.tsx          # 认证 UI 组件
app/
├── page.tsx                  # 主页面
└── test/
    └── page.tsx             # 测试页面
```

### 数据流

```
Telegram WebApp → InitData → useTelegramAuth Hook → API验证 → 用户状态更新
```

## 🔧 API 端点

### POST /api/auth/telegram

**请求体：**

```json
{
  "initData": "query_id=AAE...&user=%7B%22id%22%3A123...&auth_date=1699123456&hash=abc123..."
}
```

**成功响应：**

```json
{
  "success": true,
  "user": {
    "id": 123456789,
    "first_name": "用户名",
    "last_name": "姓氏",
    "username": "username",
    "language_code": "zh-CN",
    "is_premium": false,
    "photo_url": "https://..."
  },
  "message": "身份验证成功"
}
```

**错误响应：**

```json
{
  "error": "签名验证失败"
}
```

## 📝 使用示例

### 基础使用

```tsx
import TelegramAuth from "@/components/TelegramAuth";

export default function App() {
  return (
    <div>
      <h1>我的应用</h1>
      <TelegramAuth />
    </div>
  );
}
```

### 高级使用

```tsx
import { useTelegramAuth } from "@/hooks/useTelegramAuth";

export default function CustomAuth() {
  const { isLoading, isAuthenticated, user, error, authenticate, logout } =
    useTelegramAuth();

  if (isLoading) {
    return <div>验证中...</div>;
  }

  if (isAuthenticated && user) {
    return (
      <div>
        <img src={user.photo_url} alt={user.first_name} />
        <h2>
          {user.first_name} {user.last_name}
        </h2>
        <p>@{user.username}</p>
        <button onClick={logout}>登出</button>
      </div>
    );
  }

  return (
    <div>
      <p>认证失败: {error}</p>
      <button onClick={() => authenticate("manual_init_data")}>手动认证</button>
    </div>
  );
}
```

### 受保护的路由

```tsx
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedPage() {
  const { isAuthenticated, isLoading } = useTelegramAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <div>验证中...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <h1>受保护的内容</h1>
      {/* 只有认证用户才能看到 */}
    </div>
  );
}
```

## 🔒 安全最佳实践

### 1. 环境变量安全

- 永远不要在前端代码中暴露 `TELEGRAM_BOT_TOKEN`
- 使用 `.env.local` 存储敏感信息
- 在生产环境中使用 Vercel 环境变量管理

### 2. 验证时效性

```typescript
// 自定义验证有效期（默认 5 分钟）
const result = verifyTelegramAuth(initData, botToken, 300); // 5分钟
```

### 3. 错误处理

```typescript
try {
  const result = await authenticate(initData);
  if (result.success) {
    // 处理成功认证
  }
} catch (error) {
  console.error("认证失败:", error);
  // 处理认证错误
}
```

## 🧪 测试指南

### 开发环境测试

1. 访问 `/test` 页面
2. 检查自动认证状态
3. 使用"生成模拟数据"按钮创建测试数据
4. 验证 API 响应

### 生产环境测试

1. 在 Telegram 中创建 Mini App
2. 设置正确的 Web App URL
3. 在真实 Telegram 环境中测试
4. 验证用户信息获取和显示

### 测试用例

```typescript
// 单元测试示例
import { verifyTelegramAuth } from "@/lib/telegram-auth";

describe("Telegram Auth", () => {
  test("应该验证有效的 InitData", () => {
    const validInitData = "query_id=...&user=...&auth_date=...&hash=...";
    const result = verifyTelegramAuth(validInitData, "valid_token");
    expect(result.isValid).toBe(true);
  });

  test("应该拒绝无效的签名", () => {
    const invalidInitData = "query_id=...&user=...&auth_date=...&hash=invalid";
    const result = verifyTelegramAuth(invalidInitData, "valid_token");
    expect(result.isValid).toBe(false);
  });
});
```

## 🚀 部署配置

### Vercel 部署

1. 在 Vercel 项目设置中添加环境变量：

   - `TELEGRAM_BOT_TOKEN`
   - `NEXT_PUBLIC_APP_URL`

2. 确保 API 路由正确配置：

```json
// vercel.json
{
  "functions": {
    "app/api/**/*.ts": { "maxDuration": 30 }
  }
}
```

### Telegram Mini App 配置

1. 在 [@BotFather](https://t.me/BotFather) 中配置 Web App URL
2. 使用 `/setmenubutton` 设置菜单按钮
3. 测试 Mini App 启动和认证流程

## 🐛 常见问题

### Q: 认证失败，显示"签名验证失败"

**A:** 检查以下项目：

- `TELEGRAM_BOT_TOKEN` 是否正确设置
- InitData 是否来自真实的 Telegram 环境
- 服务器时间是否准确（影响时间戳验证）

### Q: 在开发环境中无法获取 InitData

**A:**

- 使用 `/test` 页面进行测试
- 检查 Telegram WebApp SDK 是否正确加载
- 确保在真实的 Telegram 环境中运行

### Q: 用户信息不完整

**A:**

- 确认用户已设置相关信息（用户名、头像等）
- 检查 Telegram 隐私设置
- 验证 InitData 解析是否正确

## 📚 参考资料

- [Telegram Mini Apps 官方文档](https://core.telegram.org/bots/webapps)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Next.js API 路由](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Vercel 环境变量](https://vercel.com/docs/concepts/projects/environment-variables)

---

💡 **提示**: 如果遇到问题，请查看浏览器控制台和服务器日志获取详细错误信息。
