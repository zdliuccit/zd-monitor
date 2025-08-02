import { Monitor } from './core/Monitor';
import { PerformanceMonitor } from './modules/performance';
import { ErrorMonitor } from './modules/error';
import { BehaviorMonitor } from './modules/behavior';
import { MonitorConfig, ReportData, Plugin } from './types';
import { VuePlugin } from './plugins/vue';
import { ReactPlugin } from './plugins/react';
import { isBot } from './utils/common';

/**
 * Web监控SDK主类
 * 前端性能监控、错误监控和用户行为分析的统一入口
 * 提供完整的数据收集、处理和上报功能
 */
export class WebMonitorSDK {
  /** 核心监控器实例，负责配置管理和数据上报 */
  private monitor: Monitor;
  /** 性能监控模块实例 */
  private performanceMonitor?: PerformanceMonitor;
  /** 错误监控模块实例 */
  private errorMonitor?: ErrorMonitor;
  /** 用户行为监控模块实例 */
  private behaviorMonitor?: BehaviorMonitor;
  /** SDK是否已初始化的标志 */
  private isInitialized = false;

  /**
   * 构造函数
   * 创建SDK实例并根据配置启动相应的监控模块
   * @param config 监控配置对象
   */
  constructor(config: MonitorConfig) {
    // 防止机器人和爬虫初始化SDK，避免产生无效数据
    if (isBot()) {
      // 创建一个空的monitor实例以避免类型错误
      this.monitor = {} as Monitor;
      return;
    }

    // 创建核心监控器实例
    this.monitor = new Monitor(config);
    // 初始化所有监控模块
    this.init();

    // 将SDK实例挂载到全局对象，方便调试和插件访问
    (window as any).__webMonitorSDK = this;

    // 挂载调试方法到全局对象
    this.setupGlobalDebugMethods();
  }

  /**
   * 初始化SDK
   * 根据配置启动相应的监控模块，确保只初始化一次
   */
  private init(): void {
    // 防止重复初始化
    if (this.isInitialized) {
      console.warn('WebMonitorSDK already initialized');
      return;
    }

    try {
      // 根据配置决定是否启用性能监控模块
      if (this.monitor['config'].enablePerformance) {
        const performanceConfig = this.monitor['config'].performance;
        this.performanceMonitor = new PerformanceMonitor(this.monitor, {
          enableBatch: performanceConfig?.enableBatch ?? true,
          batchInterval: performanceConfig?.batchInterval ?? 5000,
          batchSize: performanceConfig?.batchSize ?? 10
        });
      }

      // 根据配置决定是否启用错误监控模块
      if (this.monitor['config'].enableError) {
        this.errorMonitor = new ErrorMonitor(this.monitor);
      }

      // 根据配置决定是否启用用户行为监控模块
      if (this.monitor['config'].enableBehavior) {
        this.behaviorMonitor = new BehaviorMonitor(this.monitor);
      }

      // 标记初始化完成
      this.isInitialized = true;

      // 在调试模式下输出初始化成功日志
      if (this.monitor.isDebug) {
        console.log('WebMonitorSDK initialized successfully');
      }
    } catch (error) {
      // 处理初始化过程中的错误
      console.error('Failed to initialize WebMonitorSDK:', error);
    }
  }

  /**
   * 手动上报自定义错误
   * 允许开发者主动上报业务逻辑中发现的异常情况
   * @param message 错误消息
   * @param extra 额外的错误信息和上下文数据
   */
  public reportError(message: string, extra?: Record<string, any>): void {
    if (this.errorMonitor) {
      this.errorMonitor.reportCustomError(message, extra);
    }
  }

  /**
   * 手动上报自定义用户行为
   * 允许开发者记录特定的业务行为和用户操作
   * @param type 行为类型标识
   * @param data 行为相关的数据
   */
  public reportBehavior(type: string, data: Record<string, any>): void {
    if (this.behaviorMonitor) {
      this.behaviorMonitor.reportCustomBehavior(type, data);
    }
  }

