"use client";

import { usePathname } from "next/navigation";

export default function TopNav() {
  const pathname = usePathname();

  // 和 BottomNav 使用相同的逻辑判断是否显示
  const isLogin = pathname !== "/";
  const isHide = !["/home", "/chat", "/voices", "/profile"].includes(pathname);

  // 根据当前路径显示对应的标题和图标
  const getPageInfo = () => {
    switch (pathname) {
      case "/home":
        return { title: "海边", icon: "🏖️", subtitle: "发现有趣的漂流瓶" };
      case "/chat":
        return { title: "聊天", icon: "💭", subtitle: "与陌生人的美好对话" };
      case "/voices":
        return { title: "心声", icon: "🎭", subtitle: "倾听内心的声音" };
      case "/profile":
        return { title: "我的", icon: "🏠", subtitle: "管理您的漂流瓶之旅" };
      default:
        return { title: "漂流瓶", icon: "🌊", subtitle: "遇见有趣的陌生人" };
    }
  };

  const pageInfo = getPageInfo();

  return isLogin && !isHide ? (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-ocean-200">
      <div className="max-w-lg mx-auto px-4 py-3">
        <div className="flex items-center justify-center space-x-3">
          {/* 页面图标 */}
          {/* <div className="text-2xl animate-float">{pageInfo.icon}</div> */}

          {/* 页面信息 */}
          <div className="text-center">
            <h1 className="text-lg font-bold text-ocean-800 mb-0.5">
              {pageInfo.title}
            </h1>
            <p className="text-xs text-ocean-600 opacity-80">
              {pageInfo.subtitle}
            </p>
          </div>
        </div>

        {/* 装饰性波浪线 */}
        <div className="flex justify-center mt-2">
          <div className="flex space-x-1">
            <div className="w-8 h-0.5 bg-ocean-300 rounded-full wave-animation"></div>
            <div
              className="w-4 h-0.5 bg-ocean-400 rounded-full wave-animation"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className="w-6 h-0.5 bg-ocean-300 rounded-full wave-animation"
              style={{ animationDelay: "0.4s" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  ) : null;
}
