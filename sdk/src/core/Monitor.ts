import { MonitorConfig, ReportData, Breadcrumb, Plugin } from '../types';
import { Transport } from './Transport';
import { generateSessionId, generateUserId, getConnectionType } from '../utils/common';

/**
 * 监控器核心类
 * 负责管理整个SDK的配置、数据收集、插件管理和数据上报
 */
export class Monitor {
  /** 合并后的完整配置对象 */
  private config: Required<MonitorConfig>;
  /** 数据传输管理器 */
  private transport: Transport;
  /** 面包屑记录数组，用于记录用户操作轨迹 */
  private breadcrumbs: Breadcrumb[] = [];
  /** 插件映射表，用于管理已安装的插件 */
  private plugins: Map<string, Plugin> = new Map();
  /** 当前会话的唯一标识符 */
  private sessionId: string;
  /** 当前用户的唯一标识符 */
  private userId: string;
  /** 标识监控器是否已被销毁 */
  private isDestroyed = false;

  /**
   * 监控器构造函数
   * @param config 监控配置对象
   */
  constructor(config: MonitorConfig) {
    // 合并配置，为可选参数设置默认值
    this.config = this.mergeConfig(config);
    // 生成会话ID和用户ID
    this.sessionId = generateSessionId();
    this.userId = generateUserId();
    // 初始化数据传输管理器
    this.transport = new Transport({
      url: this.config.reportUrl,
      reportInterval: this.config.reportInterval,
      batchSize: this.config.batchSize,
      maxQueueSize: this.config.maxQueueSize,
      enableImmediateReport: this.config.enableImmediateReport
    });

    // 初始化监控器
    this.init();
  }

  /**
   * 合并用户配置和默认配置
   * 为所有可选配置项提供合理的默认值
   * @param config 用户提供的配置对象
   * @returns 合并后的完整配置对象
   */
  private mergeConfig(config: MonitorConfig): Required<MonitorConfig> {
    return {
      appId: config.appId,
      reportUrl: config.reportUrl,
      sampling: config.sampling ?? 1, // 默认100%采样
      debug: config.debug ?? false, // 默认关闭调试模式
      enablePerformance: config.enablePerformance ?? true, // 默认开启性能监控
      enableError: config.enableError ?? true, // 默认开启错误监控
      enableBehavior: config.enableBehavior ?? true, // 默认开启行为监控
      maxBreadcrumbsNum: config.maxBreadcrumbsNum ?? 20, // 默认最多保存20条面包屑
      beforeSend: config.beforeSend ?? ((data) => data), // 默认不对数据进行处理
      reportInterval: config.reportInterval ?? 60000, // 默认60秒（1分钟）上报间隔
      batchSize: config.batchSize ?? 10, // 默认批量大小为10
      maxQueueSize: config.maxQueueSize ?? 100, // 默认队列最大100条
      enableImmediateReport: config.enableImmediateReport ?? true // 默认启用立即上报
    };
  }

  /**
   * 初始化监控器
   * 根据采样率决定是否启动监控功能
   */
  private init(): void {
    // 根据采样率决定是否启动监控
    if (this.shouldSample()) {
      this.setupErrorHandling();
    }
  }

  /**
   * 检查当前请求是否应该被采样
   * 使用随机数和采样率进行比较
   * @returns 如果应该采样返回true，否则返回false
   */
  private shouldSample(): boolean {
    return Math.random() < this.config.sampling;
  }

  /**
   * 设置全局错误处理
   * 监听全局错误事件并确保SDK本身的错误不会影响宿主应用
   */
  private setupErrorHandling(): void {
    // 保存原始的console.error方法
    const originalError = console.error;
    // 重写console.error，添加异常保护
    console.error = (...args) => {
      try {
        originalError.apply(console, args);
      } catch (e) {
        // 确保SDK本身的错误不会影响宿主应用
      }
    };

    // 监听JavaScript运行时错误
    window.addEventListener('error', (_event) => {
      this.safeExecute(() => {
        // 错误处理逻辑将在后续模块中实现
      });
    });

    // 监听Promise未处理的异常
    window.addEventListener('unhandledrejection', (_event) => {
      this.safeExecute(() => {
        // Promise错误处理逻辑将在后续模块中实现
      });
    });
  }

