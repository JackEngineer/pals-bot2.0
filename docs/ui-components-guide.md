# 🌊 海洋主题 UI 组件库使用指南

基于 shadcn/ui 架构的海洋主题组件库，为漂流瓶项目提供统一、美观的用户界面组件。

## 📦 安装的依赖

```json
{
  "@radix-ui/react-slot": "^1.2.3",
  "@radix-ui/react-dialog": "^1.1.14",
  "@radix-ui/react-icons": "^1.3.2",
  "class-variance-authority": "^0.7.1"
}
```

## 🎨 组件概览

### 基础组件

- **Button** - 按钮组件，支持多种海洋主题变体
- **Input** - 输入框组件，支持标签、错误状态等
- **Textarea** - 多行文本输入组件
- **Card** - 卡片组件，支持毛玻璃效果
- **Dialog** - 模态对话框组件
- **Badge** - 标签组件，支持多种状态
- **Skeleton** - 骨架屏组件，提供加载状态

## 🚀 快速开始

### 导入组件

```typescript
// 单个导入
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// 批量导入（推荐）
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Dialog,
  DialogContent,
  Badge,
} from "@/components/ui";
```

### 基础使用

```typescript
"use client";

import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui";

export default function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>漂流瓶</CardTitle>
      </CardHeader>
      <CardContent>
        <p>这里是漂流瓶的内容...</p>
        <Button variant="ocean">回复漂流瓶</Button>
      </CardContent>
    </Card>
  );
}
```

## 🌊 海洋主题变体

所有组件都支持海洋主题，主要变体包括：

### 颜色主题

- `ocean` - 主要海洋蓝色（默认）
- `aqua` - 水蓝色
- `deepblue` - 深海蓝色
- `success` - 成功绿色
- `warning` - 警告黄色
- `error` - 错误红色

### 样式变体

- `solid` - 实心样式
- `outline` - 边框样式
- `soft` - 柔和背景样式
- `glass` - 毛玻璃效果

## 📘 组件详细使用

### Button 组件

```typescript
// 基础使用
<Button>默认按钮</Button>

// 不同变体
<Button variant="ocean">海洋主题</Button>
<Button variant="ocean-outline">海洋边框</Button>
<Button variant="aqua">水蓝主题</Button>
<Button variant="success">成功状态</Button>

// 不同尺寸
<Button size="sm">小按钮</Button>
<Button size="md">中按钮</Button>
<Button size="lg">大按钮</Button>
<Button size="xl">超大按钮</Button>

// 加载状态
<Button loading>加载中...</Button>

// 带图标
import { Heart } from "lucide-react";
<Button>
  <Heart className="w-4 h-4 mr-2" />
  收藏
</Button>
```

### Input 组件

```typescript
// 基础使用
<Input placeholder="请输入内容" />

// 带标签和帮助文本
<Input
  label="用户名"
  placeholder="请输入用户名"
  helperText="用户名长度3-20字符"
/>

// 错误状态
<Input
  label="邮箱"
  error="邮箱格式不正确"
  placeholder="example@email.com"
/>

// 不同尺寸
<Input size="sm" placeholder="小尺寸" />
<Input size="lg" placeholder="大尺寸" />
```

### Textarea 组件

```typescript
// 基础使用
<Textarea placeholder="请输入内容..." />

// 带字符计数
<Textarea
  label="消息内容"
  placeholder="写下你想说的话..."
  maxLength={500}
  showCount
/>

// 不同尺寸
<Textarea size="lg" placeholder="大尺寸文本框" />
```

### Card 组件

```typescript
// 基础卡片
<Card>
  <CardHeader>
    <CardTitle>标题</CardTitle>
    <CardDescription>描述文字</CardDescription>
  </CardHeader>
  <CardContent>
    <p>卡片内容</p>
  </CardContent>
  <CardFooter>
    <Button>操作按钮</Button>
  </CardFooter>
</Card>

// 不同样式变体
<Card variant="ocean">海洋主题卡片</Card>
<Card variant="glass">毛玻璃卡片</Card>
<Card variant="gradient">渐变背景卡片</Card>

// 可悬停卡片
<Card hoverable>悬停时有缩放效果</Card>
```

### Dialog 组件

```typescript
import { useState } from "react";

function MyDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>打开对话框</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>对话框标题</DialogTitle>
          <DialogDescription>对话框描述文字</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input label="输入项" placeholder="请输入" />
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="ocean-outline">取消</Button>
          <Button>确认</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Badge 组件

```typescript
// 基础使用
<Badge>默认标签</Badge>

// 不同变体
<Badge variant="ocean">海洋</Badge>
<Badge variant="success">成功</Badge>
<Badge variant="warning">警告</Badge>
<Badge variant="error">错误</Badge>

