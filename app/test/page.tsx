"use client";

import { useState } from "react";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";

export default function TestPage() {
  const [testInitData, setTestInitData] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingManual, setIsTestingManual] = useState(false);

  const {
    isLoading,
    isAuthenticated,
    user,
    error,
    authenticate,
    autoAuthenticate,
    clearError,
  } = useTelegramAuth();

  // 手动测试身份验证
  const handleManualTest = async () => {
    if (!testInitData.trim()) {
      alert("请输入 InitData");
      return;
    }

    setIsTestingManual(true);
    setTestResult(null);

    try {
      const result = await authenticate(testInitData);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "测试失败",
      });
    } finally {
      setIsTestingManual(false);
    }
  };

  // 模拟 InitData 用于测试
  const generateMockInitData = () => {
    const mockData = new URLSearchParams({
      query_id: "AAEOTpe1PSpw_ile6lBKG1RirUEqvWMClic_" + Date.now(),
      user: JSON.stringify({
        id: 123456789,
        first_name: "测试用户",
        last_name: "Test",
        username: "testuser",
        language_code: "zh-CN",
        is_premium: false,
      }),
      auth_date: Math.floor(Date.now() / 1000).toString(),
      hash: "mock_hash_for_testing_only",
    });

    setTestInitData(mockData.toString());
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Telegram 身份验证测试
          </h1>
          <p className="text-gray-600">
            此页面用于开发和测试 Telegram InitData 身份验证功能
          </p>
        </div>

        {/* 自动认证状态 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">自动认证状态</h2>

          {isLoading && (
            <div className="flex items-center text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              正在验证身份...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-red-700 font-medium">错误信息:</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={clearError}
                className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
              >
                清除错误
              </button>
            </div>
          )}

          {isAuthenticated && user && (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <p className="text-green-700 font-medium">认证成功!</p>
              <pre className="text-sm mt-2 text-green-600 bg-green-100 p-2 rounded overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )}

          {!isLoading && !error && !isAuthenticated && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <p className="text-yellow-700">
                未检测到 Telegram WebApp 环境或认证失败
              </p>
              <button
                onClick={autoAuthenticate}
                className="mt-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-sm"
              >
                重新尝试自动认证
              </button>
            </div>
          )}
        </div>

        {/* 手动测试 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">手动测试</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telegram InitData:
              </label>
              <textarea
                value={testInitData}
                onChange={(e) => setTestInitData(e.target.value)}
                placeholder="粘贴 Telegram InitData 字符串..."
                className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none font-mono text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleManualTest}
                disabled={isTestingManual || !testInitData.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
              >
                {isTestingManual ? "测试中..." : "测试认证"}
              </button>

              <button
                onClick={generateMockInitData}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
              >
                生成模拟数据
              </button>

              <button
                onClick={() => setTestInitData("")}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
              >
                清空
              </button>
            </div>

            {testResult && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">测试结果:</h3>
                <pre
                  className={`text-sm p-3 rounded overflow-auto ${
                    testResult.success
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* API 信息 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API 端点信息</h2>

          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded">
              <p className="font-medium">认证端点:</p>
              <code className="text-sm text-blue-600">
                POST /api/auth/telegram
              </code>
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <p className="font-medium">请求格式:</p>
              <pre className="text-sm text-gray-600 mt-1">
                {`{
  "initData": "query_id=...&user=...&auth_date=...&hash=..."
}`}
              </pre>
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <p className="font-medium">成功响应:</p>
              <pre className="text-sm text-gray-600 mt-1">
                {`{
  "success": true,
  "user": {
    "id": 123456789,
    "first_name": "用户名",
    "username": "username",
    "language_code": "zh-CN"
  },
  "message": "身份验证成功"
}`}
              </pre>
            </div>
          </div>
        </div>

        {/* 环境检查 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">环境检查</h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Telegram WebApp SDK:</span>
              <span
                className={
                  typeof window !== "undefined" && window.Telegram?.WebApp
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {typeof window !== "undefined" && window.Telegram?.WebApp
                  ? "✓ 已加载"
                  : "✗ 未加载"}
              </span>
            </div>

            <div className="flex justify-between">
              <span>用户代理:</span>
              <span className="text-gray-600 max-w-md truncate">
                {typeof window !== "undefined"
                  ? window.navigator.userAgent
                  : "N/A"}
              </span>
            </div>

            <div className="flex justify-between">
              <span>当前环境:</span>
              <span className="text-gray-600">
                {process.env.NODE_ENV || "development"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
