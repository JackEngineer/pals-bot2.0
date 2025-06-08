# 漂流瓶聊天系统 - 性能与用户体验测试

## 📊 测试概览

本测试套件包含两个主要测试工具：

1. **性能压力测试** (`stress-test.js`) - 模拟 50-100 并发用户，验证系统稳定性
2. **用户体验测试** (`ux-test.js`) - 验证真实用户场景，检查可用性和体验质量

## 🚀 快速开始

### 安装依赖

```bash
cd test/performance
npm install
```

### 运行测试

```bash
# 运行所有测试
npm run test:all

# 单独运行压力测试
npm run test:stress

# 单独运行用户体验测试
npm run test:ux
```

## 📋 测试详情

### 性能压力测试

**目标**：验证系统在高并发负载下的稳定性和性能表现

**测试场景**：

- 模拟用户查找漂流瓶
- 创建聊天会话
- 发送和接收消息
- 结束会话
- 智能轮询机制

**关键指标**：

- 并发用户数：50-100
- 测试持续时间：5 分钟
- API 响应时间：< 2 秒
- 错误率：< 5%
- 内存使用：< 50MB

**测试级别**：

```bash
# 轻量测试 (10用户, 1分钟)
npm run test:stress:light

# 中等测试 (30用户, 3分钟)
npm run test:stress:medium

# 重载测试 (50用户, 5分钟)
npm run test:stress:heavy

# 极限测试 (100用户, 10分钟)
npm run test:stress:extreme
```

### 用户体验测试

**目标**：验证真实用户场景下的可用性和体验质量

**测试场景**：

- 基础聊天流程
- 会话结束功能
- 网络中断恢复
- 移动端响应式设计
- 无障碍访问
- 性能指标

**关键指标**：

- 页面加载时间：< 3 秒
- 移动端响应式：无横向滚动
- 无障碍访问：语义化 HTML、Alt 文本
- 内存使用：< 20MB
- 用户体验质量评分

**支持设备**：

- Desktop (1920x1080)
- Tablet/iPad (768x1024)
- Mobile/iPhone (375x667)

**网络环境**：

- 快速网络 (WiFi): 10Mbps 下载, 20ms 延迟
- 慢速网络 (3G): 1Mbps 下载, 300ms 延迟
- 离线网络：模拟网络中断

## 🔧 配置选项

### 环境变量

```bash
# 测试目标地址 (默认: http://localhost:3000)
TEST_BASE_URL=https://your-app.vercel.app

# 压力测试配置
MAX_USERS=50              # 最大并发用户数
TEST_DURATION=300000      # 测试持续时间(毫秒)

# 用户体验测试配置
HEADLESS=false            # 是否使用无头浏览器 (false=显示界面)
```

### 自定义配置

**压力测试配置** (在 `stress-test.js` 中)：

```javascript
const CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || "http://localhost:3000",
  maxConcurrentUsers: 50,
  testDurationMs: 300000,
  rampUpTimeMs: 30000,
  pollingIntervalMs: 5000,
};
```

**用户体验测试配置** (在 `ux-test.js` 中)：

```javascript
const CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  headless: process.env.HEADLESS !== 'false',
  testTimeout: 300000,
  scenarios: [...] // 测试场景列表
};
```

## 📊 测试报告

### 报告文件

测试完成后会生成以下报告文件：

- `test-report-YYYY-MM-DD-HH-mm-ss.json` - 压力测试报告
- `ux-test-report-YYYY-MM-DD-HH-mm-ss.json` - 用户体验测试报告

### 报告内容

**压力测试报告**：

```json
{
  "summary": {
    "testDuration": "5.0 minutes",
    "maxConcurrentUsers": 50,
    "totalRequests": 2500,
    "successRate": "98.5%",
    "requestsPerSecond": "8.3"
  },
  "performance": {
    "averageResponseTime": 450,
    "maxResponseTime": 2100,
    "p95ResponseTime": 890,
    "p99ResponseTime": 1650
  },
  "business": {
    "conversationsCreated": 245,
    "messagesExchanged": 1890,
    "conversationsEnded": 180
  }
}
```

**用户体验测试报告**：

```json
{
  "summary": {
    "duration": "45.3s",
    "total": 25,
    "passed": 22,
    "failed": 0,
    "warnings": 3,
    "successRate": "88.0%"
  },
  "performance": {
    "loadTime": 1850,
    "memoryUsage": 12.5
  },
  "accessibility": {
    "semanticHTML": true,
    "altText": true,
    "keyboardNav": true
  }
}
```

## ✅ 验收标准

### 压力测试通过标准

- ✅ 错误率 < 5%
- ✅ 平均响应时间 < 2000ms
- ✅ 95%请求响应时间 < 3000ms
- ✅ 内存使用稳定，无明显泄漏
- ✅ 系统在测试期间保持稳定

### 用户体验测试通过标准

- ✅ 页面加载时间 < 3000ms
- ✅ 所有设备响应式良好（无横向滚动）
- ✅ 基础功能可用（按钮、输入框等）
- ✅ 无障碍访问达标
- ✅ 内存使用 < 20MB
- ✅ 关键用户流程正常工作

## 🐛 故障排除

### 常见问题

**1. Puppeteer 安装失败**

```bash
# 设置国内镜像
npm config set puppeteer_download_host=https://npm.taobao.org/mirrors
npm install puppeteer
```

**2. 测试超时**

```bash
# 增加超时时间
TEST_DURATION=600000 npm run test:stress
```

**3. 网络错误**

```bash
# 使用本地服务器测试
TEST_BASE_URL=http://localhost:3000 npm run test:ux
```

**4. 权限问题（Linux/Docker）**

```bash
# 添加必要的浏览器参数
export PUPPETEER_ARGS="--no-sandbox --disable-setuid-sandbox"
```

### 调试模式

**查看浏览器界面**：

```bash
HEADLESS=false npm run test:ux
```

**详细日志输出**：

```bash
DEBUG=true npm run test:stress
```

**单独测试某个场景**：
修改测试文件中的 `scenarios` 数组，只保留需要测试的场景。

## 📈 性能优化建议

根据测试结果，系统可能需要以下优化：

### 高优先级

- 🔴 **API 响应时间过长** - 优化数据库查询，添加索引
- 🔴 **内存泄漏** - 检查轮询定时器清理，优化状态管理
- 🔴 **错误率过高** - 修复关键 bug，增强错误处理

### 中等优先级

- 🟡 **页面加载慢** - 优化资源加载，启用压缩
- 🟡 **移动端体验** - 调整响应式设计，优化触摸交互
- 🟡 **网络异常处理** - 完善离线提示，添加重试机制

### 低优先级

- 🟢 **无障碍访问** - 添加更多语义化标签，改善键盘导航
- 🟢 **性能监控** - 添加实时性能监控，用户体验追踪

## 🔄 持续集成

### GitHub Actions 集成

```yaml
name: Performance Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: "18"
      - name: Install dependencies
        run: |
          cd test/performance
          npm install
      - name: Run tests
        run: |
          cd test/performance
          npm run test:stress:light
          npm run test:ux
        env:
          TEST_BASE_URL: ${{ secrets.TEST_BASE_URL }}
```

### 定期测试

建议在以下情况运行测试：

- 🔄 每次代码提交前
- 🔄 每次发布前
- 🔄 每周定期测试
- 🔄 性能问题排查时

## 📞 技术支持

如有问题，请：

1. 查看测试报告中的错误详情
2. 检查网络连接和权限设置
3. 查看项目 Issues 页面
4. 联系开发团队

---

**最后更新**: 2024 年 12 月
**维护者**: Pals Bot 开发团队