// 边框样式
<Badge variant="ocean-outline">海洋边框</Badge>
<Badge variant="success-outline">成功边框</Badge>

// 柔和样式
<Badge variant="ocean-soft">海洋柔和</Badge>
<Badge variant="success-soft">成功柔和</Badge>

// 不同尺寸
<Badge size="sm">小标签</Badge>
<Badge size="lg">大标签</Badge>
```

### Skeleton 组件

```typescript
// 基础骨架屏
<Skeleton className="h-4 w-full" />
<Skeleton className="h-4 w-3/4" />

// 预定义骨架屏
<SkeletonCard />
<SkeletonBottleCard />
<SkeletonText lines={3} />
<SkeletonAvatar />
<SkeletonButton />

// 不同主题
<Skeleton variant="ocean" className="h-8 w-24" />
<Skeleton variant="light" className="h-8 w-24" />
```

## 🎯 实际应用示例

### 漂流瓶卡片

```typescript
function BottleCard({ bottle, onReply, onLike }) {
  return (
    <Card variant="ocean" hoverable>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          🫙 漂流瓶
          <Badge variant="ocean-soft">2小时前</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-ocean-50 rounded-xl p-4 border-l-4 border-ocean-400">
          <p className="text-ocean-800">{bottle.content}</p>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="success" size="sm" onClick={onReply}>
          💬 回复
        </Button>
        <Button variant="ocean-outline" size="sm" onClick={onLike}>
          ❤️ 收藏
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### 创建漂流瓶表单

```typescript
function CreateBottleForm({ onSubmit }) {
  const [content, setContent] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>投递漂流瓶</CardTitle>
        <CardDescription>写下你想分享的心情或故事</CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          label="瓶中内容"
          placeholder="写下你想说的话..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={1000}
          showCount
        />
      </CardContent>
      <CardFooter>
        <Button
          variant="ocean"
          onClick={() => onSubmit(content)}
          disabled={!content.trim()}
        >
          🌊 投入大海
        </Button>
      </CardFooter>
    </Card>
  );
}
```

## 🔧 迁移现有组件

### 替换内联样式

```typescript
// 旧方式 ❌
<button className="bg-ocean-500 hover:bg-ocean-600 text-white px-6 py-2 rounded-lg">
  按钮
</button>

// 新方式 ✅
<Button variant="ocean">按钮</Button>
```

### 替换自定义卡片

```typescript
// 旧方式 ❌
<div className="bg-white/90 backdrop-blur-sm border border-ocean-200 rounded-xl shadow-lg p-6">
  <h3 className="text-lg font-semibold text-ocean-800">标题</h3>
  <p className="text-ocean-600">内容</p>
</div>

// 新方式 ✅
<Card variant="ocean">
  <CardHeader>
    <CardTitle>标题</CardTitle>
  </CardHeader>
  <CardContent>
    <p>内容</p>
  </CardContent>
</Card>
```

## 🎨 自定义主题

组件支持通过 className 进行进一步自定义：

```typescript
// 自定义样式
<Button
  variant="ocean"
  className="w-full shadow-2xl transform hover:scale-105"
>
  自定义按钮
</Button>

// 组合多个 variant
<Card
  variant="glass"
  className="border-2 border-ocean-300"
>
  自定义卡片
</Card>
```

## 📱 响应式设计

所有组件都支持响应式设计：

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>卡片1</Card>
  <Card>卡片2</Card>
  <Card>卡片3</Card>
</div>

<Button className="w-full md:w-auto">
  响应式按钮
</Button>
```

## 🔍 测试页面

访问 `/ui-showcase` 页面查看所有组件的实际效果和使用示例。

## 💡 最佳实践

1. **统一性**: 在同一功能模块中使用相同的变体
2. **可访问性**: 为按钮和表单元素添加适当的 aria-label
3. **性能**: 使用 Skeleton 组件提升加载体验
4. **主题一致**: 优先使用海洋主题变体保持设计一致性
5. **响应式**: 考虑移动端体验，使用合适的尺寸

## 🚀 进阶使用

### 组合使用 Framer Motion

```typescript
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  <Card variant="ocean">
    <CardContent>
      <p>带动画的卡片</p>
    </CardContent>
  </Card>
</motion.div>;
```

### 与表单库集成

```typescript
import { useForm } from "react-hook-form";

function MyForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register("username", { required: "用户名必填" })}
        label="用户名"
        error={errors.username?.message}
      />
      <Button type="submit">提交</Button>
    </form>
  );
}
```

现在你拥有了一套完整的海洋主题 UI 组件库！🌊
