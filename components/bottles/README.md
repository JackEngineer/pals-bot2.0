# 漂流瓶动画组件文档

## 概述

`BottleLoadingAnimation` 是一个专为漂流瓶应用设计的加载动画组件，提供两种不同的动画效果：

1. **捞取瓶子动画** (`picking`): 展示钓鱼场景，包含钓竿、鱼线、鱼钩和漂浮瓶子
2. **等待发现瓶子动画** (`waiting`): 展示海面上漂浮的各种瓶子，引导用户点击捞瓶子

## 功能特性

### 捞取瓶子动画 (Picking Animation)

- **钓鱼场景**: 完整的钓鱼竿、鱼线、旋转鱼钩
- **动态海面**: 多层波浪效果，营造真实海洋感觉
- **漂浮瓶子**: 多个不同颜色的瓶子在海底漂浮
- **气泡效果**: 上升的气泡增加 underwater 感觉
- **动态提示**: 钓鱼表情符号和加载点动画

### 等待发现瓶子动画 (Waiting Animation)

- **丰富的瓶子**: 5 个不同颜色、大小的漂流瓶
- **软木塞细节**: 每个瓶子都有逼真的软木塞
- **漂浮运动**: 瓶子以不同速度和轨迹漂浮
- **神秘光点**: 闪烁的光点暗示有宝藏等待发现
- **交互提示**: 波浪表情符号和向下箭头引导用户

## 使用方法

```tsx
import { BottleLoadingAnimation } from '@/components/bottles/BottleLoadingAnimation';

// 捞取状态
<BottleLoadingAnimation
  type="picking"
  message="正在捞瓶子......"
/>

// 等待状态
<BottleLoadingAnimation
  type="waiting"
  message="海面上漂浮着许多故事..."
/>
```

## Props

| 属性      | 类型                     | 默认值 | 描述           |
| --------- | ------------------------ | ------ | -------------- |
| `type`    | `'picking' \| 'waiting'` | 必需   | 动画类型       |
| `message` | `string`                 | 可选   | 自定义提示文字 |

## 动画效果详解

### 动画延迟系统

组件使用了精心设计的动画延迟系统，确保各元素错开动画，形成层次感：

- `animation-delay-200`: 0.2 秒延迟
- `animation-delay-500`: 0.5 秒延迟
- `animation-delay-1000`: 1 秒延迟
- `animation-delay-1500`: 1.5 秒延迟
- `animation-delay-2000`: 2 秒延迟
- `animation-delay-2500`: 2.5 秒延迟
- `animation-delay-3000`: 3 秒延迟
- `animation-delay-4000`: 4 秒延迟

### 使用的动画类

#### Tailwind 内置动画

- `animate-bounce`: 弹跳效果 (表情符号、气泡)
- `animate-pulse`: 脉冲效果 (鱼线、加载点)
- `animate-spin`: 旋转效果 (鱼钩)
- `animate-ping`: 放大闪烁效果 (神秘光点)

#### 自定义动画 (在 globals.css 中定义)

- `animate-wave`: 波浪效果
- `animate-wave-slow`: 慢波浪效果
- `animate-float`: 漂浮效果

## 海洋主题设计

### 颜色方案

- **海洋蓝系**: `ocean-200` 到 `ocean-500`
- **瓶子多样性**: 绿色、蓝色、紫色、玫瑰色、青色
- **软木塞**: 温暖的琥珀色 (`amber-600`)
- **高光效果**: 白色半透明层模拟玻璃反光

### 尺寸设计

- **捞取场景**: 64x40 (256px x 160px)
- **等待场景**: 80x32 (320px x 128px)
- **瓶子尺寸**: 4-8 宽度单位，6-10 高度单位
- **软木塞**: 统一 1x2 尺寸

## 性能优化

### 轻量化设计

- 纯 CSS 动画，无 JavaScript 计算
- 使用 Tailwind 原子类，减少自定义 CSS
- 优化动画帧数，平衡流畅度和性能

### 响应式考虑

- 使用相对单位确保在不同屏幕下正常显示
- 动画元素使用绝对定位避免布局抖动
- 合理的容器尺寸适配移动端

## 扩展建议

### 可能的改进

1. **音效集成**: 添加海浪声、钓鱼声效
2. **粒子效果**: 更复杂的气泡和水花效果
3. **触摸交互**: 允许用户拖拽瓶子或鱼竿
4. **主题变化**: 根据时间显示不同的海洋场景
5. **成功动画**: 钓到瓶子时的特殊效果

### 自定义开发

可以基于现有组件创建其他海洋主题动画：

- 鲸鱼游过的动画
- 海鸥飞翔的动画
- 灯塔闪烁的动画
- 船只经过的动画

## 技术实现

### 关键技术点

1. **CSS Transform**: 实现旋转、缩放、位移
2. **CSS Opacity**: 实现淡入淡出和层次效果
3. **CSS Animation**: 结合 `@keyframes` 实现复杂动画
4. **Absolute Positioning**: 精确控制元素位置
5. **Z-index 层次**: 确保元素正确层叠

### 兼容性

- 支持现代浏览器 (Chrome 60+, Safari 12+, Firefox 55+)
- 移动端 Safari 和 Chrome 测试通过
- 自动降级到静态效果在不支持动画的环境

## 使用示例

在主页中的完整使用示例：

```tsx
// app/home/page.tsx
{
  currentBottle ? (
    <BottleCard bottle={currentBottle} />
  ) : (
    <BottleLoadingAnimation
      type={pickLoading ? "picking" : "waiting"}
      message={pickLoading ? "正在捞瓶子......" : "海面上漂浮着许多故事..."}
    />
  );
}
```

这样的设计确保了用户在等待时也能享受到愉悦的视觉体验，增强了应用的交互性和趣味性。
