# 🎨 Lucide React 图标使用指南

## 📋 概述

本项目已集成 `lucide-react` 图标库，提供了超过 1000+ 的精美 SVG 图标。我们采用混合图标策略：

- **Emoji 表情符号**: 用于表达情感和主题特色 (如海洋主题 🌊)
- **Lucide 图标**: 用于功能性操作和界面元素

## 🔧 安装与配置

### 已安装的包

```json
{
  "lucide-react": "^0.513.0",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.3.0"
}
```

### 通用图标组件

我们创建了一个通用的 `Icon` 组件来统一管理图标样式：

```typescript
// components/ui/Icon.tsx
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconProps {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  color?: string;
}

export function Icon({
  icon: IconComponent,
  size = "md",
  className,
  ...props
}: IconProps) {
  return <IconComponent className={cn(sizeMap[size], className)} {...props} />;
}
```

## 📱 使用示例

### 1. 导航栏图标混合使用

在 `components/navigation/BottomNav.tsx` 中，我们展示了如何混合使用 Emoji 和 Lucide 图标：

```typescript
import { Home, MessageCircle, Heart, User } from "lucide-react";
import Icon from "@/components/ui/Icon";

const navItems = [
  {
    label: "海边",
    icon: "🌊", // Emoji 主图标
    emoji: "🏖️", // 激活状态 Emoji
    lucideIcon: Home, // Lucide 装饰图标
    path: "/home",
  },
  // ...
];

// 渲染时同时显示两种图标
<button className="relative">
  {/* Lucide 图标作为装饰 */}
  <div className="absolute -top-1 -right-1">
    <Icon icon={item.lucideIcon} size="sm" className="text-ocean-400/60" />
  </div>

  {/* Emoji 作为主要图标 */}
  <div className="text-lg">{active ? item.emoji : item.icon}</div>

  <span>{item.label}</span>
</button>;
```

### 2. 漂流瓶卡片功能图标

在 `components/bottles/BottleCard.tsx` 中使用功能性图标：

```typescript
import { MessageCircle, RotateCcw, Star, Eye, Clock } from "lucide-react";

// 操作按钮
<div className="flex gap-3">
  <button className="flex items-center gap-2">
    <Icon icon={MessageCircle} size="sm" />
    回复
  </button>

  <button className="flex items-center gap-2">
    <Icon icon={RotateCcw} size="sm" />
    扔回大海
  </button>

  <button className="flex items-center gap-2">
    <Icon icon={Star} size="sm" />
    收藏
  </button>
</div>

// 时间显示
<div className="flex items-center gap-1">
  <Icon icon={Clock} size="sm" className="text-ocean-400" />
  <span>2小时前</span>
</div>
```

## 🎯 推荐图标分类

### 导航类图标

```typescript
import {
  Home,
  User,
  Settings,
  Menu,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
```

### 操作类图标

```typescript
import {
  Plus,
  Minus,
  Edit,
  Delete,
  Save,
  Cancel,
  Check,
  X,
  Search,
  Filter,
  MoreHorizontal,
} from "lucide-react";
```

### 社交类图标

```typescript
import {
  MessageCircle,
  Heart,
  Star,
  Share,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  Users,
  UserPlus,
} from "lucide-react";
```

### 媒体类图标

```typescript
import {
  Image,
  Camera,
  Mic,
  Volume2,
  Play,
  Pause,
  Download,
  Upload,
  File,
  Paperclip,
} from "lucide-react";
```

### 状态类图标

```typescript
import {
  Clock,
  Calendar,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Lock,
  Unlock,
} from "lucide-react";
```

## 🌊 海洋主题建议

### 适合海洋主题的 Lucide 图标

```typescript
import {
  Waves, // 波浪
  Droplets, // 水滴
  CloudRain, // 雨云
  Wind, // 风
  Compass, // 指南针
  Anchor, // 锚
  Ship, // 船
  Fish, // 鱼
  Shell, // 贝壳
} from "lucide-react";
```

### 颜色搭配

```typescript
// 海洋主题颜色类
<Icon
  icon={Waves}
  className="text-ocean-500"
  size="md"
/>

<Icon
  icon={Droplets}
  className="text-cyan-400"
  size="lg"
/>
```

## ✨ 最佳实践

### 1. 图标尺寸标准化

```typescript
// 使用预定义尺寸
<Icon icon={Home} size="sm" />  // 16x16px
<Icon icon={Home} size="md" />  // 20x20px
<Icon icon={Home} size="lg" />  // 24x24px
<Icon icon={Home} size="xl" />  // 32x32px
```

### 2. 一致的颜色主题

```typescript
// 遵循项目色彩系统
<Icon icon={Star} className="text-ocean-500" />
<Icon icon={Heart} className="text-red-500" />
<Icon icon={Check} className="text-green-500" />
```

### 3. 语义化使用

```typescript
// 功能明确的图标搭配
<button>
  <Icon icon={MessageCircle} size="sm" />
  <span>发送消息</span>
</button>

<div className="status">
  <Icon icon={CheckCircle} className="text-green-500" />
  <span>操作成功</span>
</div>
```

### 4. 响应式设计

```typescript
// 不同屏幕尺寸使用不同图标大小
<Icon icon={Menu} className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
```

## 🔮 扩展使用

### 自定义图标组合

```typescript
// 创建复合图标组件
export function OceanIcon({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Icon icon={Waves} className="text-ocean-500" />
      <Icon
        icon={Droplets}
        className="absolute -top-1 -right-1 text-cyan-400"
        size="sm"
      />
    </div>
  );
}
```

### 动画效果

```typescript
// 结合 Tailwind 动画
<Icon
  icon={Heart}
  className="transition-colors duration-200 hover:text-red-500"
/>

<Icon
  icon={Star}
  className="animate-pulse text-yellow-500"
/>
```

## 📚 常用图标速查

| 功能 | 图标            | 用途       |
| ---- | --------------- | ---------- |
| 主页 | `Home`          | 导航       |
| 消息 | `MessageCircle` | 聊天、评论 |
| 喜欢 | `Heart`         | 点赞、收藏 |
| 分享 | `Share`         | 社交分享   |
| 设置 | `Settings`      | 配置页面   |
| 搜索 | `Search`        | 搜索功能   |
| 添加 | `Plus`          | 创建内容   |
| 编辑 | `Edit`          | 修改内容   |
| 删除 | `Trash`         | 删除操作   |
| 保存 | `Save`          | 保存数据   |
| 时间 | `Clock`         | 时间显示   |
| 用户 | `User`          | 个人资料   |

## 🎨 与项目主题集成

记住我们的混合策略：

- **保留 Emoji**: 🌊、🏖️、💭、🎭 等表达海洋主题和情感
- **使用 Lucide**: 用于按钮、状态、操作等功能性元素
- **色彩一致**: 使用项目定义的海洋色系 (ocean-_, cyan-_, teal-\*)

这样既保持了项目的趣味性和特色，又提升了界面的专业性和一致性。
