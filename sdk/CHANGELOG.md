# 更新日志

本文档记录了项目的所有重要更改。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 计划中
- 添加更多性能指标支持
- 支持更多框架插件
- 数据压缩传输
- 离线数据缓存

## [1.0.0] - 2024-01-30

### 新增
- 🎉 首次发布
- ✨ 完整的性能监控功能
  - Core Web Vitals (LCP, INP, CLS, FCP, FID, TTFB)
  - Navigation Timing API
  - Resource Timing API  
  - 自定义性能指标上报
- 🔍 全面的错误监控
  - JavaScript 运行时错误捕获
  - Promise 未处理异常捕获
  - 资源加载错误监控
  - API 请求错误监控
  - 自定义错误上报
- 👤 用户行为追踪
  - 点击事件监控
  - 输入事件监控
  - 滚动行为监控
  - 路由变化监控
  - 页面访问记录
  - 自定义行为上报
- 📊 智能数据上报系统
  - 优先级队列管理
  - 批量数据上报
  - 失败重试机制
  - SendBeacon API 支持
  - 页面卸载时数据保护
- 🔌 插件化架构
  - Vue.js 插件支持
  - React 插件支持
  - 自定义插件开发接口
- 📱 多环境支持
  - UMD 格式支持
  - ES Module 支持
  - CommonJS 支持
  - TypeScript 类型定义
- 🎯 开发友好
  - 完整的 TypeScript 支持
  - 详细的 JSDoc 注释
  - 开发和生产构建
  - 丰富的配置选项

### 技术实现
- 使用 TypeScript 开发，提供完整类型支持
- Rollup 构建系统，支持多种输出格式
- Web Vitals 库集成，准确测量性能指标
- 智能错误边界，确保 SDK 不影响主应用
- 内存优化，避免内存泄漏
- 浏览器兼容性优化，支持 IE11+

### 文档
- 📖 完整的 README 文档
- 🚀 快速上手指南
- 📋 详细的 API 文档
- 🎯 最佳实践建议
- 🔌 插件开发指南
- 📊 数据格式说明

### 构建和部署
- 自动化发布脚本
- NPM 包发布流程
- 版本管理脚本
- 构建优化和压缩
- 文件大小分析

---

## 版本说明

### 语义化版本规则
- **主版本号 (Major)**: 不兼容的 API 修改
- **次版本号 (Minor)**: 向下兼容的功能性新增
- **修订版本号 (Patch)**: 向下兼容的问题修正

### 版本标签
- `latest`: 最新稳定版本
- `beta`: 测试版本
- `alpha`: 开发版本
- `next`: 下一个版本的预览

### 发布频率
- **Patch**: 根据需要发布，通常每周或每两周
- **Minor**: 每月或每两月发布
- **Major**: 每年发布 1-2 次

## 贡献指南

### 提交类型
- `feat`: 新功能
- `fix`: 修复问题
- `docs`: 文档更新
- `style`: 代码格式修改
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 提交格式
```
type(scope): description

[optional body]

[optional footer]
```

示例：
```
feat(performance): add memory usage monitoring

Add memory usage tracking for better performance insights

Closes #123
```