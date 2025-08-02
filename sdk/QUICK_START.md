# 快速开始 - Web Monitor SDK

## 🚀 快速安装和运行

### 1. 安装依赖
```bash
yarn install
```

### 2. 开发模式
```bash
# 启动开发构建（监听模式）
yarn dev

# 另开一个终端，启动测试服务器
yarn serve

# 或者同时运行构建和服务器
yarn dev:serve
```

### 3. 生产构建
```bash
# 标准构建
yarn build

# 构建并查看文件大小分析
yarn build:analyze
```

### 4. 访问测试页面
打开浏览器访问 `http://localhost:8080`

- **基础功能测试**: `http://localhost:8080/index.html`
- **Vue集成测试**: `http://localhost:8080/vue-example.html`  
- **React集成测试**: `http://localhost:8080/react-example.html`

## 📦 构建产物

构建完成后，`dist/` 目录包含：

```
dist/
├── web-monitor-sdk.dev.js      # 开发版本（59KB，未压缩，带source map）
├── web-monitor-sdk.min.js      # 生产版本（26KB，terser压缩，UMD格式）
├── index.esm.js               # ES模块版本（25KB，terser压缩）
├── index.js                  # CommonJS版本（26KB，terser压缩）
└── *.d.ts                    # TypeScript类型定义文件
```

## 💡 基础使用

### HTML引入（UMD）
```html
<script src="dist/web-monitor-sdk.min.js"></script>
<script>
  const monitor = new WebMonitorSDK.default({
    appId: 'your-app-id',
    reportUrl: 'https://your-api.com/report'
  });
</script>
```

### ES模块引入
```javascript
import WebMonitorSDK from './dist/index.esm.js';

const monitor = new WebMonitorSDK({
  appId: 'your-app-id',
  reportUrl: 'https://your-api.com/report'
});
```

### Node.js引入
```javascript
const WebMonitorSDK = require('./dist/index.js');

const monitor = new WebMonitorSDK.default({
  appId: 'your-app-id', 
  reportUrl: 'https://your-api.com/report'
});
```

## 🔧 配置选项

```javascript
const monitor = new WebMonitorSDK({
  appId: 'your-app-id',              // 必填：应用ID
  reportUrl: 'https://api.com/report', // 必填：上报地址
  sampling: 0.1,                     // 可选：采样率（0-1）
  debug: true,                       // 可选：开启调试模式
  enablePerformance: true,           // 可选：性能监控
  enableError: true,                 // 可选：错误监控  
  enableBehavior: true,              // 可选：行为监控
  beforeSend: (data) => {            // 可选：发送前钩子
    console.log('发送数据:', data);
    return data; // 返回null可阻止发送
  }
});
```

## 🎯 测试功能

在测试页面中，你可以测试：

### 性能监控
- ✅ Core Web Vitals (LCP, INP, CLS, FCP, TTFB)
- ✅ 导航时间统计
- ✅ 资源加载时间
- ✅ API请求耗时

### 错误监控  
- ✅ JavaScript运行时错误
- ✅ Promise未处理异常
- ✅ 资源加载失败
- ✅ API请求错误

### 行为监控
- ✅ 用户点击事件
- ✅ 输入框交互
- ✅ 页面滚动
- ✅ 路由跳转

### 插件系统
- ✅ Vue.js错误集成
- ✅ React错误边界集成
- ✅ 自定义插件开发

## 🐛 调试技巧

1. **启用调试模式**: 设置 `debug: true`
2. **查看控制台**: 所有上报数据会在控制台输出
3. **检查网络**: 查看数据上报的HTTP请求
4. **使用测试页面**: 丰富的测试场景和实时日志

## 📊 数据上报格式

所有数据都按以下格式上报：

```javascript
{
  "appId": "your-app-id",
  "timestamp": 1640995200000,
  "sessionId": "session_xxx", 
  "url": "https://example.com",
  "userAgent": "Mozilla/5.0...",
  "type": "performance|error|behavior",
  "data": { /* 具体数据 */ },
  "breadcrumbs": [ /* 面包屑数组 */ ]
}
```

## ⚡ 性能特点

- **轻量级**: 生产版本仅 26KB（terser压缩，减少56%体积）
- **零依赖**: 仅依赖 web-vitals 库
- **智能压缩**: 
  - UMD版本移除所有console.log，适合生产环境
  - ESM/CJS版本保留console，便于开发调试
- **异步上报**: 使用 sendBeacon 确保数据不丢失
- **批量发送**: 自动合并数据，减少请求次数
- **异常保护**: SDK异常不会影响主业务

## 🔍 故障排除

### 常见问题

1. **构建失败**: 确保使用 `yarn` 而非 `npm`
2. **类型错误**: TypeScript警告不影响功能，可忽略
3. **CORS错误**: 确保上报地址支持跨域请求
4. **数据未上报**: 检查采样率和 beforeSend 钩子

### 获取帮助

如有问题，请：
1. 查看浏览器控制台错误信息
2. 检查测试页面是否正常工作
3. 参考完整文档 `README.md`