  /**
   * 手动上报任意监控数据
   * 通用的数据上报接口，支持上报任何类型的监控数据
   * @param data 要上报的数据，不需要包含公共字段（会自动添加）
   */
  public report(data: Omit<ReportData, 'appId' | 'timestamp' | 'sessionId' | 'url' | 'userAgent' | 'breadcrumbs'>): void {
    this.monitor.report(data);
  }

  /**
   * 安装插件
   * 使用插件来扩展SDK的功能，支持链式调用
   * @param plugin 插件实例
   * @returns SDK实例，支持链式调用
   */
  public use(plugin: Plugin): WebMonitorSDK {
    this.monitor.use(plugin);
    return this;
  }

  /**
   * 卸载插件
   * 移除指定名称的插件，支持链式调用
   * @param pluginName 插件名称
   * @returns SDK实例，支持链式调用
   */
  public unuse(pluginName: string): WebMonitorSDK {
    this.monitor.unuse(pluginName);
    return this;
  }


  /**
   * 设置标签
   * 为监控数据添加标签，便于分类和筛选
   * @param key 标签键
   * @param value 标签值
   */
  public setTag(key: string, value: string): void {
    // 初始化tags对象（如果不存在）
    if (!(this.monitor as any).tags) {
      (this.monitor as any).tags = {};
    }
    // 设置标签键值对
    (this.monitor as any).tags[key] = value;
  }

  /**
   * 设置上下文信息
   * 为监控数据添加上下文信息，提供更丰富的环境数据
   * @param key 上下文键
   * @param value 上下文值
   */
  public setContext(key: string, value: any): void {
    // 初始化contexts对象（如果不存在）
    if (!(this.monitor as any).contexts) {
      (this.monitor as any).contexts = {};
    }
    // 设置上下文键值对
    (this.monitor as any).contexts[key] = value;
  }

  /**
   * 销毁SDK实例
   * 清理所有监控模块和资源，移除事件监听器，释放内存
   */
  public destroy(): void {
    // 检查是否已初始化
    if (!this.isInitialized) {
      return;
    }

    // 销毁所有监控模块
    this.performanceMonitor?.destroy();
    this.errorMonitor?.destroy();
    this.behaviorMonitor?.destroy();
    // 销毁核心监控器
    this.monitor.destroy();

    // 重置初始化状态
    this.isInitialized = false;
    // 从全局对象中移除SDK实例
    delete (window as any).__webMonitorSDK;

    // 在调试模式下输出销毁日志
    if (this.monitor.isDebug) {
      console.log('WebMonitorSDK destroyed');
    }
  }

  /**
   * 获取当前的SDK配置
   * @returns 配置对象，包含所有配置项
   */
  public getConfig(): any {
    return this.monitor['config'];
  }

  /**
   * 获取当前会话ID
   * 会话ID用于关联同一次访问中的所有事件
   * @returns 当前会话的唯一标识符
   */
  public getSessionId(): string {
    return this.monitor.currentSessionId;
  }

  /**
   * 手动刷新性能数据
   * 立即上报当前缓存的所有性能数据
   */
  public flushPerformance(): void {
    if (this.performanceMonitor) {
      this.performanceMonitor.flush();
    }
  }

  /**
   * 设置性能监控批量配置
   * @param options 批量配置选项
   */
  public setPerformanceBatchOptions(options: { enableBatch?: boolean; batchInterval?: number; batchSize?: number }): void {
    if (this.performanceMonitor) {
      this.performanceMonitor.setBatchOptions(options);
    }
  }

  /**
   * 获取性能监控批量状态
   * @returns 批量状态信息
   */
  public getPerformanceBatchStatus(): { enabled: boolean; queueLength: number; batchInterval: number; batchSize: number; startTime: number } | null {
    if (this.performanceMonitor) {
      return this.performanceMonitor.getBatchStatus();
    }
    return null;
  }


