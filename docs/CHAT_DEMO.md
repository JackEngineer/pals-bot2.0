# 匿名聊天功能演示

## ✨ 功能特点

### 🔐 完全匿名

- 无需 Telegram 身份认证
- 无需权限验证
- 保护用户隐私

### 🎲 随机匹配

- 一键随机匹配陌生人
- 智能排除已聊过的用户
- 即时开始对话

### 💬 实时聊天

- 发送文本消息
- 消息状态显示（已发送/已读）
- 流畅的 UI 动画效果

### 🌊 海洋主题设计

- 符合项目整体设计风格
- 使用项目现有的 CSS 类
- 响应式移动端界面

## 🚀 如何使用

### 1. 进入聊天页面

访问 `/chat` 页面

### 2. 开始随机聊天

- 点击 "🎲 开始随机聊天" 按钮
- 系统会自动匹配一个陌生用户
- 立即进入聊天界面

### 3. 发送消息

- 在输入框中输入消息
- 按 Enter 键或点击发送按钮
- 支持多行文本（Shift+Enter 换行）

### 4. 管理对话

- 查看对话列表
- 切换不同的对话
- 查看未读消息提示

## 🔧 技术实现

### API 端点

#### 会话管理

```
GET  /api/chat/conversations?userId={userId}     # 获取会话列表
POST /api/chat/conversations                     # 创建新会话
```

#### 消息管理

```
GET  /api/chat/conversations/{id}/messages?userId={userId}  # 获取消息
POST /api/chat/conversations/{id}/messages                  # 发送消息
```

#### 随机匹配

```
POST /api/chat/random                            # 随机匹配聊天
```

### 组件结构

```
app/chat/page.tsx                    # 聊天主页面
├── components/chat/ConversationList # 会话列表组件
└── components/chat/ChatWindow       # 聊天窗口组件

hooks/useChatActions.ts              # 聊天相关的hooks
```

### 数据流

1. 用户点击随机匹配按钮
2. 调用 `/api/chat/random` API
3. 系统随机选择一个活跃用户
4. 创建或获取现有会话
5. 返回会话信息并跳转到聊天界面

## 📝 使用示例

### 测试场景 1：首次使用

1. 用户 A 进入聊天页面（空状态）
2. 点击"开始随机聊天"
3. 系统匹配到用户 B
4. 立即进入聊天界面
5. 可以开始发送消息

### 测试场景 2：多个对话

1. 用户已有多个对话
2. 在会话列表顶部点击"🎲 开始随机聊天"
3. 系统匹配新用户
4. 创建新会话并进入聊天

### 测试场景 3：消息交互

1. 发送文本消息
2. 查看消息状态（✓ 已发送，✓✓ 已读）
3. 实时滚动到最新消息
4. 返回会话列表查看预览

## ⚙️ 配置要求

### 数据库模型

确保以下 Prisma 模型已正确配置：

- `User` - 用户信息
- `Conversation` - 会话记录
- `Message` - 消息内容

### 环境变量

无需特殊环境变量（已移除认证要求）

### 依赖包

- `@prisma/client` - 数据库操作
- `framer-motion` - 动画效果
- `zustand` - 状态管理

## 🎨 UI/UX 特点

### 海洋主题

- 使用项目统一的海洋色彩系统
- `ocean-button`、`bottle-card` 等 CSS 类
- 波纹背景效果

### 响应式设计

- 移动端优先设计
- 触摸友好的按钮尺寸
- 流畅的页面切换动画

### 用户反馈

- 加载状态指示
- 发送中状态显示
- 错误提示处理
- 空状态引导

## 🔮 未来扩展

### 可能的改进

1. **消息类型扩展**

   - 图片消息
   - 语音消息
   - 表情符号

2. **匹配算法优化**

   - 基于兴趣匹配
   - 地理位置筛选
   - 活跃度权重

3. **用户体验**

   - 消息搜索功能
   - 对话备注
   - 消息撤回

4. **安全功能**
   - 举报功能
   - 内容过滤
   - 用户屏蔽

这个匿名聊天功能为漂流瓶应用增加了实时社交的维度，让用户可以更直接地与陌生人交流，体验不同的社交方式。
