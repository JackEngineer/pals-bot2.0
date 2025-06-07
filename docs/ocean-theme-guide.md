# 🌊 海洋主题使用指南

漂流瓶项目现在使用海洋蓝色主题，营造温暖、宁静的海洋氛围。

## 📋 颜色系统

### 主要色系

#### Ocean（海洋蓝）- 主色系

```css
ocean-50:  #f0f9ff  /* 最浅的海蓝，用于背景 */
ocean-100: #e0f2fe  /* 浅海蓝，用于卡片背景 */
ocean-200: #bae6fd  /* 淡海蓝，用于边框 */
ocean-300: #7dd3fc  /* 中等海蓝 */
ocean-400: #38bdf8  /* 鲜明海蓝 */
ocean-500: #0ea5e9  /* 标准海蓝，主要颜色 */
ocean-600: #0284c7  /* 深海蓝，悬停状态 */
ocean-700: #0369a1  /* 更深海蓝 */
ocean-800: #075985  /* 深蓝，用于文本 */
ocean-900: #0c4a6e  /* 最深海蓝 */
```

#### Aqua（水蓝）- 辅助色系

```css
aqua-50:  #ecfeff  /* 清澈水蓝 */
aqua-100: #cffafe  /* 浅水蓝 */
aqua-200: #a5f3fc  /* 淡水蓝 */
aqua-300: #67e8f9  /* 中等水蓝 */
aqua-400: #22d3ee  /* 鲜明水蓝 */
aqua-500: #06b6d4  /* 标准水蓝 */
aqua-600: #0891b2  /* 深水蓝 */
aqua-700: #0e7490  /* 更深水蓝 */
aqua-800: #155e75  /* 深青蓝 */
aqua-900: #164e63  /* 最深青蓝 */
```

#### Deep Blue（深海蓝）- 强调色系

```css
deepblue-50:  #eff6ff  /* 浅天蓝 */
deepblue-100: #dbeafe  /* 淡天蓝 */
deepblue-200: #bfdbfe  /* 明亮天蓝 */
deepblue-300: #93c5fd  /* 中等天蓝 */
deepblue-400: #60a5fa  /* 鲜明天蓝 */
deepblue-500: #3b82f6  /* 标准蓝 */
deepblue-600: #2563eb  /* 深蓝 */
deepblue-700: #1d4ed8  /* 更深蓝 */
deepblue-800: #1e40af  /* 深海蓝 */
deepblue-900: #1e3a8a  /* 最深蓝 */
```

## 🎨 背景渐变

### 预定义渐变背景

```css
/* 深海渐变 - 用于头部区域 */
bg-ocean-gradient

/* 浅海渐变 - 用于页面背景 */
bg-ocean-light

/* 海浪渐变 - 用于特殊区域 */
bg-ocean-waves

/* 深海垂直渐变 - 用于强调区域 */
bg-deep-ocean

/* 水面波纹效果 - 添加纹理 */
bg-water-ripple
```

## ✨ 动画效果

### 海洋主题动画

```css
/* 海浪上下浮动 */
animate-wave

/* 缓慢海浪效果 */
animate-wave-slow

/* 漂浮动画（适合漂流瓶） */
animate-float

/* 水波纹扩散效果 */
animate-ripple
```

## 🧩 组件样式类

### 漂流瓶卡片

```jsx
<div className="bottle-card rounded-xl p-6">{/* 卡片内容 */}</div>
```

### 海洋主题按钮

```jsx
{
  /* 主要按钮 */
}
<button className="btn-ocean px-6 py-3 rounded-lg">投递漂流瓶</button>;

{
  /* 次要按钮 */
}
<button className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg">
  发现漂流瓶
</button>;

{
  /* 边框按钮 */
}
<button className="border-2 border-ocean-500 text-ocean-600 hover:bg-ocean-500 hover:text-white px-6 py-3 rounded-lg">
  边框按钮
</button>;
```