  /**
   * 设置全局调试方法
   * 在window对象上挂载便于调试的方法
   */
  private setupGlobalDebugMethods(): void {
    // 创建全局调试对象
    (window as any).WebMonitorSDK = {
      // 查看SDK状态
      debug: () => {
        this.monitor.logDebugInfo();
      },

      // 查看详细缓存数据
      viewCache: () => {
        this.monitor.transport.getStorageManager().logStorageData();
      },

      // 清空本地缓存
      clearCache: () => {
        this.monitor.transport.getStorageManager().clear();
        console.log('✅ 本地缓存已清空');
      },

      // 手动触发数据上报
      flush: () => {
        this.monitor.transport.flush();
        console.log('🚀 已手动触发数据上报');
      },

      // 获取队列状态
      getStatus: () => {
        const status = this.monitor.transport.getQueueStatus();
        console.table(status);
        return status;
      },

      // 查看原始localStorage数据
      getRawData: () => {
        const rawData = this.monitor.transport.getStorageManager().getRawData();
        if (rawData) {
          console.log('📄 原始localStorage数据:');
          console.log(rawData);
          return JSON.parse(rawData);
        } else {
          console.log('❌ 没有存储数据');
          return null;
        }
      },

      // 获取调试信息对象
      getDebugInfo: () => {
        return this.monitor.getDebugInfo();
      },

      // 性能监控相关调试方法
      performance: {
        // 手动刷新性能数据
        flush: () => {
          this.flushPerformance();
          console.log('🚀 已手动刷新性能监控数据');
        },

        // 获取性能批量状态
        getStatus: () => {
          const status = this.getPerformanceBatchStatus();
          if (status) {
            console.table(status);
            return status;
          } else {
            console.log('❌ 性能监控未启用');
            return null;
          }
        },

        // 设置批量配置
        setBatch: (options: { enableBatch?: boolean; batchInterval?: number; batchSize?: number }) => {
          this.setPerformanceBatchOptions(options);
          console.log('⚙️ 性能监控批量配置已更新:', options);
        },

        // 禁用批量模式
        disableBatch: () => {
          this.setPerformanceBatchOptions({ enableBatch: false });
          console.log('❌ 性能监控批量模式已禁用');
        },

        // 启用批量模式
        enableBatch: () => {
          this.setPerformanceBatchOptions({ enableBatch: true });
          console.log('✅ 性能监控批量模式已启用');
        }
      },

      // 帮助信息
      help: () => {
        console.group('🔧 WebMonitorSDK 调试命令');
        console.log('基础命令:');
        console.log('  WebMonitorSDK.debug()         - 查看完整调试信息');
        console.log('  WebMonitorSDK.viewCache()     - 查看详细缓存数据');
        console.log('  WebMonitorSDK.clearCache()    - 清空本地缓存');
        console.log('  WebMonitorSDK.flush()         - 手动触发数据上报');
        console.log('  WebMonitorSDK.getStatus()     - 获取队列状态');
        console.log('  WebMonitorSDK.getRawData()    - 查看原始localStorage数据');
        console.log('  WebMonitorSDK.getDebugInfo()  - 获取调试信息对象');
        console.log('');
        console.log('性能监控命令:');
        console.log('  WebMonitorSDK.performance.flush()        - 刷新性能数据');
        console.log('  WebMonitorSDK.performance.getStatus()    - 获取性能批量状态');
        console.log('  WebMonitorSDK.performance.setBatch(opts) - 设置批量配置');
        console.log('  WebMonitorSDK.performance.enableBatch()  - 启用批量模式');
        console.log('  WebMonitorSDK.performance.disableBatch() - 禁用批量模式');
        console.log('');
        console.log('  WebMonitorSDK.help()          - 显示此帮助信息');
        console.groupEnd();
      }
    };

    // 在调试模式下提示用户
    if (this.monitor.isDebug) {
      console.log('🔧 WebMonitorSDK 调试模式已启用');
      console.log('💡 使用 WebMonitorSDK.help() 查看可用的调试命令');
    }
  }
}

/**
 * 创建WebMonitorSDK实例的工厂函数
 * 提供一种更函数式的创建方式
 * @param config 监控配置对象
 * @returns WebMonitorSDK实例
 */
export function createWebMonitorSDK(config: MonitorConfig): WebMonitorSDK {
  return new WebMonitorSDK(config);
}

// 导出内置插件
export { VuePlugin, ReactPlugin };

// 导出TypeScript类型定义
export * from './types';

export default WebMonitorSDK;
