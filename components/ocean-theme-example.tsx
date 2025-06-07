"use client";

import React from "react";

/**
 * 海洋主题使用示例组件
 * 展示如何在项目中使用海洋色系和样式
 */
export function OceanThemeExample() {
  return (
    <div className="min-h-screen bg-ocean-light">
      {/* 页面头部 - 使用海洋渐变背景 */}
      <header className="ocean-background wave-animation p-6 text-white">
        <h1 className="text-3xl font-bold text-center">🌊 漂流瓶 - 海洋主题</h1>
        <p className="text-center mt-2 text-ocean-100">
          在数字海洋中投递你的心情
        </p>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 颜色展示区域 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-ocean-800 mb-6">
            海洋色系展示
          </h2>

          {/* 主要海洋色系 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[50, 200, 400, 600, 800].map((shade) => (
              <div
                key={shade}
                className={`bg-ocean-${shade} p-4 rounded-lg text-center shadow-lg`}
                style={{ backgroundColor: `var(--tw-ocean-${shade})` }}
              >
                <div
                  className={`font-semibold ${
                    shade >= 400 ? "text-white" : "text-ocean-800"
                  }`}
                >
                  Ocean {shade}
                </div>
              </div>
            ))}
          </div>

          {/* 水蓝色系 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[50, 200, 400, 600, 800].map((shade) => (
              <div
                key={shade}
                className={`bg-aqua-${shade} p-4 rounded-lg text-center shadow-lg`}
              >
                <div
                  className={`font-semibold ${
                    shade >= 400 ? "text-white" : "text-aqua-800"
                  }`}
                >
                  Aqua {shade}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 按钮展示 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-ocean-800 mb-6">
            海洋主题按钮
          </h2>
          <div className="flex flex-wrap gap-4">
            <button className="btn-ocean px-6 py-3 rounded-lg font-semibold ripple-effect">
              投递漂流瓶
            </button>
            <button className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              发现漂流瓶
            </button>
            <button className="bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              我的漂流瓶
            </button>
            <button className="border-2 border-ocean-500 text-ocean-600 hover:bg-ocean-500 hover:text-white px-6 py-3 rounded-lg font-semibold transition-all">
              边框按钮
            </button>
          </div>
        </section>

        {/* 漂流瓶卡片展示 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-ocean-800 mb-6">漂流瓶卡片</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 卡片 1 */}
            <div className="bottle-card rounded-xl p-6 animate-float">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-ocean-gradient rounded-full flex items-center justify-center text-white text-xl">
                  🍃
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-ocean-800">匿名用户</h3>
                  <p className="text-sm text-ocean-600">2小时前</p>
                </div>
              </div>
              <p className="text-ocean-700 mb-4">
                今天的夕阳特别美，想和大家分享这份宁静的美好...
              </p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-ocean-500 bg-ocean-100 px-2 py-1 rounded-full">
                  #心情分享
                </span>
                <button className="text-ocean-500 hover:text-ocean-700 transition-colors">
                  💬 回复
                </button>
              </div>
            </div>

            {/* 卡片 2 */}
            <div
              className="bottle-card rounded-xl p-6 animate-float"
              style={{ animationDelay: "1s" }}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-aqua-gradient rounded-full flex items-center justify-center text-white text-xl">
                  🌊
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-ocean-800">海洋旅人</h3>
                  <p className="text-sm text-ocean-600">5小时前</p>
                </div>
              </div>
              <p className="text-ocean-700 mb-4">
                在海边散步时想到了远方的朋友，希望友谊如海洋般深邃...
              </p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-aqua-500 bg-aqua-100 px-2 py-1 rounded-full">
                  #友谊
                </span>
                <button className="text-ocean-500 hover:text-ocean-700 transition-colors">
                  💙 点赞
                </button>
              </div>
            </div>

            {/* 卡片 3 */}
            <div
              className="bottle-card rounded-xl p-6 animate-float"
              style={{ animationDelay: "2s" }}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-deepblue-gradient rounded-full flex items-center justify-center text-white text-xl">
                  ⭐
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-ocean-800">星海拾梦</h3>
                  <p className="text-sm text-ocean-600">1天前</p>
                </div>
              </div>
              <p className="text-ocean-700 mb-4">
                每个人都是独特的，就像海洋中的每一滴水珠都闪闪发光...
              </p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-deepblue-500 bg-deepblue-100 px-2 py-1 rounded-full">
                  #励志
                </span>
                <button className="text-ocean-500 hover:text-ocean-700 transition-colors">
                  🔄 转发
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 输入框展示 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-ocean-800 mb-6">输入框样式</h2>
          <div className="max-w-2xl">
            <div className="mb-4">
              <label className="block text-ocean-700 font-semibold mb-2">
                漂流瓶内容
              </label>
              <textarea
                className="input-ocean w-full p-4 rounded-lg resize-none"
                rows={4}
                placeholder="写下你想分享的心情..."
              />
            </div>
            <div className="mb-4">
              <label className="block text-ocean-700 font-semibold mb-2">
                标签
              </label>
              <input
                type="text"
                className="input-ocean w-full p-3 rounded-lg"
                placeholder="添加标签，例如：心情、生活、感悟"
              />
            </div>
          </div>
        </section>

        {/* 背景渐变展示 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-ocean-800 mb-6">
            背景渐变效果
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-ocean-gradient p-8 rounded-xl text-white text-center">
              <h3 className="text-xl font-bold mb-2">深海渐变</h3>
              <p>bg-ocean-gradient</p>
            </div>
            <div className="bg-ocean-light p-8 rounded-xl text-ocean-800 text-center border border-ocean-200">
              <h3 className="text-xl font-bold mb-2">浅海渐变</h3>
              <p>bg-ocean-light</p>
            </div>
            <div className="bg-ocean-waves p-8 rounded-xl text-white text-center wave-animation">
              <h3 className="text-xl font-bold mb-2">海浪渐变</h3>
              <p>bg-ocean-waves + wave-animation</p>
            </div>
            <div className="bg-deep-ocean p-8 rounded-xl text-white text-center">
              <h3 className="text-xl font-bold mb-2">深海垂直渐变</h3>
              <p>bg-deep-ocean</p>
            </div>
          </div>
        </section>
      </main>

      {/* 页面底部 */}
      <footer className="bg-ocean-800 text-ocean-100 p-6 text-center">
        <p>&copy; 2024 漂流瓶 - 在数字海洋中连接心灵</p>
      </footer>
    </div>
  );
}

// 导出默认组件
export default OceanThemeExample;
