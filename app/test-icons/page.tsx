"use client";

import {
  Home,
  MessageCircle,
  Heart,
  User,
  Settings,
  Star,
  Eye,
  Clock,
  RotateCcw,
  Plus,
  Edit,
  Waves,
  Droplets,
  Compass,
  Anchor,
  Ship,
  Fish,
  CheckCircle,
  AlertCircle,
  Info,
  Search,
  Filter,
} from "lucide-react";
import Icon from "@/components/ui/Icon";

export default function TestIconsPage() {
  const iconCategories = [
    {
      title: "🏠 导航图标",
      icons: [
        { icon: Home, name: "Home" },
        { icon: User, name: "User" },
        { icon: Settings, name: "Settings" },
      ],
    },
    {
      title: "💬 社交图标",
      icons: [
        { icon: MessageCircle, name: "MessageCircle" },
        { icon: Heart, name: "Heart" },
        { icon: Star, name: "Star" },
      ],
    },
    {
      title: "🌊 海洋主题图标",
      icons: [
        { icon: Waves, name: "Waves" },
        { icon: Droplets, name: "Droplets" },
        { icon: Compass, name: "Compass" },
        { icon: Anchor, name: "Anchor" },
        { icon: Ship, name: "Ship" },
        { icon: Fish, name: "Fish" },
      ],
    },
    {
      title: "⚡ 功能图标",
      icons: [
        { icon: Eye, name: "Eye" },
        { icon: Clock, name: "Clock" },
        { icon: RotateCcw, name: "RotateCcw" },
        { icon: Plus, name: "Plus" },
        { icon: Edit, name: "Edit" },
        { icon: Search, name: "Search" },
      ],
    },
    {
      title: "🚦 状态图标",
      icons: [
        { icon: CheckCircle, name: "CheckCircle" },
        { icon: AlertCircle, name: "AlertCircle" },
        { icon: Info, name: "Info" },
      ],
    },
  ];

  const sizes = [
    { key: "sm", label: "小号 (16px)", size: "sm" as const },
    { key: "md", label: "中号 (20px)", size: "md" as const },
    { key: "lg", label: "大号 (24px)", size: "lg" as const },
    { key: "xl", label: "特大 (32px)", size: "xl" as const },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-50 to-cyan-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ocean-800 mb-4 flex items-center justify-center gap-3">
            <Icon icon={Waves} size="lg" className="text-ocean-500" />
            Lucide React 图标测试
            <Icon icon={Star} size="lg" className="text-yellow-500" />
          </h1>
          <p className="text-ocean-600">
            展示项目中集成的 lucide-react 图标库使用效果
          </p>
        </div>

        {/* 尺寸演示 */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-lg">
          <h2 className="text-xl font-semibold text-ocean-800 mb-4 flex items-center gap-2">
            <Icon icon={Settings} size="md" />
            图标尺寸示例
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sizes.map((size) => (
              <div
                key={size.key}
                className="text-center p-4 bg-ocean-50 rounded-lg"
              >
                <Icon
                  icon={Heart}
                  size={size.size}
                  className="text-red-500 mx-auto mb-2"
                />
                <p className="text-sm text-ocean-700">{size.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 颜色主题演示 */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-lg">
          <h2 className="text-xl font-semibold text-ocean-800 mb-4 flex items-center gap-2">
            <Icon icon={Droplets} size="md" />
            海洋主题色彩
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Icon
                icon={Waves}
                size="lg"
                className="text-ocean-400 mx-auto mb-2"
              />
              <p className="text-xs">ocean-400</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Icon
                icon={Waves}
                size="lg"
                className="text-ocean-500 mx-auto mb-2"
              />
              <p className="text-xs">ocean-500</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Icon
                icon={Waves}
                size="lg"
                className="text-cyan-400 mx-auto mb-2"
              />
              <p className="text-xs">cyan-400</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Icon
                icon={Waves}
                size="lg"
                className="text-teal-500 mx-auto mb-2"
              />
              <p className="text-xs">teal-500</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Icon
                icon={Waves}
                size="lg"
                className="text-blue-500 mx-auto mb-2"
              />
              <p className="text-xs">blue-500</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Icon
                icon={Waves}
                size="lg"
                className="text-indigo-500 mx-auto mb-2"
              />
              <p className="text-xs">indigo-500</p>
            </div>
          </div>
        </div>

        {/* 图标分类展示 */}
        <div className="grid gap-6">
          {iconCategories.map((category, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-ocean-800 mb-4">
                {category.title}
              </h2>
              <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {category.icons.map((iconData, iconIndex) => (
                  <div
                    key={iconIndex}
                    className="text-center p-3 bg-ocean-50 hover:bg-ocean-100 
                               rounded-lg transition-colors duration-200 cursor-pointer
                               border-2 border-transparent hover:border-ocean-300"
                  >
                    <Icon
                      icon={iconData.icon}
                      size="lg"
                      className="text-ocean-600 hover:text-ocean-800 mx-auto mb-2 
                                 transition-colors duration-200"
                    />
                    <p className="text-xs text-ocean-700 font-medium">
                      {iconData.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 实际使用示例 */}
        <div className="bg-white rounded-xl p-6 mt-8 shadow-lg">
          <h2 className="text-xl font-semibold text-ocean-800 mb-4 flex items-center gap-2">
            <Icon icon={CheckCircle} size="md" className="text-green-500" />
            实际应用示例
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* 按钮示例 */}
            <div>
              <h3 className="font-medium text-ocean-700 mb-3">功能按钮</h3>
              <div className="space-y-3">
                <button
                  className="w-full flex items-center justify-center gap-2 
                                 bg-ocean-500 hover:bg-ocean-600 text-white 
                                 py-2 px-4 rounded-lg transition-colors"
                >
                  <Icon icon={Plus} size="sm" />
                  创建新内容
                </button>
                <button
                  className="w-full flex items-center justify-center gap-2 
                                 bg-green-500 hover:bg-green-600 text-white 
                                 py-2 px-4 rounded-lg transition-colors"
                >
                  <Icon icon={MessageCircle} size="sm" />
                  发送消息
                </button>
                <button
                  className="w-full flex items-center justify-center gap-2 
                                 bg-red-500 hover:bg-red-600 text-white 
                                 py-2 px-4 rounded-lg transition-colors"
                >
                  <Icon icon={Heart} size="sm" />
                  收藏内容
                </button>
              </div>
            </div>

            {/* 状态提示示例 */}
            <div>
              <h3 className="font-medium text-ocean-700 mb-3">状态提示</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <Icon
                    icon={CheckCircle}
                    size="sm"
                    className="text-green-600"
                  />
                  <span className="text-green-800">操作成功完成</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Icon
                    icon={AlertCircle}
                    size="sm"
                    className="text-yellow-600"
                  />
                  <span className="text-yellow-800">请注意相关提示</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Icon icon={Info} size="sm" className="text-blue-600" />
                  <span className="text-blue-800">这是一条信息提示</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 混合使用示例 */}
        <div className="bg-white rounded-xl p-6 mt-8 shadow-lg">
          <h2 className="text-xl font-semibold text-ocean-800 mb-4">
            🎨 Emoji + Lucide 混合使用
          </h2>
          <p className="text-ocean-600 mb-4">
            项目中采用的混合策略：保留 Emoji 的趣味性，使用 Lucide 提升专业性
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-ocean-50 rounded-lg">
              <h3 className="font-medium text-ocean-700 mb-3">🌊 导航示例</h3>
              <div className="flex justify-around">
                <div className="relative text-center">
                  <div className="absolute -top-1 -right-1">
                    <Icon icon={Home} size="sm" className="text-ocean-400/60" />
                  </div>
                  <div className="text-2xl mb-1">🏖️</div>
                  <span className="text-xs text-ocean-700">海边</span>
                </div>
                <div className="relative text-center">
                  <div className="absolute -top-1 -right-1">
                    <Icon
                      icon={MessageCircle}
                      size="sm"
                      className="text-ocean-400/60"
                    />
                  </div>
                  <div className="text-2xl mb-1">💭</div>
                  <span className="text-xs text-ocean-700">聊天</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-ocean-50 rounded-lg">
              <h3 className="font-medium text-ocean-700 mb-3">⚡ 操作示例</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Icon icon={Clock} size="sm" className="text-ocean-400" />
                  <span>2小时前</span>
                  <span>💫</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Icon icon={Star} size="sm" className="text-yellow-500" />
                  <span>收藏</span>
                  <span>⭐</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