  /**
   * 安全执行函数
   * 在try-catch块中执行函数，确保SDK内部错误不会影响宿主应用
   * @param fn 需要安全执行的函数
   */
  private safeExecute(fn: () => void): void {
    try {
      // 检查监控器是否已被销毁
      if (!this.isDestroyed) {
        fn();
      }
    } catch (error) {
      // 在调试模式下输出SDK内部错误信息
      if (this.config.debug) {
        console.warn('WebMonitorSDK internal error:', error);
      }
    }
  }

  /**
   * 添加面包屑记录
   * 在面包屑数组中添加新的记录，如果超过最大数量则删除最早的记录
   * @param breadcrumb 需要添加的面包屑记录
   */
  public addBreadcrumb(breadcrumb: Breadcrumb): void {
    // 如果超过最大数量，删除最早的记录
    if (this.breadcrumbs.length >= this.config.maxBreadcrumbsNum) {
      this.breadcrumbs.shift();
    }
    // 添加新记录到数组末尾
    this.breadcrumbs.push(breadcrumb);
  }

  /**
   * 上报监控数据
   * 将监控数据包装成标准格式并发送到后端
   * @param data 需要上报的数据（不包含公共字段）
   */
  public report(data: Omit<ReportData, 'appId' | 'timestamp' | 'sessionId' | 'url' | 'userAgent' | 'connectionType' | 'breadcrumbs'>): void {
    this.safeExecute(() => {
      // 构建完整的上报数据对象
      const reportData: ReportData = {
        appId: this.config.appId, // 应用ID
        timestamp: Date.now(), // 当前时间戳
        sessionId: this.sessionId, // 会话ID
        userId: this.userId, // 用户ID
        url: window.location.href, // 当前页面URL
        userAgent: navigator.userAgent, // 用户代理
        connectionType: getConnectionType(), // 网络连接类型
        breadcrumbs: [...this.breadcrumbs], // 面包屑记录的拷贝
        ...data // 具体的监控数据
      };

      // 调用用户配置的beforeSend钩子函数
      const processedData = this.config.beforeSend(reportData);
      // 如果函数返回null，则不发送数据
      if (processedData) {
        this.transport.send(processedData);
        
        // 在调试模式下输出上报的数据
        if (this.config.debug) {
          console.log('WebMonitorSDK Report:', processedData);
        }
      }
    });
  }

  /**
   * 安装插件
   * 向SDK中添加一个新的插件，并调用其安装方法
   * @param plugin 需要安装的插件对象
   */
  public use(plugin: Plugin): void {
    // 检查插件是否已经安装
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin ${plugin.name} already installed`);
      return;
    }

    // 将插件添加到插件映射表中
    this.plugins.set(plugin.name, plugin);
    // 调用插件的安装方法
    plugin.install(this);
  }

  /**
   * 卸载插件
   * 从 SDK 中移除指定的插件，并调用其卸载方法
   * @param pluginName 需要卸载的插件名称
   */
  public unuse(pluginName: string): void {
    // 从插件映射表中获取插件
    const plugin = this.plugins.get(pluginName);
    // 如果插件存在且有卸载方法，则调用卸载方法
    if (plugin && plugin.uninstall) {
      plugin.uninstall(this);
    }
    // 从插件映射表中移除插件
    this.plugins.delete(pluginName);
  }

  /**
   * 销毁监控器
   * 清理所有资源，卸载所有插件，停止所有监控功能
   */
  public destroy(): void {
    // 标记监控器为已销毁状态
    this.isDestroyed = true;
    // 销毁数据传输管理器
    this.transport.destroy();
    // 卸载所有插件
    this.plugins.forEach(plugin => {
      if (plugin.uninstall) {
        plugin.uninstall(this);
      }
    });
    // 清空插件映射表
    this.plugins.clear();
    // 清空面包屑记录
    this.breadcrumbs = [];
  }

  // Getters - 公共访问器方法
  
  /**
   * 获取是否开启调试模式
   * @returns 调试模式状态
   */
  public get isDebug(): boolean {
    return this.config.debug;
  }

  /**
   * 获取应用ID
   * @returns 当前应用的唯一标识符
   */
  public get appId(): string {
    return this.config.appId;
  }

  /**
   * 获取当前会话ID
   * @returns 当前会话的唯一标识符
   */
  public get currentSessionId(): string {
    return this.sessionId;
  }

  /**
   * 获取当前用户ID
   * @returns 当前用户的唯一标识符
   */
  public get currentUserId(): string {
    return this.userId;
  }
}