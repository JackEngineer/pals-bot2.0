"use client";

import { useState } from "react";

// Telegram WebApp 类型声明
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string;
        initDataUnsafe: any;
        ready: () => void;
        expand: () => void;
      };
    };
  }
}

export default function TestSimple() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    setResult(null);

    try {
      // 方法1：尝试从 Telegram WebApp 获取数据
      let initData = "";

      if (typeof window !== "undefined" && window.Telegram?.WebApp?.initData) {
        initData = window.Telegram.WebApp.initData;
        console.log("📱 从 Telegram WebApp 获取到 initData:", initData);
      } else {
        // 方法2：使用测试数据（仅开发用）
        initData =
          "user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Test%22%2C%22username%22%3A%22testuser%22%7D&auth_date=1234567890&hash=test_hash";
        console.log("🧪 使用测试数据");
      }

      if (!initData) {
        setResult({
          error: "无法获取 initData",
          suggestion: "请确保应用在 Telegram 中打开",
        });
        return;
      }

      // 发送到后端验证
      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      });

      const data = await response.json();

      setResult({
        status: response.status,
        responseData: data,
        initDataUsed: initData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setResult({
        error: "请求失败",
        details: error instanceof Error ? error.message : "未知错误",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkEnvironment = () => {
    const env = {
      isTelegramWebApp:
        typeof window !== "undefined" && !!window.Telegram?.WebApp,
      initDataAvailable:
        typeof window !== "undefined" && !!window.Telegram?.WebApp?.initData,
      initDataLength:
        (typeof window !== "undefined" &&
          window.Telegram?.WebApp?.initData?.length) ||
        0,
      userAgent:
        typeof window !== "undefined" ? window.navigator.userAgent : "server",
      location: typeof window !== "undefined" ? window.location.href : "server",
    };

    setResult({
      environmentCheck: env,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">🧪 简化认证测试</h1>

        <div className="space-y-4 mb-6">
          <button
            onClick={checkEnvironment}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            🔍 检查环境
          </button>

          <button
            onClick={testAuth}
            disabled={loading}
            className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {loading ? "⏳ 测试中..." : "🚀 测试认证"}
          </button>
        </div>

        {result && (
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">测试结果:</h3>
            <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <h4 className="font-semibold mb-2">使用说明:</h4>
          <ol className="list-decimal list-inside space-y-1">
            <li>首先点击"检查环境"确认 Telegram 环境</li>
            <li>然后点击"测试认证"进行验证</li>
            <li>查看返回结果中的错误信息</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
