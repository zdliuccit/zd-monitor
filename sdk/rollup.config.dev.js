/**
 * Rollup开发环境构建配置
 * 用于开发阶段的代码构建，保留调试信息和源码映射
 * 
 * 特性：
 * - 生成UMD格式，可直接在浏览器中使用
 * - 包含完整的source map用于调试
 * - 保留所有日志和调试代码
 * - 不进行代码压缩，便于阅读和调试
 */

// 导入Rollup插件
const resolve = require('@rollup/plugin-node-resolve').default;  // 解析node_modules中的依赖
const commonjs = require('@rollup/plugin-commonjs').default;     // 将CommonJS模块转换为ES6
const typescript = require('@rollup/plugin-typescript').default; // TypeScript编译支持

module.exports = {
  // 入口文件：TypeScript源码的主入口
  input: 'src/index.ts',
  
  // 输出配置
  output: {
    // 输出文件路径
    file: 'dist/web-monitor-sdk.dev.js',
    // UMD格式：支持AMD、CommonJS和全局变量三种使用方式
    format: 'umd',
    // 全局变量名称，在浏览器中通过window.WebMonitorSDK访问
    name: 'WebMonitorSDK',
    // 生成source map文件，便于开发调试
    sourcemap: true
  },
  
  // 构建插件配置
  plugins: [
    // Node.js模块解析插件
    resolve({
      // 启用浏览器环境的模块解析，优先使用browser字段
      browser: true
    }),
    
    // CommonJS转换插件
    // 将第三方CommonJS模块转换为ES6模块，以便Rollup处理
    commonjs(),
    
    // TypeScript编译插件
    typescript({
      // TypeScript配置文件路径
      tsconfig: './tsconfig.json',
      // 生成TypeScript的source map
      sourceMap: true
    })
  ]
};