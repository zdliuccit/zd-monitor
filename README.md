# ZD Monitor

一个功能完整的 Web 性能监控平台，提供前端性能监控、错误追踪和数据分析功能。

## 项目结构

```
zd-monitor/
├── sdk/                    # Web 监控 SDK
├── backend/               # 后端服务
│   ├── server/           # NestJS API 服务器
│   └── frontend/         # React 管理面板
└── .gitignore
```

## 主要功能

### SDK (web-monitor-sdk)
- 🚀 性能监控 (Web Vitals, 页面加载时间等)
- 🐛 错误追踪和异常捕获
- 📊 用户行为分析
- 🔌 支持 React/Vue 插件
- 📦 轻量级设计，易于集成

### 后端服务
- 🔐 用户认证与授权 (JWT)
- 📱 应用管理
- 📈 监控数据收集与存储
- 🗄️ MongoDB 数据持久化

### 前端管理面板
- 📊 实时监控面板
- 📈 性能数据可视化
- 🔍 错误日志查看
- ⚙️ 应用配置管理

## 快速开始

### 1. SDK 使用

```bash
cd sdk
yarn install
yarn build
```

在你的项目中使用：

```javascript
import { Monitor } from 'web-monitor-sdk';

const monitor = new Monitor({
  dsn: 'your-server-endpoint',
  appId: 'your-app-id'
});

monitor.init();
```

### 2. 启动后端服务

```bash
cd backend/server
npm install
npm run start:dev
```

### 3. 启动前端管理面板

```bash
cd backend/frontend
npm install
npm run dev
```

## 技术栈

- **SDK**: TypeScript, Rollup
- **后端**: NestJS, MongoDB, JWT
- **前端**: React, Vite, TypeScript
- **构建工具**: Rollup, Vite

## 开发

- SDK 开发: `cd sdk && yarn dev`
- 后端开发: `cd backend/server && npm run start:dev`
- 前端开发: `cd backend/frontend && npm run dev`

## License

MIT