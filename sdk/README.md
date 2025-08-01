# Web Monitor SDK

[![npm version](https://badge.fury.io/js/web-monitor-sdk.svg)](https://badge.fury.io/js/web-monitor-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

一个功能强大的前端性能监控、错误监控和用户行为分析 SDK，支持现代 Web 应用的全方位监控。

## ✨ 特性

- 🚀 **性能监控**: 支持 Core Web Vitals (LCP, INP, CLS, FCP, FID, TTFB)
- 🔍 **错误监控**: 自动捕获 JavaScript 错误、Promise 异常、资源加载错误和 API 错误
- 👤 **用户行为跟踪**: 记录点击、输入、滚动、路由变化等用户交互
- 📊 **智能数据上报**: 支持优先级队列、批量上报、失败重试和缓存机制
- 🔌 **插件化架构**: 内置 Vue 和 React 插件，支持自定义插件扩展
- 📱 **轻量级**: 压缩后仅 ~30KB，对页面性能影响极小
- 🌐 **浏览器兼容**: 支持所有现代浏览器和 IE11+
- 📦 **多种格式**: 支持 UMD、ES Module 和 CommonJS

## 📦 安装

### NPM

```bash
npm install web-monitor-sdk
```

### Yarn

```bash
yarn add web-monitor-sdk
```

### CDN

```html
<!-- 开发版本 -->
<script src="https://unpkg.com/web-monitor-sdk/dist/web-monitor-sdk.dev.js"></script>

<!-- 生产版本 -->
<script src="https://unpkg.com/web-monitor-sdk/dist/web-monitor-sdk.min.js"></script>
```

## 🚀 快速开始

### ES Module

```javascript
import WebMonitorSDK from 'web-monitor-sdk';

const monitor = new WebMonitorSDK({
  appId: 'your-app-id',
  reportUrl: 'https://your-server.com/api/monitor',
  debug: true
});
```

### CommonJS

```javascript
const WebMonitorSDK = require('web-monitor-sdk').default;

const monitor = new WebMonitorSDK({
  appId: 'your-app-id',
  reportUrl: 'https://your-server.com/api/monitor'
});
```

### UMD (浏览器)

```html
<script src="https://unpkg.com/web-monitor-sdk/dist/web-monitor-sdk.min.js"></script>
<script>
  const monitor = new WebMonitorSDK.default({
    appId: 'your-app-id',
    reportUrl: 'https://your-server.com/api/monitor'
  });
</script>
```

## 📋 配置选项

```javascript
const monitor = new WebMonitorSDK({
  // 必需配置
  appId: 'your-app-id',              // 应用唯一标识
  reportUrl: 'https://api.com/monitor', // 数据上报接口

  // 可选配置
  sampling: 1,                       // 采样率 (0-1)
  debug: false,                      // 调试模式
  enablePerformance: true,           // 启用性能监控
  enableError: true,                 // 启用错误监控
  enableBehavior: true,              // 启用行为监控
  
  // 数据上报配置
  reportInterval: 10000,             // 上报间隔 (毫秒)
  batchSize: 10,                     // 批量大小
  maxQueueSize: 100,                 // 队列最大长度
  enableImmediateReport: true,       // 启用立即上报(错误数据)
  
  // 其他配置
  maxBreadcrumbsNum: 20,            // 面包屑最大数量
  beforeSend: (data) => data        // 数据发送前处理
});
```

## 🔧 API 使用

### 手动上报错误

```javascript
monitor.reportError('自定义错误信息', {
  category: 'business',
  level: 'high',
  extra: { userId: '123', action: 'payment' }
});
```

### 手动上报用户行为

```javascript
monitor.reportBehavior('button_click', {
  buttonName: '购买按钮',
  location: 'product_page'
});
```

### 设置用户信息

```javascript
monitor.setUser('user_123', {
  name: '张三',
  email: 'zhangsan@example.com'
});
```

### 设置标签和上下文

```javascript
// 设置标签
monitor.setTag('environment', 'production');
monitor.setTag('version', '1.2.3');

// 设置上下文
monitor.setContext('user_info', { plan: 'premium' });
monitor.setContext('feature_flags', { newUI: true });
```

### 获取 SDK 信息

```javascript
const sessionId = monitor.getSessionId();
const userId = monitor.getUserId();
const config = monitor.getConfig();
```

## 🔌 插件系统

### Vue 插件

```javascript
import WebMonitorSDK, { VuePlugin } from 'web-monitor-sdk';

const monitor = new WebMonitorSDK({ /* 配置 */ });
monitor.use(VuePlugin);
```

### React 插件

```javascript
import WebMonitorSDK, { ReactPlugin } from 'web-monitor-sdk';

const monitor = new WebMonitorSDK({ /* 配置 */ });
monitor.use(ReactPlugin);
```

### 自定义插件

```javascript
const customPlugin = {
  name: 'custom-plugin',
  install(monitor) {
    // 插件安装逻辑
    console.log('Custom plugin installed');
  },
  uninstall(monitor) {
    // 插件卸载逻辑
    console.log('Custom plugin uninstalled');
  }
};

monitor.use(customPlugin);
monitor.unuse('custom-plugin');
```

## 📊 数据格式

### 性能数据

```javascript
{
  type: 'performance',
  data: {
    type: 'LCP',
    name: 'LCP',
    value: 1234.5,
    rating: 'good',
    entries: [/* PerformanceEntry 对象 */]
  }
}
```

### 错误数据

```javascript
{
  type: 'error', 
  data: {
    type: 'js_error',
    message: 'Uncaught TypeError: Cannot read property',
    stack: '...',
    filename: 'app.js',
    lineno: 123,
    colno: 45
  }
}
```

### 行为数据

```javascript
{
  type: 'behavior',
  data: {
    type: 'click',
    element: 'BUTTON',
    selector: 'button.submit',
    text: '提交',
    url: 'https://example.com/form'
  }
}
```

## 🎯 最佳实践

### 1. 合理设置采样率

```javascript
const monitor = new WebMonitorSDK({
  appId: 'your-app',
  reportUrl: 'https://api.com/monitor',
  sampling: process.env.NODE_ENV === 'production' ? 0.1 : 1
});
```

### 2. 数据过滤和处理

```javascript
const monitor = new WebMonitorSDK({
  appId: 'your-app',
  reportUrl: 'https://api.com/monitor',
  beforeSend: (data) => {
    // 过滤敏感信息
    if (data.type === 'error' && data.data.message.includes('password')) {
      return null; // 不发送
    }
    
    // 添加额外信息
    data.extra = {
      buildVersion: '1.2.3',
      environment: 'production'
    };
    
    return data;
  }
});
```

### 3. 性能优化

```javascript
// 延迟初始化，避免阻塞页面加载
setTimeout(() => {
  const monitor = new WebMonitorSDK({
    appId: 'your-app',
    reportUrl: 'https://api.com/monitor',
    // 适当调整上报频率
    reportInterval: 30000,
    batchSize: 20
  });
}, 1000);
```

## 🏗️ 本地开发

### 安装依赖

```bash
yarn install
```

### 开发模式

```bash
yarn dev        # 监听文件变化并构建
yarn serve      # 启动测试服务器
yarn dev:serve  # 同时运行开发和服务器
```

### 构建项目

```bash
yarn build          # 生产构建
yarn build:analyze  # 构建并分析文件大小
yarn type-check     # TypeScript 类型检查
```

### 发布到 NPM

```bash
yarn publish:patch    # 发布补丁版本 (1.0.0 -> 1.0.1)
yarn publish:minor    # 发布次版本 (1.0.0 -> 1.1.0)  
yarn publish:major    # 发布主版本 (1.0.0 -> 2.0.0)
yarn publish:beta     # 发布 beta 版本
yarn publish:alpha    # 发布 alpha 版本
yarn publish:dry      # 模拟发布（不实际发布）
```

## 🌍 浏览器支持

| 浏览器 | 版本 |
|--------|------|
| Chrome | >= 60 |
| Firefox | >= 55 |
| Safari | >= 12 |
| Edge | >= 79 |
| IE | >= 11 |

## 📝 变更日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解详细的版本变更信息。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- [GitHub 仓库](https://github.com/your-username/web-monitor-sdk)
- [NPM 包](https://www.npmjs.com/package/web-monitor-sdk)
- [问题反馈](https://github.com/your-username/web-monitor-sdk/issues)
- [文档网站](https://your-username.github.io/web-monitor-sdk)

## 👨‍💻 作者

**zdliuccit**

## 💬 支持

如果这个项目对你有帮助，请给个 ⭐️ 支持一下！

有问题或建议？欢迎：
- 提交 [Issue](https://github.com/your-username/web-monitor-sdk/issues)
- 发送邮件到 your.email@example.com
- 加入讨论群：[链接]