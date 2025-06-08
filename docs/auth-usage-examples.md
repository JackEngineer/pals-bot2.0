# 🔐 认证系统使用指南

## 📋 概述

项目现在配备了完整的认证系统，支持自动重定向、路由保护和用户状态管理。

## 🔧 已创建的文件

```
hooks/
  ├── useAuthRedirect.ts    # 简单重定向 Hook
  ├── useAuth.ts            # 增强版认证 Hook
  └── useUserStore.ts       # 用户状态管理 (已更新)

components/
  └── auth/
      └── AuthGuard.tsx     # 路由保护组件

lib/
  └── auth-config.ts        # 认证配置和工具
```

## 🚀 使用方式

### 1. 简单页面保护 - 使用 `useAuthRedirect`

```typescript
// app/home/page.tsx
"use client";

import { useAuthRedirect } from "@/hooks/useAuthRedirect";

export default function HomePage() {
  const { user, isAuthenticated } = useAuthRedirect();

  // 如果用户未登录，会自动跳转到 "/"
  if (!isAuthenticated) {
    return <div>重定向中...</div>;
  }

  return (
    <div>
      <h1>欢迎回来，{user?.firstName}！</h1>
      <p>这是受保护的主页内容</p>
    </div>
  );
}
```

### 2. 组件级保护 - 使用 `AuthGuard`

```typescript
// app/profile/page.tsx
"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";

export default function ProfilePage() {
  return (
    <AuthGuard fallback={<div>验证身份中...</div>}>
      <div>
        <h1>个人资料</h1>
        <p>只有登录用户才能看到这里</p>
      </div>
    </AuthGuard>
  );
}
```

### 3. 增强功能 - 使用 `useAuth`

```typescript
// app/chat/page.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

export default function ChatPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth({
    redirectTo: "/",
    required: true,
  });

  if (isLoading) {
    return <div>加载中...</div>;
  }

  if (!isAuthenticated) {
    return null; // 会自动重定向
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1>聊天室</h1>
        <Button onClick={logout} variant="outline">
          退出登录
        </Button>
      </div>

      <p>欢迎，{user?.firstName}！</p>
      {/* 聊天内容 */}
    </div>
  );
}
```

### 4. 登录页面处理 - 防止重复登录

```typescript
// app/page.tsx (登录页面)
"use client";

import { useLoginPage } from "@/hooks/useAuth";
import TelegramAuth from "@/components/TelegramAuth";

export default function LoginPage() {
  const { user, isAuthenticated } = useLoginPage("/home");

  // 如果已登录，会自动重定向到 /home
  if (isAuthenticated) {
    return <div>已登录，正在跳转...</div>;
  }

  return (
    <div>
      <h1>欢迎来到漂流瓶</h1>
      <TelegramAuth />
    </div>
  );
}
```

### 5. 全局保护 - 在布局中使用

```typescript
// app/layout.tsx
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}

// 或者创建受保护的布局
// app/(protected)/layout.tsx
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
```

## ⚙️ 配置选项

### 路由配置

在 `lib/auth-config.ts` 中修改路由设置：

```typescript
export const AUTH_CONFIG = {
  routes: {
    login: "/", // 登录页面
    afterLogin: "/home", // 登录后重定向
    afterLogout: "/", // 登出后重定向
  },
  pages: {
    protected: [
      // 需要登录的页面
      "/home",
      "/chat",
      "/profile",
      "/voices",
    ],
    guestOnly: ["/"], // 只允许未登录用户访问
    public: ["/about"], // 完全公开的页面
  },
};
```

### 自定义重定向逻辑

```typescript
// 使用 RedirectManager 记住用户尝试访问的页面
import { RedirectManager, getRedirectAfterLogin } from "@/lib/auth-config";

// 在登录成功后
const handleLoginSuccess = (user: UserInfo) => {
  setUser(user);

  // 获取用户原本想访问的页面
  const intendedPath = RedirectManager.getAndClearIntendedPath();
  const redirectTo = getRedirectAfterLogin(intendedPath);

  router.push(redirectTo);
};
```

## 📱 实际集成示例

### 更新现有页面

1. **更新主页** (`app/home/page.tsx`):

```typescript
"use client";

import { useAuthRedirect } from "@/hooks/useAuthRedirect";
// ... 其他 imports

export default function HomePage() {
  const { user, isAuthenticated } = useAuthRedirect();

  if (!isAuthenticated) {
    return null; // 自动重定向中
  }

  // 原有的主页逻辑
  return <div>{/* 现有内容 */}</div>;
}
```

2. **更新聊天页面** (`app/chat/page.tsx`):

```typescript
"use client";

import { RequireAuth } from "@/components/auth/AuthGuard";
// ... 其他 imports

export default function ChatPage() {
  return <RequireAuth>{/* 现有聊天页面内容 */}</RequireAuth>;
}
```

3. **更新个人资料页面** (`app/profile/page.tsx`):

```typescript
"use client";

import { useProtectedPage } from "@/hooks/useAuth";
// ... 其他 imports

export default function ProfilePage() {
  const { user, logout } = useProtectedPage();

  return (
    <div>
      <h1>个人资料</h1>
      <p>用户: {user?.firstName}</p>
      <button onClick={logout}>退出登录</button>
      {/* 其他内容 */}
    </div>
  );
}
```

## 🔍 调试和监控

### 开启调试日志

开发环境下会自动显示认证相关的控制台日志：

```
[Auth] 用户未登录，重定向到: /
[Auth] 需要登录，重定向到: /
[Auth] 已登录，重定向到: /home
🔐 用户登录: 张三
🚪 用户登出
🔄 自动重定向到登录页
```

### 监控用户状态

```typescript
// 在任何组件中监控用户状态
import { useUserStore } from "@/hooks/useUserStore";

export function UserStatusMonitor() {
  const { user, isInitialized } = useUserStore();

  useEffect(() => {
    console.log("用户状态变化:", { user, isInitialized });
  }, [user, isInitialized]);

  return null;
}
```

## 🎯 最佳实践

1. **选择合适的方法**:

   - 简单页面: 使用 `useAuthRedirect`
   - 组件保护: 使用 `AuthGuard`
   - 复杂逻辑: 使用 `useAuth`

2. **避免重复重定向**:

   - 检查 `isLoading` 状态
   - 使用配置文件管理路由

3. **用户体验优化**:

   - 提供加载状态
   - 显示有意义的重定向提示
   - 记住用户尝试访问的页面

4. **性能考虑**:
   - 使用 `persist` 中间件持久化用户状态
   - 避免不必要的重渲染

现在您的项目已经具备了完整的认证系统！🎉
