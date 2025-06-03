"use client";

import React, { useState } from "react";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";

export default function TestPage() {
  const [testInitData, setTestInitData] = useState("");
  const { isLoading, isAuthenticated, user, error, authenticate } =
    useTelegramAuth();

  // 示例测试数据 (注意：这只是用于开发测试，实际应用中不要使用固定的测试数据)
  const sampleInitData = `auth_date=1640000000&hash=abcd1234&user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22%E6%B5%8B%E8%AF%95%E7%94%A8%E6%88%B7%22%2C%22username%22%3A%22testuser%22%2C%22language_code%22%3A%22zh%22%7D`;

  const handleTestAuth = () => {
    if (testInitData.trim()) {
      authenticate(testInitData);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Telegram InitData 验证测试
        </h1>

        {/* 当前认证状态 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">当前认证状态</h2>

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
                {isAuthenticated ? "是" : "否"}
              </span>
            </div>

            {error && (
              <div className="flex items-center space-x-2">
                <span className="font-medium">错误:</span>
                <span className="text-red-600">{error}</span>
              </div>
            )}

            {user && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h3 className="font-medium mb-2">用户信息:</h3>
                <pre className="text-sm text-gray-700">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* 测试输入 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">测试 InitData</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                InitData 字符串:
              </label>
              <textarea
                value={testInitData}
                onChange={(e) => setTestInitData(e.target.value)}
                placeholder="输入或粘贴 Telegram InitData..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setTestInitData(sampleInitData)}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                使用示例数据
              </button>

              <button
                onClick={handleTestAuth}
                disabled={!testInitData.trim() || isLoading}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
              >
                {isLoading ? "验证中..." : "开始验证"}
              </button>
            </div>
          </div>
        </div>

        {/* 说明 */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-800 mb-2">使用说明:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>1. 在真实的 Telegram Mini App 中，InitData 会自动获取</li>
            <li>2. 在开发环境中，可以手动输入 InitData 进行测试</li>
            <li>3. 示例数据仅用于测试界面，实际验证需要真实的 Bot Token</li>
            <li>4. 确保 .env.local 文件中设置了正确的 TELEGRAM_BOT_TOKEN</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
