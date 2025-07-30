# 前端性能监控平台

基于现有SDK的完整监控平台，包含NestJS后端和React前端，实现用户登录、应用管理、性能数据展示等功能。

## 项目结构

```
backend/
├── server/          # NestJS后端
│   ├── src/
│   │   ├── auth/    # 用户认证模块
│   │   ├── apps/    # 应用管理模块
│   │   ├── monitor/ # 监控数据模块
│   │   └── schemas/ # MongoDB数据模型
│   └── package.json
├── frontend/        # React前端
│   ├── src/
│   │   ├── components/ # 公共组件
│   │   ├── contexts/   # Context上下文
│   │   ├── pages/      # 页面组件
│   │   └── services/   # API服务
│   └── package.json
└── README.md
```

## 功能特性

### 后端功能
- ✅ 用户注册/登录认证 (JWT)
- ✅ 应用管理 (CRUD操作)
- ✅ 监控数据接收和存储
- ✅ 性能指标统计分析
- ✅ 错误监控和分类
- ✅ 页面访问统计
- ✅ MongoDB数据持久化

### 前端功能
- ✅ 用户登录/注册界面
- ✅ 仪表盘 - 多维度统计展示
- ✅ 应用管理 - 创建、编辑、删除应用
- ✅ 应用详情 - 性能监控、错误统计、页面访问分析
- ✅ 图表可视化 (Line, Column, Pie charts)
- ✅ 时间范围筛选
- ✅ 响应式布局

## 快速开始

### 环境要求
- Node.js 18+
- MongoDB 4.4+
- npm 或 yarn

### 1. 启动MongoDB
```bash
# 使用Docker启动MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 或使用本地MongoDB服务
mongod
```

### 2. 启动后端服务
```bash
cd server
npm install
npm run start:dev
```
后端服务将在 http://localhost:3000 启动

### 3. 启动前端服务
```bash
cd frontend
npm install
npm run dev
```
前端服务将在 http://localhost:5173 启动

### 4. 访问系统
打开浏览器访问 http://localhost:5173，首次使用需要注册账号。

## API文档

### 认证接口
- `POST /auth/register` - 用户注册
- `POST /auth/login` - 用户登录

### 应用管理接口
- `GET /apps` - 获取应用列表
- `POST /apps` - 创建应用
- `PUT /apps/:id` - 更新应用
- `DELETE /apps/:id` - 删除应用

### 监控数据接口
- `POST /monitor/report` - 上报监控数据
- `GET /monitor/:appId/statistics` - 获取统计数据
- `GET /monitor/:appId/performance` - 获取性能指标
- `GET /monitor/:appId/errors` - 获取错误统计
- `GET /monitor/:appId/pageviews` - 获取页面访问统计

## 数据模型

### 用户 (User)
```typescript
{
  username: string;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
}
```

### 应用 (App)
```typescript
{
  name: string;
  appId: string;
  description: string;
  domain: string;
  userId: ObjectId;
  isActive: boolean;
  config: {
    sampling?: number;
    enablePerformance?: boolean;
    enableError?: boolean;
    enableBehavior?: boolean;
  };
}
```

### 监控数据 (MonitorData)
```typescript
{
  appId: string;
  timestamp: number;
  type: 'performance' | 'error' | 'behavior';
  data: any;
  breadcrumbs: any[];
  sessionId: string;
  userId?: string;
  url: string;
  userAgent: string;
  priority: 'low' | 'medium' | 'high';
}
```

## 与SDK集成

创建应用后，获取应用的`appId`，在前端项目中初始化SDK：

```javascript
import WebMonitorSDK from '@your/monitor-sdk';

const monitor = new WebMonitorSDK({
  appId: 'your-app-id',
  reportUrl: 'http://localhost:3000/monitor/report',
  enablePerformance: true,
  enableError: true,
  enableBehavior: true,
});
```

## 部署说明

### 环境变量配置
后端 `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/monitor
JWT_SECRET=your-secret-key
PORT=3000
FRONTEND_URL=http://localhost:5173
```

前端 `.env`:
```env
VITE_API_URL=http://localhost:3000
```

### 生产部署
1. 构建前端项目: `npm run build`
2. 启动后端服务: `npm run start:prod`
3. 使用Nginx代理静态文件和API请求

## 技术栈

### 后端
- **框架**: NestJS
- **数据库**: MongoDB + Mongoose
- **认证**: JWT + Passport
- **语言**: TypeScript

### 前端
- **框架**: React 18 + TypeScript
- **UI库**: Ant Design
- **图表**: @ant-design/charts
- **路由**: React Router
- **构建**: Vite
- **HTTP**: Axios

## 开发计划

- [ ] 实时数据推送 (WebSocket)
- [ ] 告警规则配置
- [ ] 数据导出功能
- [ ] 用户权限管理
- [ ] API限流和缓存
- [ ] 单元测试覆盖