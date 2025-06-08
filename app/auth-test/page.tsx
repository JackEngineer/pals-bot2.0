"use client";

import { useState } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useAuth } from "@/hooks/useAuth";
import { useUserStore, UserInfo } from "@/hooks/useUserStore";
import { AuthGuard, RequireAuth } from "@/components/auth/AuthGuard";

export default function AuthTestPage() {
  const [testMode, setTestMode] = useState<"redirect" | "hook" | "guard">(
    "redirect"
  );
  const { user: currentUser, setUser, clearUser } = useUserStore();

  // 模拟用户数据
  const mockUser: UserInfo = {
    id: "test-123",
    telegramId: "123456789",
    firstName: "测试用户",
    lastName: "张三",
    username: "test_user",
  };

  const handleLogin = () => {
    setUser(mockUser);
  };

  const handleLogout = () => {
    clearUser();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-50 to-cyan-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ocean-800 mb-4">
            🔐 认证系统测试
          </h1>
          <p className="text-ocean-600">测试不同的认证方式和自动重定向功能</p>
        </div>

        {/* 用户状态显示 */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-lg">
          <h2 className="text-xl font-semibold text-ocean-800 mb-4">
            当前用户状态
          </h2>

          {currentUser ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span className="font-medium">已登录</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>用户ID: {currentUser.id}</p>
                <p>
                  姓名: {currentUser.firstName} {currentUser.lastName}
                </p>
                <p>用户名: {currentUser.username}</p>
                <p>Telegram ID: {currentUser.telegramId}</p>
              </div>
              <button
                onClick={handleLogout}
                className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                退出登录
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-red-500">❌</span>
                <span className="font-medium">未登录</span>
              </div>
              <button
                onClick={handleLogin}
                className="mt-4 bg-ocean-500 hover:bg-ocean-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                模拟登录
              </button>
            </div>
          )}
        </div>

        {/* 测试模式选择 */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-lg">
          <h2 className="text-xl font-semibold text-ocean-800 mb-4">
            选择测试模式
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => setTestMode("redirect")}
              className={`p-4 rounded-lg border-2 transition-colors text-left ${
                testMode === "redirect"
                  ? "border-ocean-500 bg-ocean-50"
                  : "border-gray-200 hover:border-ocean-300"
              }`}
            >
              <div className="font-medium text-ocean-800">useAuthRedirect</div>
              <div className="text-sm text-gray-600 mt-1">
                简单的重定向 Hook，适用于大多数页面
              </div>
            </button>

            <button
              onClick={() => setTestMode("hook")}
              className={`p-4 rounded-lg border-2 transition-colors text-left ${
                testMode === "hook"
                  ? "border-ocean-500 bg-ocean-50"
                  : "border-gray-200 hover:border-ocean-300"
              }`}
            >
              <div className="font-medium text-ocean-800">useAuth</div>
              <div className="text-sm text-gray-600 mt-1">
                增强版 Hook，支持更多功能和配置
              </div>
            </button>

            <button
              onClick={() => setTestMode("guard")}
              className={`p-4 rounded-lg border-2 transition-colors text-left ${
                testMode === "guard"
                  ? "border-ocean-500 bg-ocean-50"
                  : "border-gray-200 hover:border-ocean-300"
              }`}
            >
              <div className="font-medium text-ocean-800">AuthGuard</div>
              <div className="text-sm text-gray-600 mt-1">
                组件级保护，包装需要认证的内容
              </div>
            </button>
          </div>
        </div>

        {/* 测试组件展示 */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-ocean-800 mb-4">
            {testMode === "redirect" && "useAuthRedirect 测试"}
            {testMode === "hook" && "useAuth 测试"}
            {testMode === "guard" && "AuthGuard 测试"}
          </h2>

          {testMode === "redirect" && <RedirectTest />}
          {testMode === "hook" && <HookTest />}
          {testMode === "guard" && <GuardTest />}
        </div>
      </div>
    </div>
  );
}

// useAuthRedirect 测试组件
function RedirectTest() {
  const { user, isAuthenticated } = useAuthRedirect();

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-800 mb-2">说明</h3>
        <p className="text-sm text-gray-600">
          这个组件使用{" "}
          <code className="bg-gray-200 px-1 rounded">useAuthRedirect()</code>{" "}
          Hook。 如果用户未登录，会自动重定向到登录页面。
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
        <h3 className="font-medium text-green-800 mb-2">认证状态</h3>
        <div className="text-sm">
          <p>登录状态: {isAuthenticated ? "✅ 已登录" : "❌ 未登录"}</p>
          {user && (
            <p>
              用户信息: {user.firstName} {user.lastName}
            </p>
          )}
        </div>
      </div>

      {isAuthenticated && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">受保护的内容</h3>
          <p className="text-sm text-blue-700">
            这些内容只有登录用户才能看到。如果您能看到这段文字，说明认证功能正常工作！
          </p>
        </div>
      )}
    </div>
  );
}

// useAuth 测试组件
function HookTest() {
  const { user, isAuthenticated, isLoading, logout } = useAuth({
    redirectTo: "/",
    required: true,
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-ocean-200 border-t-ocean-500 rounded-full mx-auto mb-2"></div>
        <p className="text-ocean-600">检查认证状态...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-800 mb-2">说明</h3>
        <p className="text-sm text-gray-600">
          这个组件使用{" "}
          <code className="bg-gray-200 px-1 rounded">useAuth()</code> Hook。
          提供了更多功能，如加载状态、注销函数等。
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
        <h3 className="font-medium text-green-800 mb-2">认证状态</h3>
        <div className="text-sm space-y-1">
          <p>登录状态: {isAuthenticated ? "✅ 已登录" : "❌ 未登录"}</p>
          <p>加载状态: {isLoading ? "⏳ 加载中" : "✅ 已完成"}</p>
          {user && (
            <p>
              用户信息: {user.firstName} {user.lastName}
            </p>
          )}
        </div>
      </div>

      {isAuthenticated && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">增强功能</h3>
            <div className="space-y-2">
              <p className="text-sm text-blue-700">
                useAuth Hook 提供了额外的功能，比如注销按钮：
              </p>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                注销登录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// AuthGuard 测试组件
function GuardTest() {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-800 mb-2">说明</h3>
        <p className="text-sm text-gray-600">
          这个区域使用{" "}
          <code className="bg-gray-200 px-1 rounded">AuthGuard</code> 组件包装。
          只有登录用户才能看到被保护的内容。
        </p>
      </div>

      <AuthGuard
        fallback={
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">需要登录</h3>
            <p className="text-sm text-yellow-700">
              这里是 fallback 内容。您需要登录才能查看受保护的内容。
            </p>
          </div>
        }
      >
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <h3 className="font-medium text-green-800 mb-2">受保护的内容</h3>
          <p className="text-sm text-green-700">
            🎉 恭喜！您能看到这段内容，说明 AuthGuard 组件正常工作！
          </p>
        </div>
      </AuthGuard>

      <RequireAuth
        fallback={
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
            <h3 className="font-medium text-orange-800 mb-2">
              RequireAuth 组件
            </h3>
            <p className="text-sm text-orange-700">
              这是 RequireAuth 的 fallback 内容。
            </p>
          </div>
        }
      >
        <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
          <h3 className="font-medium text-purple-800 mb-2">
            RequireAuth 保护的内容
          </h3>
          <p className="text-sm text-purple-700">
            这里是被 RequireAuth 组件保护的内容。这是 AuthGuard 的简化版本。
          </p>
        </div>
      </RequireAuth>
    </div>
  );
}
