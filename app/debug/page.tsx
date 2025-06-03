"use client";

import React, { useState, useEffect } from "react";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { getTelegramInitData, parseInitData } from "@/lib/telegram-auth";

export default function DebugPage() {
  const { isLoading, isAuthenticated, user, error } = useTelegramAuth();
  const [unsafeUser, setUnsafeUser] = useState<any>(null);
  const [initDataRaw, setInitDataRaw] = useState<string>("");
  const [parsedInitData, setParsedInitData] = useState<any>(null);
  const [manualTestResult, setManualTestResult] = useState<any>(null);
  const [envCheck, setEnvCheck] = useState<any>(null);
  const [apiTestResult, setApiTestResult] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // 获取 initDataUnsafe
      if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
        setUnsafeUser(window.Telegram.WebApp.initDataUnsafe.user);
      }

      // 获取原始 initData
      const rawData = getTelegramInitData();
      if (rawData) {
        setInitDataRaw(rawData);
        const parsed = parseInitData(rawData);
        setParsedInitData(parsed);
      }

      // 检查环境变量
      checkEnvironment();
    }
  }, []);

  const checkEnvironment = async () => {
    try {
      const response = await fetch("/api/debug/env", {
        method: "GET",
      });

      if (response.ok) {
        const data = await response.json();
        setEnvCheck(data);
      }
    } catch (error) {
      console.log("无法检查环境变量：", error);
    }
  };

  const testApiDirect = async () => {
    setApiTestResult({ loading: true });

    try {
      const initData = initDataRaw || "test_init_data";

      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ initData }),
      });

      const result = await response.json();

      setApiTestResult({
        loading: false,
        status: response.status,
        statusText: response.statusText,
        success: response.ok,
        data: result,
        timestamp: new Date().toISOString(),
        requestData: { initData },
      });
    } catch (error) {
      setApiTestResult({
        loading: false,
        status: 0,
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      });
    }
  };

  const testManualAuth = async () => {
    if (!initDataRaw) {
      alert("没有找到 InitData");
      return;
    }

    try {
      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ initData: initDataRaw }),
      });

      const result = await response.json();
      setManualTestResult({
        status: response.status,
        success: response.ok,
        data: result,
      });
    } catch (error) {
      setManualTestResult({
        status: 0,
        success: false,
        data: { error: "网络错误: " + error },
      });
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) return `${diff}秒前`;
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    return `${Math.floor(diff / 86400)}天前`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🔍 认证调试页面</h1>
          <button
            onClick={() => window.close()}
            className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded transition-colors"
          >
            关闭
          </button>
        </div>

        {/* API 直接测试 */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-red-800">🚨 API 直接测试</h2>
            <button
              onClick={testApiDirect}
              disabled={apiTestResult?.loading}
              className="text-sm bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-1 rounded transition-colors"
            >
              {apiTestResult?.loading ? "测试中..." : "测试 API"}
            </button>
          </div>

          {apiTestResult && (
            <div className="text-sm space-y-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium">状态码:</span>
                <span
                  className={
                    apiTestResult.status === 401
                      ? "text-red-600 font-bold"
                      : apiTestResult.status === 200
                      ? "text-green-600"
                      : "text-orange-600"
                  }
                >
                  {apiTestResult.status} {apiTestResult.statusText}
                </span>
              </div>

              {apiTestResult.status === 401 && (
                <div className="p-3 bg-red-100 rounded border">
                  <div className="font-medium text-red-800 mb-2">
                    ❌ 401 错误详情:
                  </div>
                  <pre className="text-xs text-red-700 whitespace-pre-wrap">
                    {JSON.stringify(apiTestResult.data, null, 2)}
                  </pre>
                </div>
              )}

              <details className="text-xs">
                <summary className="cursor-pointer hover:text-red-700">
                  查看完整响应
                </summary>
                <pre className="mt-2 p-2 bg-red-100 rounded text-red-700 whitespace-pre-wrap">
                  {JSON.stringify(apiTestResult, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>

        {/* 环境变量检查 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-800 mb-2">🔧 环境检查</h2>
          <div className="text-sm text-blue-700 space-y-1">
            <div>
              运行环境: {typeof window !== "undefined" ? "浏览器" : "服务器"}
            </div>
            <div>
              当前URL:{" "}
              {typeof window !== "undefined" ? window.location.href : "N/A"}
            </div>
            <div>
              Telegram WebApp:{" "}
              {typeof window !== "undefined" && window.Telegram?.WebApp
                ? "✅ 可用"
                : "❌ 不可用"}
            </div>
            <div>当前时间: {new Date().toISOString()}</div>
            {envCheck && (
              <div>
                Bot Token状态:{" "}
                {envCheck.hasBotToken ? "✅ 已配置" : "❌ 未配置"}
                {envCheck.tokenPrefix && ` (${envCheck.tokenPrefix}...)`}
              </div>
            )}
          </div>
        </div>

        {/* Hook 认证状态 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            🔐 useTelegramAuth Hook 状态
          </h2>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="font-medium">加载中:</span>
              <span className={isLoading ? "text-blue-600" : "text-gray-500"}>
                {isLoading ? "是" : "否"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">已认证:</span>
              <span
                className={isAuthenticated ? "text-green-600" : "text-red-600"}
              >
                {isAuthenticated ? "✅ 是" : "❌ 否"}
              </span>
            </div>
            {error && (
              <div>
                <span className="font-medium text-red-600">错误信息:</span>
                <p className="text-red-600 mt-1 p-2 bg-red-50 rounded border">
                  {error}
                </p>
              </div>
            )}
            {user && (
              <div>
                <span className="font-medium text-green-600">
                  验证后的用户信息:
                </span>
                <pre className="mt-1 p-3 bg-green-50 rounded border text-sm">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* 数据对比 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* initDataUnsafe */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              ⚠️ initDataUnsafe (未验证)
            </h2>
            {unsafeUser ? (
              <pre className="p-3 bg-yellow-50 rounded border text-sm">
                {JSON.stringify(unsafeUser, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500">无 initDataUnsafe 数据</p>
            )}
          </div>

          {/* 原始 InitData */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">📝 原始 InitData</h2>
            {initDataRaw ? (
              <div className="space-y-4">
                <div>
                  <span className="font-medium">字符串长度:</span>
                  <span className="ml-2 text-blue-600">
                    {initDataRaw.length} 字符
                  </span>
                </div>
                <textarea
                  value={initDataRaw}
                  readOnly
                  className="w-full h-32 p-2 border rounded text-sm font-mono"
                />
                <div className="text-xs text-gray-500">
                  包含 hash: {initDataRaw.includes("hash=") ? "✅" : "❌"}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-red-500">❌ 无原始 InitData</p>
                <p className="text-xs text-gray-500">
                  可能原因：不在 Telegram 环境中，或 WebApp SDK 未正确加载
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 解析后的数据 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">🔍 解析后的 InitData</h2>
          {parsedInitData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">用户ID:</span>
                  <span className="ml-2">
                    {parsedInitData.user?.id || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="font-medium">认证时间:</span>
                  <span className="ml-2">
                    {parsedInitData.auth_date
                      ? `${getTimeAgo(parsedInitData.auth_date)} (${new Date(
                          parsedInitData.auth_date * 1000
                        ).toISOString()})`
                      : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="font-medium">包含 Hash:</span>
                  <span
                    className={`ml-2 ${
                      parsedInitData.hash ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {parsedInitData.hash ? "✅ 是" : "❌ 否"}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Query ID:</span>
                  <span className="ml-2">
                    {parsedInitData.query_id || "N/A"}
                  </span>
                </div>
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer hover:text-blue-600 font-medium">
                  查看完整解析数据
                </summary>
                <pre className="mt-2 p-3 bg-gray-50 rounded border text-xs">
                  {JSON.stringify(parsedInitData, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <p className="text-gray-500">无法解析 InitData</p>
          )}
        </div>

        {/* 手动测试 */}
        {initDataRaw && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">🧪 手动认证测试</h2>
              <button
                onClick={testManualAuth}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
              >
                测试认证
              </button>
            </div>

            {manualTestResult && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">状态:</span>
                  <span
                    className={
                      manualTestResult.success
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {manualTestResult.status} -{" "}
                    {manualTestResult.success ? "成功" : "失败"}
                  </span>
                </div>
                <pre className="p-3 bg-gray-50 rounded border text-sm">
                  {JSON.stringify(manualTestResult.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* 故障排除指南 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-4">
            🛠️ 401 错误故障排除指南
          </h2>
          <div className="space-y-4 text-sm text-yellow-700">
            <div>
              <h3 className="font-semibold mb-2">常见原因：</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>InitData 中缺少 hash 参数</li>
                <li>Bot Token 配置错误或不匹配</li>
                <li>InitData 已过期（超过24小时）</li>
                <li>不在 Telegram Mini App 环境中运行</li>
                <li>InitData 在传输过程中被修改</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">解决步骤：</h3>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>确认应用在 Telegram 中正确启动</li>
                <li>检查 .env.local 中的 TELEGRAM_BOT_TOKEN</li>
                <li>点击上方"测试 API"按钮查看详细错误</li>
                <li>如果缺少 InitData，尝试重新启动 Mini App</li>
                <li>在开发环境中，可以使用 initDataUnsafe 进行测试</li>
              </ol>
            </div>

            {!initDataRaw && (
              <div className="p-3 bg-yellow-100 border border-yellow-300 rounded">
                <strong>⚠️ 当前问题：</strong> 未检测到 InitData。
                <br />
                <span className="text-xs">
                  这通常表示应用不在 Telegram Mini App 环境中运行。 请通过
                  Telegram Bot 启动应用，或在开发环境中使用模拟数据。
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
