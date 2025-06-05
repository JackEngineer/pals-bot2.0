"use client";

import { useTelegramAuth } from "@/hooks/useTelegramAuth";

export default function TelegramAuth() {
  const {
    isLoading,
    isAuthenticated,
    user,
    error,
    autoAuthenticate,
    logout,
    clearError,
  } = useTelegramAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">正在验证身份...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">身份验证失败</h3>
          </div>
        </div>
        <div className="text-sm text-red-700 mb-4">{error}</div>
        <div className="flex gap-3">
          <button
            onClick={clearError}
            className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded-md text-sm transition-colors"
          >
            清除错误
          </button>
          <button
            onClick={autoAuthenticate}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
          >
            重试验证
          </button>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-green-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">身份验证成功</h3>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            {user.photo_url && (
              <img
                src={user.photo_url}
                alt={user.first_name}
                className="h-12 w-12 rounded-full border-2 border-green-200"
              />
            )}
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {user.first_name} {user.last_name || ""}
              </p>
              {user.username && (
                <p className="text-sm text-gray-600">@{user.username}</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-md p-4 border border-green-100">
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-600">用户 ID:</dt>
                <dd className="text-sm text-gray-900">{user.id}</dd>
              </div>
              {user.language_code && (
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-600">语言:</dt>
                  <dd className="text-sm text-gray-900">
                    {user.language_code}
                  </dd>
                </div>
              )}
              {user.is_premium !== undefined && (
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-600">
                    Premium:
                  </dt>
                  <dd className="text-sm text-gray-900">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_premium
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.is_premium ? "是" : "否"}
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <button
            onClick={logout}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
          >
            登出
          </button>
        </div>
      </div>
    );
  }

  // 不在 Telegram 环境中的默认状态
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
          <svg
            className="h-6 w-6 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          请在 Telegram 中打开
        </h3>
        <p className="text-sm text-gray-600">
          此应用需要在 Telegram WebApp 环境中运行才能进行身份验证。
        </p>
      </div>
    </div>
  );
}
