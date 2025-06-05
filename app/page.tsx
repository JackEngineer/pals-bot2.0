"use client";

import TelegramAuth from "@/components/TelegramAuth";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pals Bot 2.0
          </h1>
          <p className="text-lg text-gray-600">Telegram 漂流瓶 Mini App</p>
        </div>

        {/* 身份验证区域 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
            用户身份验证
          </h2>
          <TelegramAuth />
        </div>

        {/* 功能说明 */}
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">功能特性</h3>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start">
              <svg
                className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>安全的 Telegram InitData 身份验证</span>
            </li>
            <li className="flex items-start">
              <svg
                className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>HMAC-SHA256 签名验证</span>
            </li>
            <li className="flex items-start">
              <svg
                className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>时间戳验证防止重放攻击</span>
            </li>
            <li className="flex items-start">
              <svg
                className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>自动获取用户信息和头像</span>
            </li>
            <li className="flex items-start">
              <svg
                className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>错误处理和重试机制</span>
            </li>
          </ul>
        </div>

        {/* 使用说明 */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-2xl mx-auto mt-6">
          <h3 className="text-lg font-semibold text-amber-800 mb-3">
            使用说明
          </h3>
          <div className="text-amber-700 space-y-2">
            <p>1. 确保在 Telegram 中打开此 Mini App</p>
            <p>2. 应用会自动获取并验证您的身份信息</p>
            <p>3. 验证成功后会显示您的用户资料</p>
            <p>
              4. 如需配置，请设置环境变量{" "}
              <code className="bg-amber-100 px-1 rounded">
                TELEGRAM_BOT_TOKEN
              </code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
