# 构建优化 - Terser 压缩配置

## 📊 压缩效果对比

| 版本 | 文件大小 | 压缩率 | 用途 |
|------|----------|--------|------|
| 开发版本 | 59KB | - | 开发调试，包含source map |
| 生产版本（UMD） | 26KB | **-56%** | 浏览器直接引入 |
| ESM版本 | 25KB | **-58%** | 现代构建工具 |
| CommonJS版本 | 26KB | **-56%** | Node.js环境 |

## ⚙️ Terser 压缩配置

### UMD版本配置（适合生产环境）
```javascript
terser({
  compress: {
    drop_console: true,           // 移除所有console语句
    drop_debugger: true,         // 移除debugger语句
    pure_funcs: ['console.log', 'console.warn'] // 移除指定函数调用
  },
  mangle: {
    reserved: ['WebMonitorSDK']   // 保留全局变量名不被混淆
  },
  format: {
    comments: false              // 移除所有注释
  }
})
```

### ESM/CommonJS版本配置（保留调试信息）
```javascript
terser({
  compress: {
    drop_console: false,         // 保留console，便于调试
    drop_debugger: true,        // 移除debugger语句
    pure_funcs: ['console.debug'] // 只移除debug级别日志
  },
  mangle: true,                 // 变量名混淆
  format: {
    comments: false             // 移除注释
  }
})
```

## 🚀 构建脚本

```bash
# 清理构建目录并重新构建
yarn build

# 构建并查看文件大小分析
yarn build:analyze

# 只清理构建目录
yarn clean
```

## 📈 优化效果

### 1. 体积优化
- **变量名混淆**: 将长变量名替换为短字符，减少文件大小
- **死代码消除**: 移除未使用的代码分支
- **注释移除**: 清理所有注释和空白字符
- **Console移除**: 生产版本移除调试语句

### 2. 运行时优化
- **函数内联**: 小函数直接内联到调用处
- **条件优化**: 简化布尔表达式和条件判断
- **循环优化**: 优化循环结构和迭代器

### 3. 兼容性保证
- **保留关键API**: WebMonitorSDK等关键标识符不被混淆
- **语法降级**: 确保在目标环境中正常运行
- **错误处理**: 保持原有的错误处理逻辑

## 🔧 自定义压缩配置

如需调整压缩配置，修改 `rollup.config.prod.js`:

```javascript
// 更激进的压缩（可能影响调试）
terser({
  compress: {
    drop_console: true,
    drop_debugger: true,
    pure_funcs: ['console.log', 'console.warn', 'console.info'],
    unsafe: true,              // 启用不安全优化
    unsafe_comps: true,        // 不安全的比较优化
    unsafe_math: true,         // 不安全的数学优化
    passes: 2                  // 多轮优化
  },
  mangle: {
    toplevel: true,            // 混淆顶级作用域
    properties: true           // 混淆对象属性名
  }
})

// 更保守的压缩（保持可读性）
terser({
  compress: {
    drop_console: false,       // 保留console
    drop_debugger: false,      // 保留debugger
    keep_fnames: true,         // 保留函数名
    keep_classnames: true      // 保留类名
  },
  mangle: false,               // 不混淆变量名
  format: {
    comments: 'all',           // 保留注释
    beautify: true             // 美化输出
  }
})
```

## 📋 最佳实践

### 1. 开发阶段
- 使用 `yarn dev` 构建开发版本
- 保留source map和调试信息
- 实时监听文件变化

### 2. 测试阶段
- 使用 `yarn build` 构建压缩版本
- 在测试页面验证功能完整性
- 检查压缩后的API调用

### 3. 生产部署
- 使用UMD版本直接在浏览器中引入
- 使用ESM版本配合现代构建工具
- 监控实际运行性能

## 🔍 压缩验证

验证压缩后的代码是否正常工作：

```javascript
// 在浏览器控制台测试
const monitor = new WebMonitorSDK.default({
  appId: 'test',
  reportUrl: 'https://httpbin.org/post',
  debug: true  // 注意：UMD版本中此选项无效（console被移除）
});

// 检查核心功能
monitor.reportError('Test error');
monitor.setUser('test-user');
console.log('Session ID:', monitor.getSessionId());
```

## 📊 Bundle 分析工具

推荐使用以下工具分析bundle：

```bash
# 安装bundle分析工具
yarn add --dev rollup-plugin-analyzer

# 或使用在线工具
# https://bundlephobia.com/ - 查看包大小
# https://webpack-bundle-analyzer.com/ - 可视化分析
```

这种优化策略确保了SDK在保持功能完整性的同时，大幅减少了文件体积，提升了加载性能。