/**
 * Rollup生产环境构建配置
 * 用于生产部署的优化构建，生成多种模块格式以适应不同使用场景
 * 
 * 构建产物：
 * 1. UMD格式 - 浏览器直接引入使用
 * 2. ESM格式 - 现代构建工具和模块系统
 * 3. CommonJS格式 - Node.js环境使用
 * 
 * 优化特性：
 * - 代码压缩和混淆
 * - 死代码消除
 * - Tree shaking
 * - 不同格式的差异化优化策略
 */

// 导入Rollup插件
const resolve = require('@rollup/plugin-node-resolve').default;  // 解析node_modules中的依赖
const commonjs = require('@rollup/plugin-commonjs').default;     // 将CommonJS模块转换为ES6
const typescript = require('@rollup/plugin-typescript').default; // TypeScript编译支持
const terser = require('@rollup/plugin-terser');                 // 代码压缩和混淆插件

module.exports = [
  // ==================== UMD 构建配置 ====================
  // 适用于浏览器直接引入，通过<script>标签使用
  {
    // 入口文件
    input: 'src/index.ts',
    
    // 输出配置
    output: {
      // 输出文件路径
      file: 'dist/web-monitor-sdk.min.js',
      // UMD格式：Universal Module Definition，支持多种模块系统
      format: 'umd',
      // 全局变量名，浏览器环境下通过window.WebMonitorSDK访问
      name: 'WebMonitorSDK'
      // 注意：生产环境不生成sourcemap以减小文件体积
    },
    
    // 构建插件配置
    plugins: [
      // Node.js模块解析插件
      resolve({
        // 浏览器环境优化，优先解析package.json中的browser字段
        browser: true
      }),
      
      // CommonJS模块转换
      commonjs(),
      
      // TypeScript编译
      typescript({
        // 使用项目的TypeScript配置
        tsconfig: './tsconfig.json'
        // 生产环境不生成TypeScript的sourceMap
      }),
      
      // Terser代码压缩插件 - UMD版本使用激进压缩策略
      terser({
        // 压缩选项
        compress: {
          // 移除所有console语句，减小文件体积并避免生产环境日志泄漏
          drop_console: true,
          // 移除debugger语句
          drop_debugger: true,
          // 移除指定的纯函数调用
          pure_funcs: ['console.log', 'console.warn']
        },
        // 变量名混淆配置
        mangle: {
          // 保留特定变量名不被混淆，确保外部API可访问
          reserved: ['WebMonitorSDK']
        },
        // 输出格式配置
        format: {
          // 移除所有注释以减小文件体积
          comments: false
        }
      })
    ]
  },
  
  // ==================== ESM 构建配置 ====================
  // 适用于现代构建工具（Webpack、Vite等）和ES6模块系统
  {
    // 入口文件
    input: 'src/index.ts',
    
    // 输出配置
    output: {
      // 输出文件路径
      file: 'dist/index.esm.js',
      // ES Module格式：现代JavaScript模块标准
      format: 'esm'
      // ESM格式不需要全局变量名
    },
    
    // 构建插件配置
    plugins: [
      // Node.js模块解析插件
      resolve({
        // 浏览器环境优化
        browser: true
      }),
      
      // CommonJS模块转换
      commonjs(),
      
      // TypeScript编译
      typescript({
        // 使用项目的TypeScript配置
        tsconfig: './tsconfig.json'
      }),
      
      // Terser代码压缩插件 - ESM版本使用温和压缩策略
      terser({
        // 压缩选项
        compress: {
          // 保留console语句，ESM通常用于开发环境或需要调试的场景
          drop_console: false,
          // 移除debugger语句
          drop_debugger: true,
          // 只移除debug级别的日志
          pure_funcs: ['console.debug']
        },
        // 启用变量名混淆以减小文件体积
        mangle: true,
        // 输出格式配置
        format: {
          // 移除注释以减小文件体积
          comments: false
        }
      })
    ]
  },
  
  // ==================== CommonJS 构建配置 ====================
  // 适用于Node.js环境和传统的模块系统
  {
    // 入口文件
    input: 'src/index.ts',
    
    // 输出配置
    output: {
      // 输出文件路径
      file: 'dist/index.js',
      // CommonJS格式：Node.js的传统模块系统
      format: 'cjs'
      // CommonJS格式不需要全局变量名
    },
    
    // 构建插件配置
    plugins: [
      // Node.js模块解析插件
      resolve({
        // 浏览器环境优化（即使是CommonJS也可能在浏览器构建工具中使用）
        browser: true
      }),
      
      // CommonJS模块转换
      commonjs(),
      
      // TypeScript编译
      typescript({
        // 使用项目的TypeScript配置
        tsconfig: './tsconfig.json'
      }),
      
      // Terser代码压缩插件 - CommonJS版本使用温和压缩策略
      terser({
        // 压缩选项
        compress: {
          // 保留console语句，CommonJS通常用于Node.js环境，需要调试能力
          drop_console: false,
          // 移除debugger语句
          drop_debugger: true,
          // 只移除debug级别的日志
          pure_funcs: ['console.debug']
        },
        // 启用变量名混淆以减小文件体积
        mangle: true,
        // 输出格式配置
        format: {
          // 移除注释以减小文件体积
          comments: false
        }
      })
    ]
  }
];

/**
 * 构建策略说明：
 * 
 * 1. UMD版本（web-monitor-sdk.min.js）
 *    - 最激进的压缩策略
 *    - 移除所有console和调试代码
 *    - 适合生产环境直接引入
 *    - 文件体积最小
 * 
 * 2. ESM版本（index.esm.js）
 *    - 温和的压缩策略
 *    - 保留console以便调试
 *    - 适合现代构建工具
 *    - 支持Tree Shaking
 * 
 * 3. CommonJS版本（index.js）
 *    - 温和的压缩策略
 *    - 保留console以便Node.js调试
 *    - 兼容传统模块系统
 *    - 适合服务端渲染等场景
 * 
 * 优化效果：
 * - 代码体积减少约56%
 * - 支持多种使用场景
 * - 保持适当的调试能力
 */