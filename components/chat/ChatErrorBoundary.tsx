"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ChatErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新状态以显示错误UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误详情
    console.error("聊天组件错误:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // 这里可以集成错误上报服务
    // reportErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    // 重置错误状态
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  handleReloadPage = () => {
    // 重新加载页面
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col h-full bg-gradient-to-b from-red-50 to-white">
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md mx-auto">
              {/* 错误图标 */}
              <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              {/* 错误信息 */}
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                聊天出现错误
              </h2>

              <p className="text-gray-600 mb-6 leading-relaxed">
                很抱歉，聊天功能遇到了一些问题。这通常是临时性的，您可以尝试以下解决方案：
              </p>

              {/* 操作按钮 */}
              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="
                    w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white 
                    rounded-lg font-medium transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  "
                >
                  🔄 重试
                </button>

                <button
                  onClick={this.handleReloadPage}
                  className="
                    w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 
                    rounded-lg font-medium transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                  "
                >
                  🔄 重新加载页面
                </button>

                <button
                  onClick={() => window.history.back()}
                  className="
                    w-full px-6 py-3 bg-white hover:bg-gray-50 text-gray-600 border border-gray-300 
                    rounded-lg font-medium transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                  "
                >
                  ← 返回上一页
                </button>
              </div>

              {/* 开发环境下显示错误详情 */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2">
                    🔍 查看错误详情 (开发模式)
                  </summary>
                  <div className="bg-gray-100 rounded-lg p-4 text-xs text-gray-700 overflow-auto max-h-40">
                    <div className="mb-2">
                      <strong>错误信息:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">
                        {this.state.error.message}
                      </pre>
                    </div>

                    <div className="mb-2">
                      <strong>错误堆栈:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </div>

                    {this.state.errorInfo && (
                      <div>
                        <strong>组件堆栈:</strong>
                        <pre className="mt-1 whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* 联系信息 */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  💡 <strong>提示:</strong>{" "}
                  如果问题持续存在，请尝试清除浏览器缓存或联系技术支持。
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
