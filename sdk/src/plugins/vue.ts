import { Plugin, ErrorData, ErrorType, DataType } from '../types';
import { Monitor } from '../core/Monitor';

/**
 * Vue框架集成插件
 * 为Vue 2.x和Vue 3.x应用提供错误监控和上报功能
 */
export const VuePlugin: Plugin = {
  /** 插件名称 */
  name: 'vue',
  
  /**
   * 安装Vue插件
   * 自动检测Vue版本并设置相应的错误处理器
   * @param monitor 监控器实例
   */
  install(monitor: Monitor) {
    // Vue 2.x 错误处理集成
    if (typeof window !== 'undefined' && (window as any).Vue) {
      const Vue = (window as any).Vue;
      
      /**
       * 设置Vue 2.x的全局错误处理器
       * @param error 错误对象
       * @param vm Vue组件实例
       * @param info 错讯信息，说明错误的来源
       */
      Vue.config.errorHandler = (error: Error, vm: any, info: string) => {
        // 构建Vue错误数据对象
        const errorData: ErrorData = {
          type: ErrorType.JS_ERROR,
          message: error.message,
          stack: error.stack,
          source: `Vue ${info}`, // 标记为Vue错误
          filename: vm?.$options?.__file || 'Vue Component' // 组件文件名
        };

        // 上报Vue错误数据
        monitor.report({
          type: DataType.ERROR,
          data: errorData
        });

        // 添加Vue错误面包屑记录，方便问题复现
        monitor.addBreadcrumb({
          timestamp: Date.now(),
          type: DataType.ERROR,
          category: 'vue',
          message: `Vue Error: ${error.message}`,
          level: 'error',
          data: {
            info, // Vue错误信息
            component: vm?.$options?.name || 'Anonymous Component' // 组件名称
          }
        });
      };
    }

    // Vue 3.x 错误处理集成
    if (typeof window !== 'undefined' && (window as any).Vue && (window as any).Vue.version && (window as any).Vue.version.startsWith('3')) {
      const Vue = (window as any).Vue;
      
      // 创建Vue 3应用实例用于设置错误处理器
      const app = Vue.createApp({});
      
      /**
       * 设置Vue 3.x的全局错误处理器
       * @param error 错误对象
       * @param instance Vue 3组件实例
       * @param info 错误信息，说明错误的来源
       */
      app.config.errorHandler = (error: Error, instance: any, info: string) => {
        // 构建Vue 3错误数据对象
        const errorData: ErrorData = {
          type: ErrorType.JS_ERROR,
          message: error.message,
          stack: error.stack,
          source: `Vue3 ${info}`, // 标记为Vue 3错误
          filename: instance?.$options?.__file || 'Vue3 Component' // 组件文件名
        };

        // 上报Vue 3错误数据
        monitor.report({
          type: DataType.ERROR,
          data: errorData
        });

        // 添加Vue 3错误面包屑记录
        monitor.addBreadcrumb({
          timestamp: Date.now(),
          type: DataType.ERROR,
          category: 'vue3',
          message: `Vue3 Error: ${error.message}`,
          level: 'error',
          data: {
            info, // Vue 3错误信息
            component: instance?.type?.name || 'Anonymous Component' // Vue 3组件名称
          }
        });
      };
    }
  }
};