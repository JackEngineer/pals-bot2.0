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
                  className="w-full h-24 p-3 bg-gray-50 border rounded text-xs font-mono"
                />
                {parsedInitData && (
                  <div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span>用户ID: {parsedInitData.user?.id}</span>
                      {parsedInitData.auth_date && (
                        <span>
                          时间: {getTimeAgo(parsedInitData.auth_date)}
                        </span>
                      )}
                    </div>
                    <pre className="mt-2 p-3 bg-gray-50 rounded border text-xs">
                      {JSON.stringify(parsedInitData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">无 InitData 数据</p>
            )}
          </div>
        </div>

        {/* 手动测试 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">🧪 手动认证测试</h2>
          <button
            onClick={testManualAuth}
            disabled={!initDataRaw}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors mb-4"
          >
            测试服务器认证
          </button>

          {manualTestResult && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="font-medium">状态码:</span>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    manualTestResult.success
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {manualTestResult.status}
                </span>
              </div>

              <div>
                <span className="font-medium">服务器响应:</span>
                <pre className="mt-1 p-3 bg-gray-50 rounded border text-sm overflow-auto">
                  {JSON.stringify(manualTestResult.data, null, 2)}
                </pre>
              </div>

              {/* Hash验证分析 */}
              {manualTestResult.data?.debug && (
                <div className="bg-red-50 border border-red-200 rounded p-4">
                  <h3 className="font-medium text-red-800 mb-2">
                    🔍 Hash验证分析
                  </h3>
                  <div className="text-sm space-y-2">
                    <div>
                      <strong>接收到的Hash:</strong>
                      <code className="ml-2 bg-red-100 px-1 rounded font-mono text-xs">
                        {manualTestResult.data.debug.receivedHash}
                      </code>
                    </div>
                    <div>
                      <strong>期望的Hash:</strong>
                      <code className="ml-2 bg-green-100 px-1 rounded font-mono text-xs">
                        {manualTestResult.data.debug.expectedHash}
                      </code>
                    </div>
                    <div>
                      <strong>数据检查字符串:</strong>
                      <pre className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono">
                        {manualTestResult.data.debug.dataCheckString}
                      </pre>
                    </div>
                    <div>
                      <strong>Bot Token长度:</strong>
                      <span className="ml-2">
                        {manualTestResult.data.debug.botTokenLength} 字符
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 问题分析 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">📊 问题分析</h2>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <strong>❗ 当前问题:</strong> Hash验证失败
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <strong>🔍 可能原因:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Bot Token 不正确或格式错误</li>
                <li>InitData 在传输过程中被修改</li>
                <li>时间戳不同步（服务器时间与Telegram时间差异）</li>
                <li>URL编码/解码问题</li>
                <li>开发环境模拟数据与实际Telegram数据格式不符</li>
                <li>HMAC-SHA256 计算算法实现差异</li>
              </ul>
            </div>

            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <strong>🛠️ 排查步骤:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>确认您的Bot Token是否正确（在BotFather中查看）</li>
                <li>确保在真实的Telegram环境中测试（不是浏览器直接访问）</li>
                <li>检查InitData是否完整且未被修改</li>
                <li>对比上面的"接收到的Hash"和"期望的Hash"</li>
                <li>如果是开发环境，尝试使用真实的Telegram Mini App测试</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
