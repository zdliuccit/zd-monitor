import { Plugin, ErrorData, ErrorType, DataType } from '../types';
import { Monitor } from '../core/Monitor';

/**
 * React框架集成插件
 * 为React应用提供错误监控和上报功能，支持类组件的ErrorBoundary和React 18+的可恢复错误
 */
export const ReactPlugin: Plugin = {
  /** 插件名称 */
  name: 'react',
  
  /**
   * 安装React插件
   * 拦截React的createElement和createRoot方法来集成错误监控
   * @param monitor 监控器实例
   */
  install(monitor: Monitor) {
    // React ErrorBoundary 集成 - 为类组件提供错误捕获
    if (typeof window !== 'undefined' && (window as any).React) {
      // 保存原始的createElement方法
      const originalCreateElement = (window as any).React.createElement;
      
      /**
       * 拦截React.createElement方法
       * 为类组件自动添加错误边界处理逻辑
       */
      (window as any).React.createElement = function(type: any, _props: any, ..._children: any[]) {
        // 检查是否为React类组件
        if (typeof type === 'function' && type.prototype && type.prototype.isReactComponent) {
          // 保存原始的componentDidCatch方法
          const originalComponentDidCatch = type.prototype.componentDidCatch;
          
          /**
           * 重写componentDidCatch方法来捕获组件错误
           * @param error 错误对象
           * @param errorInfo React提供的错误信息，包含组件栈
           */
          type.prototype.componentDidCatch = function(error: Error, errorInfo: any) {
            // 构建React错误数据对象
            const errorData: ErrorData = {
              type: ErrorType.JS_ERROR,
              message: error.message,
              stack: error.stack,
              source: 'React Component', // 标记为React组件错误
              filename: errorInfo.componentStack // 使用组件栈作为文件名
            };

            // 上报React组件错误
            monitor.report({
              type: DataType.ERROR,
              data: errorData
            });

            // 添加React错误面包屑记录
            monitor.addBreadcrumb({
              timestamp: Date.now(),
              type: DataType.ERROR,
              category: 'react',
              message: `React Error: ${error.message}`,
              level: 'error',
              data: {
                componentStack: errorInfo.componentStack, // React组件调用栈
                component: type.name || 'Anonymous Component' // 组件名称
              }
            });

            // 调用原始的componentDidCatch方法（如果存在）
            if (originalComponentDidCatch) {
              originalComponentDidCatch.call(this, error, errorInfo);
            }
          };
        }

        // 调用原始的createElement方法
        return originalCreateElement.apply(this, arguments);
      };
    }

    // React 18+ 可恢复错误处理集成
    if (typeof window !== 'undefined' && (window as any).ReactDOM && (window as any).ReactDOM.createRoot) {
      // 保存原始的createRoot方法
      const originalCreateRoot = (window as any).ReactDOM.createRoot;
      
      /**
       * 拦截React 18的createRoot方法
       * 添加可恢复错误的监控功能
       */
      (window as any).ReactDOM.createRoot = function(container: any, options: any = {}) {
        // 增强的配置选项，添加错误处理器
        const enhancedOptions = {
          ...options,
          /**
           * React 18可恢复错误处理器
           * 处理React在渲染过程中可以恢复的错误
           * @param error 错误对象
           * @param errorInfo 错误信息和上下文
           */
          onRecoverableError: (error: Error, errorInfo: any) => {
            // 构建React可恢复错误数据对象
            const errorData: ErrorData = {
              type: ErrorType.JS_ERROR,
              message: error.message,
              stack: error.stack,
              source: 'React Recoverable Error' // 标记为可恢复错误
            };

            // 上报React可恢复错误
            monitor.report({
              type: DataType.ERROR,
              data: errorData
            });

            // 添加可恢复错误面包屑记录（级別为警告）
            monitor.addBreadcrumb({
              timestamp: Date.now(),
              type: DataType.ERROR,
              category: 'react',
              message: `React Recoverable Error: ${error.message}`,
              level: 'warning', // 可恢复错误使用warning级別
              data: errorInfo
            });

            // 调用用户提供的原始错误处理器（如果存在）
            if (options.onRecoverableError) {
              options.onRecoverableError(error, errorInfo);
            }
          }
        };

        // 调用原始的createRoot方法，传入增强的配置
        return originalCreateRoot.call(this, container, enhancedOptions);
      };
    }
  }
};