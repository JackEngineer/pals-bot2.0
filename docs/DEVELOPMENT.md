# 开发指南

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 开发环境运行

```bash
npm run dev
```

应用会在 http://localhost:3000 启动

### 3. 在浏览器中测试

由于这是 Telegram Mini App，在普通浏览器中某些功能（如 Telegram 用户信息）会不可用，但基本界面和功能可以正常测试。

## 📱 在 Telegram 中测试

### 方式一：使用 VSCode Port Forwarding

1. 在 VSCode 中打开项目
2. 启动开发服务器：`npm run dev`
3. 打开 VSCode 终端，切换到 "PORTS" 标签
4. 添加端口 3000，设置为 Public
5. 复制生成的公共 URL（如：https://xxx-3000.app.github.dev）
6. 在 @BotFather 中配置这个 URL

### 方式二：使用 ngrok

```bash
# 安装 ngrok
npm install -g ngrok

# 启动开发服务器
npm run dev

# 在另一个终端中启动 ngrok
ngrok http 3000
```

复制 ngrok 提供的 HTTPS URL 到 @BotFather

### 方式三：使用 localtunnel

```bash
# 安装 localtunnel
npm install -g localtunnel

# 启动开发服务器
npm run dev

# 在另一个终端中启动 localtunnel
npx localtunnel --port 3000 --subdomain pals-bot
```

## 🤖 创建 Telegram Bot

1. 在 Telegram 中搜索 @BotFather
2. 发送 `/newbot`
3. 按照提示设置 bot 名称和用户名
4. 获得 Bot Token
5. 发送 `/newapp` 创建 Mini App
6. 选择刚创建的 bot
7. 设置 App URL 为你的开发环境 URL
8. 设置 App Name 和描述

## 🔧 项目结构

```
pals-bot2.0/
├── app/                    # Next.js App Router
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 主页面
├── public/                # 静态资源
├── package.json           # 依赖配置
├── next.config.js         # Next.js 配置
├── tailwind.config.js     # Tailwind 配置
├── tsconfig.json          # TypeScript 配置
└── vercel.json           # Vercel 部署配置
```

## 🎨 功能特性

### 当前实现的功能：

- ✅ 基础 UI 界面
- ✅ 发现随机漂流瓶
- ✅ 投递新漂流瓶
- ✅ Telegram WebApp 基础集成
- ✅ 响应式设计
- ✅ Telegram 主按钮集成

### 下一步计划：

- [ ] 后端 API 集成
- [ ] 数据库存储
- [ ] 用户认证
- [ ] 更多 UI 动画效果

## 🚀 部署到 Vercel

### 自动部署

1. 将代码推送到 GitHub
2. 在 Vercel 中连接 GitHub 仓库
3. Vercel 会自动检测 Next.js 项目并部署
4. 获得部署 URL，更新 @BotFather 中的 App URL

### 手动部署

```bash
# 安装 Vercel CLI
npm install -g vercel

# 部署
vercel

# 生产环境部署
vercel --prod
```

## 📝 注意事项

1. **HTTPS 要求**：Telegram Mini App 必须使用 HTTPS
2. **跨域问题**：确保正确配置了 CORS
3. **用户体验**：考虑 WebView 环境的性能限制
4. **测试覆盖**：在不同设备和 Telegram 客户端测试

# 开发模式说明

## 概述

Pals Bot 2.0 提供了完善的开发模式，让开发者可以在没有真实 Telegram 环境的情况下测试应用功能。

## 开发模式特性

### 自动检测

- 当 `NODE_ENV === 'development'` 或者运行在 `localhost` 时，应用会自动启用开发模式
- 开发模式下会显示 🚧 开发模式标识

### 模拟用户数据

```javascript
const MOCK_USER = {
  id: 123456789,
  first_name: "张",
  last_name: "三",
  username: "zhangsan",
  language_code: "zh",
  is_premium: false,
  photo_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan",
};
```

### 身份验证流程

1. **前端检测**：`useTelegramAuth` hook 会检测当前环境
2. **模拟登录**：如果不在真实 Telegram 环境中，会使用模拟数据
3. **API 后备**：API 端点也支持开发模式，提供多层后备机制

## 使用方法

### 启动开发服务器

```bash
npm run dev
# 或
pnpm dev
```

### 测试流程

1. 打开浏览器访问 `http://localhost:3000`
2. 看到开发模式标识后，等待自动身份验证
3. 验证成功后可以点击"进入应用"按钮
4. 进入仪表板页面测试功能

## 环境变量配置

### 可选配置

```env
# 如果有真实的 Telegram Bot Token，可以配置
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

### 开发模式下的行为

- **有 Bot Token**：优先使用真实验证，失败时降级到模拟数据
- **无 Bot Token**：直接使用模拟数据
- **网络错误**：自动降级到模拟数据

## 页面路由

- `/` - 主页（身份验证）
- `/dashboard` - 仪表板（需要登录）

## 开发提示

1. **热重载**：修改代码后页面会自动刷新
2. **状态保持**：开发模式下登录状态在页面刷新后会重新验证
3. **错误处理**：所有错误都有友好的降级处理
4. **网络模拟**：模拟了 1 秒的网络延迟，更接近真实环境

## 生产环境

在生产环境中，开发模式会自动禁用，只能通过真实的 Telegram WebApp 环境进行身份验证。
