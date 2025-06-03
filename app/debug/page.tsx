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
    }
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔍 认证调试页面
        </h1>

        {/* 环境信息 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-800 mb-2">环境信息</h2>
          <div className="text-sm text-blue-700 space-y-1">
            <div>
              运行环境: {typeof window !== "undefined" ? "浏览器" : "服务器"}
            </div>
            <div>
              User Agent:{" "}
              {typeof window !== "undefined" ? navigator.userAgent : "N/A"}
            </div>
            <div>
              Telegram WebApp:{" "}
              {typeof window !== "undefined" && window.Telegram?.WebApp
                ? "✅ 可用"
                : "❌ 不可用"}
            </div>
            <div>当前时间: {new Date().toISOString()}</div>
          </div>
        </div>

        {/* Hook 认证状态 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            useTelegramAuth Hook 状态
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
                <p className="text-red-600 mt-1">{error}</p>
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

        {/* initDataUnsafe */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            initDataUnsafe (未验证)
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
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">原始 InitData</h2>
          {initDataRaw ? (
            <div className="space-y-4">
              <div>
                <span className="font-medium">原始字符串:</span>
                <textarea
                  value={initDataRaw}
                  readOnly
                  className="w-full h-24 p-3 bg-gray-50 border rounded mt-2 text-sm font-mono"
                />
              </div>
              {parsedInitData && (
                <div>
                  <span className="font-medium">解析后的数据:</span>
                  <pre className="mt-1 p-3 bg-gray-50 rounded border text-sm">
                    {JSON.stringify(parsedInitData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">无 InitData 数据</p>
          )}
        </div>

        {/* 手动测试 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">手动认证测试</h2>
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
            </div>
          )}
        </div>

        {/* 对比分析 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">问题分析</h2>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <strong>问题现象:</strong> 名称显示但认证失败
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <strong>可能原因:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Bot Token 配置错误或缺失</li>
                <li>InitData 签名验证失败</li>
                <li>时间戳过期（超过24小时）</li>
                <li>开发环境与生产环境配置不一致</li>
                <li>HMAC 计算方式问题</li>
              </ul>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <strong>解决方案:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>检查 .env.local 文件中的 TELEGRAM_BOT_TOKEN</li>
                <li>确保在 Telegram 中打开应用</li>
                <li>使用最新的 InitData (重新打开应用)</li>
                <li>查看调试信息中的具体错误</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
