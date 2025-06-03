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
