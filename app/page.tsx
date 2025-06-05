"use client";

import { useEffect, useState } from "react";
import TelegramAuth from "@/components/TelegramAuth";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { getTelegramInitData, parseInitData } from "@/lib/telegram-auth";

// 声明 Telegram WebApp 类型
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        MainButton: {
          setText: (text: string) => void;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
        };
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            username?: string;
          };
        };
        themeParams: any;
      };
    };
  }
}

export default function Home() {
  // 使用经过验证的认证信息
  const {
    isAuthenticated,
    user: authenticatedUser,
    isLoading,
    error,
  } = useTelegramAuth();

  const [bottles, setBottles] = useState<string[]>([
    "今天天气真好，希望你也是 🌞",
    "一个人的时候，特别想念有人陪伴的感觉",
    "刚看完一部电影，感动得哭了",
    "加油！明天会更好的！",
    "想要一个拥抱 🫂",
  ]);
  const [currentBottle, setCurrentBottle] = useState<string>("");
  const [newMessage, setNewMessage] = useState<string>("");

  // 调试状态
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [apiTestResult, setApiTestResult] = useState<any>(null);

  // 更新调试信息
  const updateDebugInfo = () => {
    if (typeof window === "undefined") return;

    const rawInitData = getTelegramInitData();
    const parsedData = rawInitData ? parseInitData(rawInitData) : null;

    const info = {
      environment: {
        isBrowser: typeof window !== "undefined",
        hasTelegram: !!window.Telegram?.WebApp,
        hasInitData: !!window.Telegram?.WebApp?.initData,
        initDataLength: window.Telegram?.WebApp?.initData?.length || 0,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
      initData: {
        raw: rawInitData,
        length: rawInitData?.length || 0,
        containsHash: rawInitData?.includes("hash=") || false,
        containsAuthDate: rawInitData?.includes("auth_date=") || false,
        fieldCount: rawInitData?.split("&").length || 0,
      },
      parsed: parsedData,
      auth: {
        isLoading,
        isAuthenticated,
        user: authenticatedUser,
        error,
      },
    };

    setDebugInfo(info);
  };

  // 测试认证API
  const testAuthentication = async () => {
    setApiTestResult({ loading: true });

    try {
      const initData = getTelegramInitData() || "test_data";

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
        success: response.ok,
        data: result,
        timestamp: new Date().toISOString(),
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

  useEffect(() => {
    // 初始化 Telegram WebApp
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      // 配置主按钮
      tg.MainButton.setText("投递漂流瓶");
      tg.MainButton.onClick(() => {
        if (newMessage.trim()) {
          handleSendBottle();
        }
      });
    }

    // 初始化调试信息
    updateDebugInfo();
  }, []);

  useEffect(() => {
    // 当认证状态改变时更新调试信息
    updateDebugInfo();
  }, [isLoading, isAuthenticated, authenticatedUser, error]);

  useEffect(() => {
    // 根据输入内容显示/隐藏主按钮
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      if (newMessage.trim()) {
        tg.MainButton.show();
      } else {
        tg.MainButton.hide();
      }
    }
  }, [newMessage]);

  const getRandomBottle = () => {
    const randomIndex = Math.floor(Math.random() * bottles.length);
    setCurrentBottle(bottles[randomIndex]);
  };

  const handleSendBottle = () => {
    if (newMessage.trim()) {
      setBottles([...bottles, newMessage]);
      setNewMessage("");
      alert("漂流瓶投递成功！🍃");

      // 隐藏主按钮
      if (typeof window !== "undefined" && window.Telegram?.WebApp) {
        window.Telegram.WebApp.MainButton.hide();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 p-4">
      <div className="max-w-md mx-auto">
        {/* 用户信息 */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-between mb-4">
            <div></div>
            <h1 className="text-2xl font-bold text-blue-800">🍃 漂流瓶 🍃</h1>
            <button
              onClick={() => {
                setShowDebug(!showDebug);
                if (!showDebug) {
                  updateDebugInfo();
                }
              }}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                showDebug
                  ? "bg-blue-100 hover:bg-blue-200 text-blue-700"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }`}
              title={showDebug ? "隐藏调试信息" : "显示调试信息"}
            >
              🔍 {showDebug ? "隐藏" : "调试"}
            </button>
          </div>
          {/* 只在认证成功时显示用户信息 */}
          {isAuthenticated && authenticatedUser && (
            <p className="text-blue-600 mb-4">
              欢迎, {authenticatedUser.first_name}!
            </p>
          )}

          {/* Telegram 认证状态 */}
          <TelegramAuth />
        </div>

        {/* 调试面板 */}
        {showDebug && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                🔍 调试信息
              </h2>
              <div className="space-x-2">
                <button
                  onClick={updateDebugInfo}
                  className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                >
                  🔄 刷新
                </button>
                <button
                  onClick={testAuthentication}
                  disabled={apiTestResult?.loading}
                  className="text-xs bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-2 py-1 rounded"
                >
                  {apiTestResult?.loading ? "测试中..." : "🧪 测试API"}
                </button>
              </div>
            </div>

            {debugInfo && (
              <div className="space-y-4 text-sm">
                {/* 环境信息 */}
                <div className="bg-white rounded p-3">
                  <h3 className="font-semibold text-blue-700 mb-2">
                    🌐 环境信息
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      Telegram WebApp:{" "}
                      {debugInfo.environment.hasTelegram ? "✅" : "❌"}
                    </div>
                    <div>
                      InitData存在:{" "}
                      {debugInfo.environment.hasInitData ? "✅" : "❌"}
                    </div>
                    <div>
                      InitData长度: {debugInfo.environment.initDataLength} 字符
                    </div>
                    <div>字段数量: {debugInfo.initData.fieldCount}</div>
                    <div>
                      包含Hash: {debugInfo.initData.containsHash ? "✅" : "❌"}
                    </div>
                    <div>
                      包含AuthDate:{" "}
                      {debugInfo.initData.containsAuthDate ? "✅" : "❌"}
                    </div>
                  </div>
                </div>

                {/* 认证状态 */}
                <div className="bg-white rounded p-3">
                  <h3 className="font-semibold text-green-700 mb-2">
                    🔐 认证状态
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>加载中: {debugInfo.auth.isLoading ? "⏳" : "✅"}</div>
                    <div>
                      已认证: {debugInfo.auth.isAuthenticated ? "✅" : "❌"}
                    </div>
                    {debugInfo.auth.user && (
                      <>
                        <div>用户ID: {debugInfo.auth.user.id}</div>
                        <div>用户名: {debugInfo.auth.user.first_name}</div>
                      </>
                    )}
                    {debugInfo.auth.error && (
                      <div className="col-span-2 text-red-600">
                        错误: {debugInfo.auth.error}
                      </div>
                    )}
                  </div>
                </div>

                {/* InitData详情 */}
                {debugInfo.initData.raw && (
                  <div className="bg-white rounded p-3">
                    <h3 className="font-semibold text-purple-700 mb-2">
                      📝 InitData详情
                    </h3>
                    <details className="text-xs">
                      <summary className="cursor-pointer hover:text-purple-600 mb-2">
                        查看原始数据 ({debugInfo.initData.length} 字符)
                      </summary>
                      <textarea
                        readOnly
                        value={debugInfo.initData.raw}
                        className="w-full h-20 p-2 bg-gray-50 border rounded font-mono text-xs"
                      />
                    </details>

                    {debugInfo.parsed && (
                      <details className="text-xs mt-2">
                        <summary className="cursor-pointer hover:text-purple-600 mb-2">
                          查看解析后数据
                        </summary>
                        <pre className="p-2 bg-gray-50 border rounded text-xs overflow-auto">
                          {JSON.stringify(debugInfo.parsed, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                {/* API测试结果 */}
                {apiTestResult && (
                  <div className="bg-white rounded p-3">
                    <h3 className="font-semibold text-red-700 mb-2">
                      🧪 API测试结果
                    </h3>
                    <div className="text-xs space-y-2">
                      <div className="flex items-center space-x-2">
                        <span>状态:</span>
                        <span
                          className={
                            apiTestResult.success
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {apiTestResult.status}{" "}
                          {apiTestResult.success ? "✅" : "❌"}
                        </span>
                      </div>

                      {apiTestResult.data && (
                        <details>
                          <summary className="cursor-pointer hover:text-red-600">
                            查看响应数据
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-50 border rounded text-xs overflow-auto">
                            {JSON.stringify(apiTestResult.data, null, 2)}
                          </pre>
                        </details>
                      )}

                      <div className="text-gray-500">
                        时间:{" "}
                        {new Date(apiTestResult.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 发现漂流瓶 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-center">发现漂流瓶</h2>

          {currentBottle ? (
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-gray-700 italic">"{currentBottle}"</p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
              <p className="text-gray-500">点击下方按钮发现漂流瓶...</p>
            </div>
          )}

          <button
            onClick={getRandomBottle}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
          >
            🌊 捞起漂流瓶
          </button>
        </div>

        {/* 投递漂流瓶 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-center">投递漂流瓶</h2>

          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="写下你想说的话..."
            className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={200}
          />

          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">
              {newMessage.length}/200
            </span>
          </div>

          {/* 在非 Telegram 环境中显示投递按钮 */}
          {typeof window !== "undefined" && !window.Telegram?.WebApp && (
            <button
              onClick={handleSendBottle}
              disabled={!newMessage.trim()}
              className="w-full mt-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg transition-colors"
            >
              🚀 投递漂流瓶
            </button>
          )}
        </div>

        {/* 统计信息 */}
        <div className="mt-6 text-center text-blue-600">
          <p className="text-sm">
            海洋中共有 {bottles.length} 个漂流瓶在漂流...
          </p>
        </div>
      </div>
    </div>
  );
}
