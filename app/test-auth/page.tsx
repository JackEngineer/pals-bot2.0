"use client";

import React, { useState, useEffect } from "react";

export default function TestAuthPage() {
  const [initData, setInitData] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 自动获取当前页面的 InitData
  useEffect(() => {
    if (typeof window !== "undefined") {
      // 从 Telegram WebApp 获取
      if ((window as any).Telegram?.WebApp?.initData) {
        const data = (window as any).Telegram.WebApp.initData;
        setInitData(data);
        console.log("从 Telegram WebApp 获取到 InitData:", data);
      }

      // 从 URL 参数获取
      const urlParams = new URLSearchParams(window.location.search);
      const urlInitData = urlParams.get("initData");
      if (urlInitData) {
        setInitData(urlInitData);
        console.log("从 URL 参数获取到 InitData:", urlInitData);
      }
    }
  }, []);

  const testAuth = async () => {
    if (!initData.trim()) {
      alert("请输入 InitData");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ initData }),
      });

      const data = await response.json();
      setResult({
        status: response.status,
        success: response.ok,
        data,
      });
    } catch (error) {
      setResult({
        status: 0,
        success: false,
        data: { error: "网络错误: " + error },
      });
    }

    setLoading(false);
  };

  const sampleInitData =
    "query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22first_name%22%3A%22Vladislav%22%2C%22last_name%22%3A%22Kibenko%22%2C%22username%22%3A%22vdkfrost%22%2C%22language_code%22%3A%22en%22%7D&auth_date=1662771648&hash=c501b71e775f74ce10e377dea85a7ea24ecd640b223ea86dfe453e0eaed2e2b2";

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔐 Telegram 认证调试工具
        </h1>

        {/* 当前环境信息 */}
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
              {typeof window !== "undefined" && (window as any).Telegram?.WebApp
                ? "✅ 可用"
                : "❌ 不可用"}
            </div>
          </div>
        </div>

        {/* InitData 输入 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">InitData 输入</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                InitData 字符串:
              </label>
              <textarea
                value={initData}
                onChange={(e) => setInitData(e.target.value)}
                placeholder="粘贴或输入 Telegram InitData..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setInitData(sampleInitData)}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                使用示例数据
              </button>

              <button
                onClick={testAuth}
                disabled={!initData.trim() || loading}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
              >
                {loading ? "验证中..." : "开始验证"}
              </button>
            </div>
          </div>
        </div>

        {/* 验证结果 */}
        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">验证结果</h2>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="font-medium">状态码:</span>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    result.success
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {result.status}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="font-medium">验证结果:</span>
                <span
                  className={result.success ? "text-green-600" : "text-red-600"}
                >
                  {result.success ? "✅ 成功" : "❌ 失败"}
                </span>
              </div>

              {result.data.error && (
                <div>
                  <span className="font-medium text-red-600">错误信息:</span>
                  <p className="text-red-600 mt-1">{result.data.error}</p>
                </div>
              )}

              {result.data.user && (
                <div>
                  <span className="font-medium text-green-600">用户信息:</span>
                  <pre className="mt-1 p-3 bg-green-50 rounded border text-sm">
                    {JSON.stringify(result.data.user, null, 2)}
                  </pre>
                </div>
              )}

              {result.data.debug && (
                <div>
                  <span className="font-medium text-blue-600">调试信息:</span>
                  <pre className="mt-1 p-3 bg-blue-50 rounded border text-sm overflow-auto">
                    {JSON.stringify(result.data.debug, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-800 mb-2">调试步骤:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>1. 如果在 Telegram 中打开，InitData 会自动填充</li>
            <li>2. 点击"开始验证"按钮测试当前 InitData</li>
            <li>3. 查看调试信息中的 hash 计算过程</li>
            <li>4. 确认 Bot Token 配置正确</li>
            <li>5. 检查时间戳是否在有效期内</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
