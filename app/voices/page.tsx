"use client";

export default function VoicesPage() {
  return (
    <div className="min-h-screen bg-ocean-light ocean-background pb-20">
      {/* 海洋波纹背景层 */}
      <div className="absolute inset-0 bg-water-ripple opacity-30"></div>

      <div className="relative z-10 p-4">
        {/* 页面标题 */}
        <div className="text-center py-6">
          <h1 className="text-2xl font-bold text-ocean-800 mb-2">
            🎭 心声树洞
          </h1>
          <p className="text-ocean-600 text-sm">
            倾听内心的声音，匿名分享真实感受
          </p>
        </div>

        {/* 心声列表占位 */}
        <div className="space-y-4">
          <div className="bottle-card rounded-2xl p-4 text-center">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-lg font-semibold text-ocean-800 mb-2">
              即将上线
            </h3>
            <p className="text-ocean-600 text-sm">
              心声树洞功能正在精心开发中，即将为您带来更好的体验！
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