### 海洋主题输入框

```jsx
<input className="input-ocean w-full p-3 rounded-lg" />
<textarea className="input-ocean w-full p-4 rounded-lg" />
```

### 水波纹点击效果

```jsx
<button className="ripple-effect px-6 py-3 rounded-lg">点击有水波纹效果</button>
```

## 🌊 特殊效果类

### 海洋背景

```jsx
{
  /* 带动画的海洋背景 */
}
<div className="ocean-background wave-animation">{/* 内容 */}</div>;
```

### 波浪动画

```jsx
{
  /* 添加波浪扫过效果 */
}
<div className="wave-animation">{/* 内容 */}</div>;
```

## 📱 使用示例

### 页面布局

```jsx
function BottlePage() {
  return (
    <div className="min-h-screen bg-ocean-light">
      {/* 页面头部 */}
      <header className="ocean-background wave-animation p-6 text-white">
        <h1 className="text-3xl font-bold">🌊 漂流瓶</h1>
      </header>

      {/* 主要内容 */}
      <main className="container mx-auto px-4 py-8">
        {/* 漂流瓶卡片 */}
        <div className="bottle-card rounded-xl p-6 animate-float">
          <h3 className="text-ocean-800 font-semibold">漂流瓶标题</h3>
          <p className="text-ocean-700">漂流瓶内容...</p>
        </div>
      </main>

      {/* 页面底部 */}
      <footer className="bg-ocean-800 text-ocean-100 p-6">
        <p>© 2024 漂流瓶</p>
      </footer>
    </div>
  );
}
```

### 表单组件

```jsx
function BottleForm() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bottle-card rounded-xl p-6">
        <h2 className="text-xl font-bold text-ocean-800 mb-4">
          投递新的漂流瓶
        </h2>

        <textarea
          className="input-ocean w-full p-4 rounded-lg mb-4"
          placeholder="写下你想分享的心情..."
          rows={4}
        />

        <button className="btn-ocean w-full py-3 rounded-lg ripple-effect">
          投递到海洋中
        </button>
      </div>
    </div>
  );
}
```

## 🎯 最佳实践

### 颜色使用建议

- **主要文本**: `text-ocean-800` 或 `text-ocean-900`
- **次要文本**: `text-ocean-600` 或 `text-ocean-700`
- **辅助文本**: `text-ocean-500`
- **背景**: `bg-ocean-50` 或 `bg-ocean-100`
- **卡片背景**: `bottle-card` 类（带透明度和模糊效果）
- **按钮**: `btn-ocean` 类或 `bg-primary-500`

### 响应式设计

```jsx
{
  /* 响应式网格 */
}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* 内容 */}
</div>;

{
  /* 响应式间距 */
}
<div className="p-4 md:p-6 lg:p-8">{/* 内容 */}</div>;
```

### 动画使用

- 页面元素使用 `animate-float` 营造漂浮感
- 按钮使用 `ripple-effect` 增加交互反馈
- 背景区域使用 `wave-animation` 增加动态效果

## 🔧 技术细节

### CSS 变量

项目定义了以下 CSS 变量供使用：

```css
--ocean-primary: 14, 165, 233
--ocean-secondary: 6, 182, 212
--ocean-light: 240, 249, 255
--ocean-dark: 12, 74, 110
```

### 深色模式支持

主题自动适配深色模式，使用更深的海洋色调：

```css
@media (prefers-color-scheme: dark) {
  /* 深色模式样式自动生效 */
}
```

## 🚀 开始使用

1. 所有海洋主题样式已在 `tailwind.config.js` 中配置
2. 全局样式在 `app/globals.css` 中定义
3. 可以直接在组件中使用这些类名
4. 参考 `components/ocean-theme-example.tsx` 查看使用示例

现在你可以在整个项目中使用这些海洋主题的样式类，营造温暖、宁静的海洋氛围！🌊
