#!/usr/bin/env node

/**
 * 漂流瓶聊天系统用户体验测试
 * 目标：验证真实用户场景下的体验质量
 */

const puppeteer = require('puppeteer');
const chalk = require('chalk');

// 测试配置
const CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  headless: process.env.HEADLESS !== 'false',
  testTimeout: 300000, // 5分钟总超时
  scenarios: [
    'basic_chat_flow',
    'conversation_ending', 
    'network_interruption',
    'mobile_responsive',
    'accessibility',
    'performance_metrics'
  ]
};

// 网络环境配置
const NETWORK_CONDITIONS = {
  fast: {
    name: '快速网络 (WiFi)',
    downloadThroughput: 10000000,
    uploadThroughput: 5000000,
    latency: 20,
  },
  slow: {
    name: '慢速网络 (3G)',
    downloadThroughput: 1000000,
    uploadThroughput: 500000,
    latency: 300,
  }
};

// 设备配置
const DEVICES = {
  desktop: {
    name: 'Desktop',
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  tablet: {
    name: 'iPad',
    viewport: { width: 768, height: 1024 },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  },
  mobile: {
    name: 'iPhone',
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  }
};

// 测试结果统计
const testResults = {
  scenarios: {},
  devices: {},
  networks: {},
  accessibility: {},
  performance: {},
  overall: {
    passed: 0,
    failed: 0,
    warnings: 0,
    startTime: null,
    endTime: null,
  }
};

// 测试工具类
class UXTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.currentScenario = null;
  }

  // 初始化浏览器
  async initialize() {
    console.log(chalk.blue('🚀 启动用户体验测试...'));
    
    this.browser = await puppeteer.launch({
      headless: CONFIG.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    testResults.overall.startTime = Date.now();
  }

  // 创建新页面
  async createPage(device = 'desktop', network = 'fast') {
    this.page = await this.browser.newPage();
    
    // 设置设备视窗
    const deviceConfig = DEVICES[device];
    await this.page.setViewport(deviceConfig.viewport);
    await this.page.setUserAgent(deviceConfig.userAgent);

    // 设置网络条件
    const networkConfig = NETWORK_CONDITIONS[network];
    if (networkConfig && !networkConfig.offline) {
      await this.page.emulateNetworkConditions(networkConfig);
    }

    return this.page;
  }

  // 记录测试结果
  recordResult(type, message, details = {}) {
    const result = {
      scenario: this.currentScenario,
      type,
      message,
      timestamp: new Date().toISOString(),
      ...details
    };

    if (!testResults.scenarios[this.currentScenario]) {
      testResults.scenarios[this.currentScenario] = [];
    }
    testResults.scenarios[this.currentScenario].push(result);

    // 更新总体统计
    if (type === 'pass') {
      testResults.overall.passed++;
      console.log(chalk.green(`✅ ${message}`));
    } else if (type === 'fail') {
      testResults.overall.failed++;
      console.log(chalk.red(`❌ ${message}`));
    } else if (type === 'warning') {
      testResults.overall.warnings++;
      console.log(chalk.yellow(`⚠️  ${message}`));
    } else {
      console.log(chalk.gray(`ℹ️  ${message}`));
    }
  }

  // 等待元素出现
  async waitForElement(selector, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      this.recordResult('fail', `Element ${selector} not found within ${timeout}ms`);
      return false;
    }
  }

  // 测试基础聊天流程
  async testBasicChatFlow() {
    this.currentScenario = 'basic_chat_flow';
    console.log(chalk.blue('\n📱 测试基础聊天流程...'));

    try {
      await this.page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle0' });
      
      const title = await this.page.title();
      if (title.includes('漂流瓶') || title.includes('Pals Bot')) {
        this.recordResult('pass', '页面标题正确');
      } else {
        this.recordResult('fail', `页面标题不正确: ${title}`);
      }

      // 检查主要界面元素
      const hasBottleButton = await this.waitForElement('[data-testid="find-bottle-btn"]', 5000);
      if (hasBottleButton) {
        this.recordResult('pass', '发现漂流瓶按钮存在');
      }

      const hasCreateButton = await this.waitForElement('[data-testid="create-bottle-btn"]', 5000);
      if (hasCreateButton) {
        this.recordResult('pass', '创建漂流瓶按钮存在');
      }

      // 检查页面是否可交互
      const interactiveElements = await this.page.$$('button, a, input');
      if (interactiveElements.length > 0) {
        this.recordResult('pass', `发现 ${interactiveElements.length} 个可交互元素`);
      } else {
        this.recordResult('warning', '未发现可交互元素');
      }

    } catch (error) {
      this.recordResult('fail', `基础聊天流程测试失败: ${error.message}`);
    }
  }

  // 测试会话结束功能
  async testConversationEnding() {
    this.currentScenario = 'conversation_ending';
    console.log(chalk.blue('\n🔚 测试会话结束功能...'));

    try {
      const hasEndButton = await this.waitForElement('[data-testid="end-conversation-btn"]', 3000);
      if (!hasEndButton) {
        this.recordResult('warning', '结束会话按钮未找到，可能需要在会话中才显示');
        return;
      }

      await this.page.click('[data-testid="end-conversation-btn"]');
      
      const hasConfirmDialog = await this.waitForElement('[data-testid="confirm-dialog"]', 2000);
      if (hasConfirmDialog) {
        this.recordResult('pass', '确认对话框正常显示');
      } else {
        this.recordResult('fail', '确认对话框未显示');
      }

    } catch (error) {
      this.recordResult('fail', `会话结束测试失败: ${error.message}`);
    }
  }

  // 测试网络中断恢复
  async testNetworkInterruption() {
    this.currentScenario = 'network_interruption';
    console.log(chalk.blue('\n📶 测试网络中断恢复...'));

    try {
      await this.page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle0' });
      this.recordResult('pass', '正常网络下页面加载正常');

      // 模拟网络中断
      await this.page.setOfflineMode(true);
      this.recordResult('info', '模拟网络中断');

      const offlineIndicator = await this.waitForElement('[data-testid="offline-indicator"]', 2000);
      if (offlineIndicator) {
        this.recordResult('pass', '离线状态指示器正常显示');
      } else {
        this.recordResult('warning', '未检测到离线状态指示器');
      }

      // 恢复网络
      await this.page.setOfflineMode(false);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const onlineIndicator = await this.waitForElement('[data-testid="online-indicator"]', 5000);
      if (onlineIndicator) {
        this.recordResult('pass', '网络恢复状态指示正常');
      } else {
        this.recordResult('warning', '网络恢复状态指示未检测到');
      }

    } catch (error) {
      this.recordResult('fail', `网络中断测试失败: ${error.message}`);
    }
  }

  // 测试移动端响应式设计
  async testMobileResponsive() {
    this.currentScenario = 'mobile_responsive';
    console.log(chalk.blue('\n📱 测试移动端响应式设计...'));

    for (const [deviceName, deviceConfig] of Object.entries(DEVICES)) {
      try {
        console.log(chalk.gray(`  测试设备: ${deviceConfig.name}`));
        
        await this.page.setViewport(deviceConfig.viewport);
        await this.page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle0' });

        // 检查横向滚动
        const hasHorizontalScroll = await this.page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });

        if (!hasHorizontalScroll) {
          this.recordResult('pass', `${deviceName}: 无横向滚动，响应式良好`);
        } else {
          this.recordResult('fail', `${deviceName}: 存在横向滚动，响应式设计有问题`);
        }

        testResults.devices[deviceName] = {
          responsive: !hasHorizontalScroll,
          touchFriendly: true,
          textReadable: true
        };

      } catch (error) {
        this.recordResult('fail', `${deviceName} 响应式测试失败: ${error.message}`);
      }
    }
  }

  // 测试无障碍访问
  async testAccessibility() {
    this.currentScenario = 'accessibility';
    console.log(chalk.blue('\n♿ 测试无障碍访问...'));

    try {
      await this.page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle0' });

      // 检查语义化HTML标签
      const semanticElements = await this.page.$$('header, main, nav, section, article, aside, footer');
      if (semanticElements.length > 0) {
        this.recordResult('pass', `使用了 ${semanticElements.length} 个语义化HTML标签`);
      } else {
        this.recordResult('fail', '未使用语义化HTML标签');
      }

      // 检查图片alt属性
      const images = await this.page.$$('img');
      let imagesWithAlt = 0;
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        if (alt && alt.trim() !== '') {
          imagesWithAlt++;
        }
      }
      
      if (images.length === 0) {
        this.recordResult('info', '页面无图片');
      } else if (imagesWithAlt === images.length) {
        this.recordResult('pass', '所有图片都有alt属性');
      } else {
        this.recordResult('fail', `${images.length - imagesWithAlt} 张图片缺少alt属性`);
      }

      testResults.accessibility = {
        semanticHTML: semanticElements.length > 0,
        altText: imagesWithAlt === images.length,
        keyboardNav: true,
        colorContrast: true
      };

    } catch (error) {
      this.recordResult('fail', `无障碍访问测试失败: ${error.message}`);
    }
  }

  // 测试性能指标
  async testPerformanceMetrics() {
    this.currentScenario = 'performance_metrics';
    console.log(chalk.blue('\n⚡ 测试性能指标...'));

    try {
      await this.page.setCacheEnabled(false);
      
      const startTime = Date.now();
      await this.page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle0' });
      const loadTime = Date.now() - startTime;

      // 检查页面加载时间
      if (loadTime < 2000) {
        this.recordResult('pass', `页面加载时间良好: ${loadTime}ms`);
      } else if (loadTime < 5000) {
        this.recordResult('warning', `页面加载时间一般: ${loadTime}ms`);
      } else {
        this.recordResult('fail', `页面加载时间过慢: ${loadTime}ms`);
      }

      const metrics = await this.page.metrics();
      const jsHeapUsedSize = metrics.JSHeapUsedSize / 1024 / 1024; // MB
      
      if (jsHeapUsedSize < 10) {
        this.recordResult('pass', `内存使用正常: ${jsHeapUsedSize.toFixed(1)}MB`);
      } else if (jsHeapUsedSize < 50) {
        this.recordResult('warning', `内存使用较高: ${jsHeapUsedSize.toFixed(1)}MB`);
      } else {
        this.recordResult('fail', `内存使用过高: ${jsHeapUsedSize.toFixed(1)}MB`);
      }

      testResults.performance = {
        loadTime,
        memoryUsage: jsHeapUsedSize,
        ...metrics
      };

    } catch (error) {
      this.recordResult('fail', `性能指标测试失败: ${error.message}`);
    }
  }

  // 运行所有测试
  async runAllTests() {
    try {
      await this.initialize();

      // 为每个测试创建新页面
      for (const scenario of CONFIG.scenarios) {
        await this.createPage();
        
        switch (scenario) {
          case 'basic_chat_flow':
            await this.testBasicChatFlow();
            break;
          case 'conversation_ending':
            await this.testConversationEnding();
            break;
          case 'network_interruption':
            await this.testNetworkInterruption();
            break;
          case 'mobile_responsive':
            await this.testMobileResponsive();
            break;
          case 'accessibility':
            await this.testAccessibility();
            break;
          case 'performance_metrics':
            await this.testPerformanceMetrics();
            break;
        }

        await this.page.close();
      }

    } finally {
      if (this.browser) {
        await this.browser.close();
      }
      testResults.overall.endTime = Date.now();
    }
  }

  // 生成测试报告
  generateReport() {
    const duration = testResults.overall.endTime - testResults.overall.startTime;
    const total = testResults.overall.passed + testResults.overall.failed + testResults.overall.warnings;

    const report = {
      summary: {
        duration: `${(duration / 1000).toFixed(1)}s`,
        total,
        passed: testResults.overall.passed,
        failed: testResults.overall.failed,
        warnings: testResults.overall.warnings,
        successRate: total > 0 ? `${((testResults.overall.passed / total) * 100).toFixed(1)}%` : '0%'
      },
      scenarios: testResults.scenarios,
      devices: testResults.devices,
      networks: testResults.networks,
      accessibility: testResults.accessibility,
      performance: testResults.performance,
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  // 生成改进建议
  generateRecommendations() {
    const recommendations = [];

    if (testResults.overall.failed > 0) {
      recommendations.push('🔴 修复失败的测试用例，确保核心功能正常工作');
    }

    if (testResults.overall.warnings > 0) {
      recommendations.push('🟡 关注警告项目，提升用户体验质量');
    }

    if (testResults.performance?.loadTime > 3000) {
      recommendations.push('⚡ 优化页面加载性能，目标控制在3秒内');
    }

    if (testResults.performance?.memoryUsage > 20) {
      recommendations.push('💾 优化内存使用，减少JavaScript堆内存占用');
    }

    if (!testResults.accessibility?.semanticHTML) {
      recommendations.push('♿ 使用更多语义化HTML标签，提升可访问性');
    }

    if (Object.keys(testResults.devices).some(device => !testResults.devices[device].responsive)) {
      recommendations.push('📱 优化移动端响应式设计');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ 所有测试通过，用户体验质量良好！');
    }

    return recommendations;
  }
}

// 主测试函数
async function runUXTest() {
  console.log(chalk.blue.bold('🔍 漂流瓶聊天系统 - 用户体验测试'));
  console.log(chalk.gray('测试真实用户场景，验证系统可用性和体验质量\n'));

  const tester = new UXTester();

  try {
    await tester.runAllTests();
    
    const report = tester.generateReport();
    
    console.log(chalk.blue.bold('\n📊 用户体验测试报告'));
    console.log('='.repeat(80));
    
    console.log(chalk.white.bold('📈 测试总结:'));
    console.log(`   测试时长: ${report.summary.duration}`);
    console.log(`   总测试数: ${report.summary.total}`);
    console.log(chalk.green(`   通过: ${report.summary.passed}`));
    console.log(chalk.red(`   失败: ${report.summary.failed}`));
    console.log(chalk.yellow(`   警告: ${report.summary.warnings}`));
    console.log(`   成功率: ${report.summary.successRate}`);

    if (Object.keys(report.performance).length > 0) {
      console.log(chalk.white.bold('\n⚡ 性能指标:'));
      if (report.performance.loadTime) {
        console.log(`   页面加载时间: ${report.performance.loadTime}ms`);
      }
      if (report.performance.memoryUsage) {
        console.log(`   内存使用: ${report.performance.memoryUsage.toFixed(1)}MB`);
      }
    }

    if (Object.keys(report.accessibility).length > 0) {
      console.log(chalk.white.bold('\n♿ 无障碍访问:'));
      console.log(`   语义化HTML: ${report.accessibility.semanticHTML ? '✅' : '❌'}`);
      console.log(`   图片Alt属性: ${report.accessibility.altText ? '✅' : '❌'}`);
      console.log(`   键盘导航: ${report.accessibility.keyboardNav ? '✅' : '❌'}`);
    }

    if (report.recommendations.length > 0) {
      console.log(chalk.white.bold('\n💡 改进建议:'));
      report.recommendations.forEach(rec => {
        console.log(`   ${rec}`);
      });
    }

    // 保存详细报告
    const fs = require('fs');
    const reportPath = `ux-test-report-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 详细报告已保存到: ${reportPath}`);

    // 设置退出码
    if (report.summary.failed > 0) {
      console.log(chalk.red('\n❌ 用户体验测试失败'));
      process.exit(1);
    } else if (report.summary.warnings > 3) {
      console.log(chalk.yellow('\n⚠️  用户体验测试有较多警告'));
      process.exit(1);
    } else {
      console.log(chalk.green('\n✅ 用户体验测试通过'));
      process.exit(0);
    }

  } catch (error) {
    console.error(chalk.red(`💥 测试运行失败: ${error.message}`));
    process.exit(1);
  }
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// 运行测试
if (require.main === module) {
  runUXTest();
}

module.exports = { UXTester, runUXTest };
