#!/usr/bin/env node

/**
 * 漂流瓶聊天系统性能压力测试
 * 目标：模拟50-100并发用户，验证系统稳定性
 */

const axios = require('axios');
const WebSocket = require('ws');

// 测试配置
const CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  maxConcurrentUsers: parseInt(process.env.MAX_USERS) || 50,
  testDurationMs: parseInt(process.env.TEST_DURATION) || 300000, // 5分钟
  rampUpTimeMs: 30000, // 30秒逐步增加用户
  pollingIntervalMs: 5000, // 轮询间隔
};

// 测试统计
const stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  averageResponseTime: 0,
  maxResponseTime: 0,
  minResponseTime: Infinity,
  responseTimes: [],
  errors: {},
  activeUsers: 0,
  createdConversations: 0,
  messagesExchanged: 0,
  conversationsEnded: 0,
  memoryUsage: [],
  startTime: null,
  endTime: null,
};

// 模拟用户类
class SimulatedUser {
  constructor(userId) {
    this.userId = userId;
    this.conversationId = null;
    this.isActive = true;
    this.pollingTimer = null;
    this.messageCount = 0;
    this.lastActivity = Date.now();
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  // 生成模拟Telegram initData
  generateAuthData() {
    const userData = {
      id: this.userId,
      first_name: `TestUser${this.userId}`,
      username: `testuser${this.userId}`,
      language_code: 'en',
    };
    
    // 简化的initData格式（实际应用中需要正确的HMAC签名）
    return `user=${encodeURIComponent(JSON.stringify(userData))}&auth_date=${Math.floor(Date.now() / 1000)}`;
  }

  // 发起API请求
  async makeRequest(method, endpoint, data = null) {
    const startTime = Date.now();
    
    try {
      const config = {
        method,
        url: `${CONFIG.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.generateAuthData()}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10秒超时
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      const responseTime = Date.now() - startTime;
      
      this.recordSuccess(responseTime);
      return response.data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.recordError(error, responseTime);
      throw error;
    }
  }

  // 记录成功请求
  recordSuccess(responseTime) {
    stats.totalRequests++;
    stats.successfulRequests++;
    stats.responseTimes.push(responseTime);
    
    if (responseTime > stats.maxResponseTime) {
      stats.maxResponseTime = responseTime;
    }
    if (responseTime < stats.minResponseTime) {
      stats.minResponseTime = responseTime;
    }
    
    // 更新平均响应时间
    const sum = stats.responseTimes.reduce((a, b) => a + b, 0);
    stats.averageResponseTime = sum / stats.responseTimes.length;
  }

  // 记录失败请求
  recordError(error, responseTime) {
    stats.totalRequests++;
    stats.failedRequests++;
    
    const errorType = error.code || error.response?.status || 'UNKNOWN';
    stats.errors[errorType] = (stats.errors[errorType] || 0) + 1;
    
    console.warn(`User ${this.userId} - Request failed:`, {
      error: errorType,
      message: error.message,
      responseTime,
    });
  }

  // 查找随机漂流瓶
  async findRandomBottle() {
    try {
      const response = await this.makeRequest('GET', '/api/bottles/random');
      return response.data;
    } catch (error) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        await this.delay(1000 * this.retryCount); // 递增延迟重试
        return this.findRandomBottle();
      }
      throw error;
    }
  }

  // 创建会话
  async createConversation(bottleId) {
    try {
      const response = await this.makeRequest('POST', '/api/chat/conversations', {
        bottleId,
        initialMessage: `Hello from user ${this.userId}! This is a stress test message.`,
      });
      
      this.conversationId = response.data.id;
      stats.createdConversations++;
      return response.data;
    } catch (error) {
      console.error(`User ${this.userId} - Failed to create conversation:`, error.message);
      throw error;
    }
  }

  // 发送消息
  async sendMessage() {
    if (!this.conversationId) return;

    try {
      this.messageCount++;
      const message = `Test message ${this.messageCount} from user ${this.userId} at ${new Date().toISOString()}`;
      
      await this.makeRequest('POST', `/api/chat/conversations/${this.conversationId}/messages`, {
        content: message,
        mediaType: 'text',
      });
      
      stats.messagesExchanged++;
      this.lastActivity = Date.now();
    } catch (error) {
      if (error.response?.status === 404) {
        // 会话已被删除
        this.conversationId = null;
        console.log(`User ${this.userId} - Conversation ended by other party`);
      } else {
        console.error(`User ${this.userId} - Failed to send message:`, error.message);
      }
    }
  }

  // 轮询消息
  async pollMessages() {
    if (!this.conversationId) return;

    try {
      const response = await this.makeRequest('GET', `/api/chat/conversations/${this.conversationId}/messages`);
      
      // 如果对方发了消息，有概率回复
      if (response.data.length > this.messageCount && Math.random() > 0.7) {
        await this.delay(1000 + Math.random() * 3000); // 1-4秒后回复
        await this.sendMessage();
      }
    } catch (error) {
      if (error.response?.status === 404) {
        this.conversationId = null;
        console.log(`User ${this.userId} - Conversation not found during polling`);
      }
    }
  }

  // 结束会话
  async endConversation() {
    if (!this.conversationId) return;

    try {
      await this.makeRequest('DELETE', `/api/chat/conversations/${this.conversationId}`);
      stats.conversationsEnded++;
      console.log(`User ${this.userId} - Ended conversation ${this.conversationId}`);
      this.conversationId = null;
    } catch (error) {
      console.error(`User ${this.userId} - Failed to end conversation:`, error.message);
    }
  }

  // 开始轮询
  startPolling() {
    this.pollingTimer = setInterval(async () => {
      if (this.isActive && this.conversationId) {
        await this.pollMessages();
      }
    }, CONFIG.pollingIntervalMs + Math.random() * 2000); // 添加随机偏移避免同步
  }

  // 停止轮询
  stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  // 模拟用户行为
  async simulateUserBehavior() {
    try {
      // 1. 查找漂流瓶
      const bottle = await this.findRandomBottle();
      if (!bottle) {
        console.log(`User ${this.userId} - No bottles available`);
        return;
      }

      // 2. 创建会话
      await this.createConversation(bottle.id);
      console.log(`User ${this.userId} - Created conversation ${this.conversationId}`);

      // 3. 开始轮询
      this.startPolling();

      // 4. 模拟聊天行为（发送几条消息）
      const messageCount = 2 + Math.floor(Math.random() * 8); // 2-10条消息
      for (let i = 0; i < messageCount; i++) {
        if (!this.isActive || !this.conversationId) break;
        
        await this.delay(3000 + Math.random() * 7000); // 3-10秒间隔
        await this.sendMessage();
      }

      // 5. 50%概率主动结束会话
      if (Math.random() > 0.5 && this.conversationId) {
        await this.delay(2000 + Math.random() * 8000); // 等待2-10秒
        await this.endConversation();
      }

    } catch (error) {
      console.error(`User ${this.userId} - Simulation error:`, error.message);
    } finally {
      this.stopPolling();
      stats.activeUsers--;
    }
  }

  // 延迟工具函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 停止用户活动
  stop() {
    this.isActive = false;
    this.stopPolling();
    if (this.conversationId) {
      this.endConversation().catch(console.error);
    }
  }
}

// 内存监控
function monitorMemory() {
  const usage = process.memoryUsage();
  stats.memoryUsage.push({
    timestamp: Date.now(),
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external,
    rss: usage.rss,
  });

  // 只保留最近的100个记录
  if (stats.memoryUsage.length > 100) {
    stats.memoryUsage.shift();
  }
}

// 打印实时统计
function printStats() {
  const runtime = Date.now() - stats.startTime;
  const runtimeSeconds = Math.floor(runtime / 1000);
  
  console.clear();
  console.log('='.repeat(80));
  console.log('🚀 漂流瓶聊天系统 - 性能压力测试');
  console.log('='.repeat(80));
  console.log(`⏱️  运行时间: ${runtimeSeconds}s / ${Math.floor(CONFIG.testDurationMs / 1000)}s`);
  console.log(`👥 活跃用户: ${stats.activeUsers} / ${CONFIG.maxConcurrentUsers}`);
  console.log('');
  console.log('📊 请求统计:');
  console.log(`   总请求数: ${stats.totalRequests}`);
  console.log(`   成功请求: ${stats.successfulRequests} (${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1)}%)`);
  console.log(`   失败请求: ${stats.failedRequests} (${((stats.failedRequests / stats.totalRequests) * 100).toFixed(1)}%)`);
  console.log('');
  console.log('⚡ 性能指标:');
  console.log(`   平均响应时间: ${stats.averageResponseTime.toFixed(0)}ms`);
  console.log(`   最大响应时间: ${stats.maxResponseTime}ms`);
  console.log(`   最小响应时间: ${stats.minResponseTime === Infinity ? 'N/A' : stats.minResponseTime}ms`);
  console.log('');
  console.log('💬 业务指标:');
  console.log(`   创建的会话: ${stats.createdConversations}`);
  console.log(`   交换的消息: ${stats.messagesExchanged}`);
  console.log(`   结束的会话: ${stats.conversationsEnded}`);
  
  if (Object.keys(stats.errors).length > 0) {
    console.log('');
    console.log('❌ 错误统计:');
    Object.entries(stats.errors).forEach(([error, count]) => {
      console.log(`   ${error}: ${count}`);
    });
  }

  // 内存使用
  if (stats.memoryUsage.length > 0) {
    const latestMemory = stats.memoryUsage[stats.memoryUsage.length - 1];
    console.log('');
    console.log('💾 内存使用:');
    console.log(`   堆内存: ${(latestMemory.heapUsed / 1024 / 1024).toFixed(1)}MB / ${(latestMemory.heapTotal / 1024 / 1024).toFixed(1)}MB`);
    console.log(`   RSS: ${(latestMemory.rss / 1024 / 1024).toFixed(1)}MB`);
  }
  
  console.log('='.repeat(80));
}

// 生成最终报告
function generateReport() {
  const runtime = stats.endTime - stats.startTime;
  const runtimeMinutes = runtime / 1000 / 60;
  
  const report = {
    summary: {
      testDuration: `${runtimeMinutes.toFixed(1)} minutes`,
      maxConcurrentUsers: CONFIG.maxConcurrentUsers,
      totalRequests: stats.totalRequests,
      successRate: `${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(2)}%`,
      averageResponseTime: `${stats.averageResponseTime.toFixed(0)}ms`,
      requestsPerSecond: (stats.totalRequests / (runtime / 1000)).toFixed(1),
    },
    performance: {
      averageResponseTime: stats.averageResponseTime,
      maxResponseTime: stats.maxResponseTime,
      minResponseTime: stats.minResponseTime,
      p95ResponseTime: stats.responseTimes.length > 0 ? 
        stats.responseTimes.sort((a, b) => a - b)[Math.floor(stats.responseTimes.length * 0.95)] : 0,
      p99ResponseTime: stats.responseTimes.length > 0 ? 
        stats.responseTimes.sort((a, b) => a - b)[Math.floor(stats.responseTimes.length * 0.99)] : 0,
    },
    business: {
      conversationsCreated: stats.createdConversations,
      messagesExchanged: stats.messagesExchanged,
      conversationsEnded: stats.conversationsEnded,
      averageMessagesPerConversation: stats.createdConversations > 0 ? 
        (stats.messagesExchanged / stats.createdConversations).toFixed(1) : 0,
    },
    errors: stats.errors,
    reliability: {
      successRate: (stats.successfulRequests / stats.totalRequests) * 100,
      errorRate: (stats.failedRequests / stats.totalRequests) * 100,
      availability: stats.failedRequests === 0 ? '100%' : `${(100 - (stats.failedRequests / stats.totalRequests) * 100).toFixed(2)}%`,
    },
    resourceUsage: {
      peakMemoryUsage: stats.memoryUsage.length > 0 ? 
        `${Math.max(...stats.memoryUsage.map(m => m.heapUsed)) / 1024 / 1024}MB` : 'N/A',
      averageMemoryUsage: stats.memoryUsage.length > 0 ? 
        `${(stats.memoryUsage.reduce((sum, m) => sum + m.heapUsed, 0) / stats.memoryUsage.length / 1024 / 1024).toFixed(1)}MB` : 'N/A',
    }
  };

  return report;
}

// 主测试函数
async function runStressTest() {
  console.log('🚀 启动漂流瓶聊天系统性能压力测试...');
  console.log(`目标: ${CONFIG.maxConcurrentUsers} 并发用户, 持续 ${CONFIG.testDurationMs / 1000 / 60} 分钟`);
  console.log(`测试地址: ${CONFIG.baseUrl}`);
  console.log('');

  stats.startTime = Date.now();
  const users = [];

  // 内存监控
  const memoryMonitor = setInterval(monitorMemory, 5000);
  
  // 实时统计显示
  const statsDisplay = setInterval(printStats, 2000);

  try {
    // 逐步增加用户负载
    const rampUpInterval = CONFIG.rampUpTimeMs / CONFIG.maxConcurrentUsers;
    
    for (let i = 0; i < CONFIG.maxConcurrentUsers; i++) {
      const user = new SimulatedUser(i + 1);
      users.push(user);
      stats.activeUsers++;
      
      // 启动用户模拟
      user.simulateUserBehavior().catch(error => {
        console.error(`User ${user.userId} simulation failed:`, error.message);
      });
      
      // 控制负载增加速度
      if (i < CONFIG.maxConcurrentUsers - 1) {
        await new Promise(resolve => setTimeout(resolve, rampUpInterval));
      }
    }

    console.log(`✅ 所有 ${CONFIG.maxConcurrentUsers} 个用户已启动`);
    
    // 等待测试完成
    const remainingTime = CONFIG.testDurationMs - (Date.now() - stats.startTime);
    if (remainingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, remainingTime));
    }

  } finally {
    // 清理资源
    clearInterval(memoryMonitor);
    clearInterval(statsDisplay);
    
    console.log('\n🛑 停止所有用户活动...');
    users.forEach(user => user.stop());
    
    // 等待所有用户完成清理
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    stats.endTime = Date.now();
    
    // 生成最终报告
    console.clear();
    console.log('📊 性能压力测试完成！');
    console.log('='.repeat(80));
    const report = generateReport();
    console.log(JSON.stringify(report, null, 2));
    
    // 保存报告到文件
    const fs = require('fs');
    const reportPath = `test-report-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 详细报告已保存到: ${reportPath}`);
    
    // 设置退出码
    const errorRate = (stats.failedRequests / stats.totalRequests) * 100;
    if (errorRate > 5) {
      console.log('❌ 测试失败：错误率过高 (>5%)');
      process.exit(1);
    } else if (stats.averageResponseTime > 2000) {
      console.log('⚠️  测试警告：平均响应时间过长 (>2s)');
      process.exit(1);
    } else {
      console.log('✅ 测试通过：系统性能达标');
      process.exit(0);
    }
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

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n⏹️  接收到退出信号，正在停止测试...');
  stats.endTime = Date.now();
  const report = generateReport();
  console.log('📊 测试结果:');
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
});

// 运行测试
if (require.main === module) {
  runStressTest().catch(error => {
    console.error('💥 测试运行失败:', error);
    process.exit(1);
  });
}

module.exports = { runStressTest, SimulatedUser }; 