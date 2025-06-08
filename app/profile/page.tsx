"use client";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-ocean-light ocean-background">
      {/* 海洋波纹背景层 */}
      <div className="absolute inset-0 bg-water-ripple opacity-30"></div>

      <div className="relative z-10 p-4">
        {/* 个人信息卡片 */}
        <div className="space-y-4">
          <div className="bottle-card rounded-2xl p-4 text-center">
            <div className="text-6xl mb-4">⚙️</div>
            <h3 className="text-lg font-semibold text-ocean-800 mb-2">
              功能完善中
            </h3>
            <p className="text-ocean-600 text-sm">
              个人中心功能正在开发，将为您提供完整的用户体验！
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
