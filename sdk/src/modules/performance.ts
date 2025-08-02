import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { Monitor } from '../core/Monitor';
import { PerformanceData, PerformanceType, DataType, BatchPerformanceData } from '../types';

/**
 * 性能监控类
 * 负责收集和监控各种性能指标，包括Core Web Vitals、导航时间、资源加载时间和API请求时间
 */
export class PerformanceMonitor {
  /** 监控器实例，用于上报性能数据 */
  private monitor: Monitor;
  /** 性能观察器，用于监听资源加载事件 */
  private observer: PerformanceObserver | null = null;
  
  /** 性能数据缓存队列 */
  private performanceQueue: PerformanceData[] = [];
  /** 批量上报定时器 */
  private batchTimer: NodeJS.Timeout | null = null;
  /** 批量上报间隔（毫秒），默认5秒 */
  private batchInterval = 5000;
  /** 批量大小，默认10个指标合并为一次上报 */
  private batchSize = 10;
  /** 数据收集开始时间 */
  private batchStartTime = Date.now();
  /** 是否启用批量上报，默认启用 */
  private enableBatch = true;

  /**
   * 构造函数
   * @param monitor 监控器实例
   */
  constructor(monitor: Monitor, options?: { enableBatch?: boolean; batchInterval?: number; batchSize?: number }) {
    this.monitor = monitor;
    
    // 配置批量上报选项
    if (options) {
      this.enableBatch = options.enableBatch ?? true;
      this.batchInterval = options.batchInterval ?? 5000;
      this.batchSize = options.batchSize ?? 10;
    }
    
    // 初始化性能监控
    this.init();
    
    // 启动批量上报定时器
    if (this.enableBatch) {
      this.startBatchTimer();
    }
  }

  /**
   * 初始化性能监控
   * 启动所有性能数据收集功能
   */
  private init(): void {
    // 收集Core Web Vitals指标
    this.collectWebVitals();
    // 收集页面导航时间
    this.collectNavigationTiming();
    // 收集资源加载时间
    this.collectResourceTiming();
    // 收集API请求时间
    this.collectAPITiming();
  }

  /**
   * 收集Core Web Vitals指标
   * 使用web-vitals库收集LCP、FID、CLS、FCP、TTFB等关键性能指标
   */
  private collectWebVitals(): void {
    // Largest Contentful Paint - 最大内容绘制时间
    // 衡量页面加载性能的重要指标
    onLCP((metric: Metric) => {
      this.reportMetric({
        type: PerformanceType.LCP,
        name: 'LCP',
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        entries: metric.entries
      });
    });

    // Interaction to Next Paint - 交互到下次绘制延迟
    // 衡量页面交互响应性的关键指标
    onINP((metric: Metric) => {
      this.reportMetric({
        type: PerformanceType.INP,
        name: 'INP',
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        entries: metric.entries
      });
    });

    // Cumulative Layout Shift - 累积布局偏移
    // 衡量页面视觉稳定性的重要指标
    onCLS((metric: Metric) => {
      this.reportMetric({
        type: PerformanceType.CLS,
        name: 'CLS',
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        entries: metric.entries
      });
    });

    // First Contentful Paint - 首次内容绘制
    // 衡量页面加载感知速度的指标
    onFCP((metric: Metric) => {
      this.reportMetric({
        type: PerformanceType.FCP,
        name: 'FCP',
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        entries: metric.entries
      });
    });

    // Time to First Byte - 首字节时间
    // 衡量服务器响应速度的指标
    onTTFB((metric: Metric) => {
      this.reportMetric({
        type: PerformanceType.TTFB,
        name: 'TTFB',
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        entries: metric.entries
      });
    });
  }

  /**
   * 收集页面导航时间
   * 分析页面加载各个阶段的耗时，包括DNS查询、TCP连接、SSL握手、请求响应等
   */
  private collectNavigationTiming(): void {
    // 监听页面加载完成事件
    window.addEventListener('load', () => {
      // 延迟执行确保所有指标都已计算完成
      setTimeout(() => {
        // 获取导航时间条目
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (!navigation) return;

        // 计算各个阶段的耗时
        const timing = {
          /** DNS查询耗时 */
          dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
          /** TCP连接耗时 */
          tcpConnect: navigation.connectEnd - navigation.connectStart,
          /** SSL握手耗时 */
          sslConnect: navigation.secureConnectionStart > 0 ? navigation.connectEnd - navigation.secureConnectionStart : 0,
          /** 请求耗时 */
          request: navigation.responseStart - navigation.requestStart,
          /** 响应耗时 */
          response: navigation.responseEnd - navigation.responseStart,
          /** DOM解析耗时 */
          domParse: navigation.domInteractive - navigation.responseEnd,
          /** DOMContentLoaded事件耗时 */
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          /** 页面完全加载耗时 */
          loadComplete: navigation.loadEventEnd - navigation.fetchStart,
          /** 首次绘制时间 */
          firstPaint: this.getFirstPaint(),
          /** 首次内容绘制时间 */
          firstContentfulPaint: this.getFirstContentfulPaint()
        };

        // 上报导航时间数据
        this.reportMetric({
          type: PerformanceType.NAVIGATION,
          name: 'Navigation Timing',
          value: timing.loadComplete,
          entries: [navigation as any],
          navigationType: this.getNavigationType(typeof navigation.type === 'number' ? navigation.type : 0)
        });

        // 添加页面加载完成的面包屑记录
        this.monitor.addBreadcrumb({
          timestamp: Date.now(),
          type: DataType.PERFORMANCE,
          category: 'navigation',
          message: 'Page loaded',
          level: 'info',
          data: timing
        });
      }, 0);
    });
  }

  /**
   * 收集资源加载时间
   * 监控页面中所有资源（图片、脚本、样式表等）的加载性能
   */
  private collectResourceTiming(): void {
    // 检查浏览器是否支持PerformanceObserver
    if (!PerformanceObserver) return;

    try {
      // 创建性能观察器监听资源加载事件
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resource = entry as PerformanceResourceTiming;
            
            // 过滤SDK自身的请求，避免循环上报
            if (resource.name.includes(this.monitor.appId)) return;

            // 上报资源加载性能数据
            this.reportMetric({
              type: PerformanceType.RESOURCE,
              name: resource.name,
              value: resource.duration,
              entries: [entry]
            });

            // 对加载时间超过3秒的资源添加警告面包屑
            if (resource.duration > 3000) {
              this.monitor.addBreadcrumb({
                timestamp: Date.now(),
                type: DataType.PERFORMANCE,
                category: 'resource',
                message: `Slow resource: ${resource.name}`,
                level: 'warning',
                data: {
                  duration: resource.duration,
                  size: resource.transferSize || 0
                }
              });
            }
          }
        });
      });

      // 开始观察资源类型的性能条目
      this.observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      // 静默处理PerformanceObserver创建失败的错误
    }
  }

  /**
   * 收集API请求时间
   * 拦截fetch和XMLHttpRequest请求，统计API调用的性能数据
   */
  private collectAPITiming(): void {
    // 拦截fetch API调用
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      // 记录请求开始时间
      const startTime = performance.now();
      // 提取请求URL
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      
      try {
        // 执行原始的fetch请求
        const response = await originalFetch.apply(window, args);
        const endTime = performance.now();
        const duration = endTime - startTime;

        // 上报API性能数据
        this.reportMetric({
          type: PerformanceType.API,
          name: url,
          value: duration,
          entries: []
        });

        // 对响应时间超过2秒的API添加警告面包屑
        if (duration > 2000) {
          this.monitor.addBreadcrumb({
            timestamp: Date.now(),
            type: DataType.PERFORMANCE,
            category: 'api',
            message: `Slow API: ${url}`,
            level: 'warning',
            data: {
              duration,
              status: response.status
            }
          });
        }

        return response;
      } catch (error) {
        // 处理请求失败情况
        const endTime = performance.now();
        const duration = endTime - startTime;

        // 上报失败的API请求数据
        this.reportMetric({
          type: PerformanceType.API,
          name: url,
          value: duration,
          entries: []
        });

        // 重新抛出错误，保持原有的错误处理逻辑
        throw error;
      }
    };

    // 拦截XMLHttpRequest API调用
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    const self = this; // 保存当前实例的引用

    // 拦截XMLHttpRequest.open方法
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async?: boolean, user?: string | null, password?: string | null) {
      // 在xhr根对象上存储请求信息
      (this as any)._monitor_url = url.toString();
      (this as any)._monitor_startTime = performance.now();
      // 调用原始open方法
      return originalOpen.call(this, method, url, async ?? true, user, password);
    };

    // 拦截XMLHttpRequest.send方法
    XMLHttpRequest.prototype.send = function(body?: any) {
      const xhr = this;
      const startTime = (xhr as any)._monitor_startTime;
      const url = (xhr as any)._monitor_url;

      // 监听请求状态变化
      const onReadyStateChange = () => {
        // 请求完成时计算耗时
        if (xhr.readyState === 4) {
          const endTime = performance.now();
          const duration = endTime - startTime;

          // 使用闭包保存的self引用上报数据
          if (self && url) {
            self.reportMetric({
              type: PerformanceType.API,
              name: url,
              value: duration,
              entries: []
            });

            // 对慢请求添加面包屑记录
            if (duration > 2000) {
              self.monitor.addBreadcrumb({
                timestamp: Date.now(),
                type: DataType.PERFORMANCE,
                category: 'api',
                message: `Slow XHR: ${url}`,
                level: 'warning',
                data: {
                  duration,
                  status: xhr.status
                }
              });
            }
          }
        }
      };

      // 添加事件监听器
      xhr.addEventListener('readystatechange', onReadyStateChange);
      // 调用原始send方法
      return originalSend.call(this, body);
    };
  }

  /**
   * 获取首次绘制时间
   * @returns 首次绘制的时间戳，无法获取时返回0
   */
  private getFirstPaint(): number {
    // 获取所有paint类型的性能条目
    const entries = performance.getEntriesByType('paint');
    // 查找首次绘制条目
    const fpEntry = entries.find(entry => entry.name === 'first-paint');
    // 返回时间戳或默认值0
    return fpEntry ? fpEntry.startTime : 0;
  }

  /**
   * 获取首次内容绘制时间
   * @returns 首次内容绘制的时间戳，无法获取时返回0
   */
  private getFirstContentfulPaint(): number {
    // 获取所有paint类型的性能条目
    const entries = performance.getEntriesByType('paint');
    // 查找首次内容绘制条目
    const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
    // 返回时间戳或默认值0
    return fcpEntry ? fcpEntry.startTime : 0;
  }

  /**
   * 获取导航类型字符串
   * @param type 导航类型数字
   * @returns 导航类型的字符串描述
   */
  private getNavigationType(type: number): string {
    // 导航类型映射表
    const types = ['navigate', 'reload', 'back_forward', 'prerender'];
    // 返回对应的类型名称或未知
    return types[type] || 'unknown';
  }

  /**
   * 启动批量上报定时器
   */
  private startBatchTimer(): void {
    this.batchTimer = setInterval(() => {
      this.flushBatch();
    }, this.batchInterval);
  }

  /**
   * 停止批量上报定时器
   */
  private stopBatchTimer(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * 刷新批量数据，立即上报当前缓存的所有性能数据
   */
  private flushBatch(): void {
    if (this.performanceQueue.length === 0) return;

    const batchData = this.createBatchData();
    
    // 通过监控器上报批量数据
    this.monitor.report({
      type: DataType.PERFORMANCE,
      data: batchData
    });

    // 清空队列，重置计时器
    this.resetBatch();
  }

  /**
   * 创建批量性能数据
   */
  private createBatchData(): BatchPerformanceData {
    const endTime = Date.now();
    const metrics = [...this.performanceQueue];
    
    // 生成摘要信息
    const summary = this.generateSummary(metrics);

    return {
      type: PerformanceType.BATCH,
      name: 'Performance Metrics Batch',
      count: metrics.length,
      startTime: this.batchStartTime,
      endTime,
      metrics,
      summary
    };
  }

  /**
   * 生成性能数据摘要
   */
  private generateSummary(metrics: PerformanceData[]) {
    const summary: BatchPerformanceData['summary'] = {
      vitals: {},
      navigation: {},
      resources: { count: 0, slowCount: 0, totalSize: 0 },
      apis: { count: 0, slowCount: 0, avgDuration: 0 }
    };

    let apiDurations: number[] = [];

    metrics.forEach(metric => {
      switch (metric.type) {
        case PerformanceType.LCP:
          summary.vitals!.lcp = metric.value;
          break;
        case PerformanceType.INP:
          summary.vitals!.inp = metric.value;
          break;
        case PerformanceType.CLS:
          summary.vitals!.cls = metric.value;
          break;
        case PerformanceType.FCP:
          summary.vitals!.fcp = metric.value;
          break;
        case PerformanceType.TTFB:
          summary.vitals!.ttfb = metric.value;
          break;
        case PerformanceType.NAVIGATION:
          summary.navigation!.loadComplete = metric.value;
          // 从 entries 中提取 domContentLoaded 时间
          if (metric.entries && metric.entries[0]) {
            const nav = metric.entries[0] as PerformanceNavigationTiming;
            summary.navigation!.domContentLoaded = nav.domContentLoadedEventEnd - nav.fetchStart;
          }
          break;
        case PerformanceType.RESOURCE:
          summary.resources!.count++;
          if (metric.value > 3000) {
            summary.resources!.slowCount++;
          }
          // 从 entries 中提取资源大小
          if (metric.entries && metric.entries[0]) {
            const resource = metric.entries[0] as PerformanceResourceTiming;
            summary.resources!.totalSize = (summary.resources!.totalSize || 0) + (resource.transferSize || 0);
          }
          break;
        case PerformanceType.API:
          summary.apis!.count++;
          if (metric.value > 2000) {
            summary.apis!.slowCount++;
          }
          apiDurations.push(metric.value);
          break;
      }
    });

    // 计算API平均耗时
    if (apiDurations.length > 0) {
      summary.apis!.avgDuration = apiDurations.reduce((a, b) => a + b, 0) / apiDurations.length;
    }

    return summary;
  }

  /**
   * 重置批量数据
   */
  private resetBatch(): void {
    this.performanceQueue = [];
    this.batchStartTime = Date.now();
  }

  /**
   * 上报性能指标数据
   * 将性能数据包装成标准格式并上报给监控器
   * @param data 性能指标数据
   */
  private reportMetric(data: PerformanceData): void {
    if (this.enableBatch) {
      // 添加到批量队列
      this.performanceQueue.push(data);
      
      // 如果队列达到批量大小，立即上报
      if (this.performanceQueue.length >= this.batchSize) {
        this.flushBatch();
      }
    } else {
      // 直接上报
      this.monitor.report({
        type: DataType.PERFORMANCE,
        data
      });
    }
  }

  /**
   * 手动刷新批量数据
   * 立即上报当前缓存的所有性能数据
   */
  public flush(): void {
    if (this.enableBatch) {
      this.flushBatch();
    }
  }

  /**
   * 设置批量上报配置
   * @param options 批量配置选项
   */
  public setBatchOptions(options: { enableBatch?: boolean; batchInterval?: number; batchSize?: number }): void {
    const wasEnabled = this.enableBatch;
    
    // 更新配置
    if (options.enableBatch !== undefined) {
      this.enableBatch = options.enableBatch;
    }
    if (options.batchInterval !== undefined) {
      this.batchInterval = options.batchInterval;
    }
    if (options.batchSize !== undefined) {
      this.batchSize = options.batchSize;
    }

    // 如果批量模式状态发生变化，需要重新配置定时器
    if (wasEnabled !== this.enableBatch) {
      if (this.enableBatch) {
        // 启用批量模式：先刷新现有数据，然后启动定时器
        if (this.performanceQueue.length > 0) {
          this.flushBatch();
        }
        this.startBatchTimer();
      } else {
        // 禁用批量模式：停止定时器，刷新剩余数据
        this.stopBatchTimer();
        if (this.performanceQueue.length > 0) {
          this.flushBatch();
        }
      }
    } else if (this.enableBatch && this.batchTimer) {
      // 批量模式仍然启用，但间隔时间可能变化，重启定时器
      this.stopBatchTimer();
      this.startBatchTimer();
    }
  }

  /**
   * 获取当前批量队列状态
   */
  public getBatchStatus(): {
    enabled: boolean;
    queueLength: number;
    batchInterval: number;
    batchSize: number;
    startTime: number;
  } {
    return {
      enabled: this.enableBatch,
      queueLength: this.performanceQueue.length,
      batchInterval: this.batchInterval,
      batchSize: this.batchSize,
      startTime: this.batchStartTime
    };
  }

  /**
   * 销毁性能监控器
   * 清理所有观察器和事件监听器
   */
  public destroy(): void {
    // 停止批量上报定时器
    this.stopBatchTimer();
    
    // 刷新剩余的批量数据
    if (this.enableBatch && this.performanceQueue.length > 0) {
      this.flushBatch();
    }
    
    // 断开性能观察器
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    // 清空队列
    this.performanceQueue = [];
    
    // 注意：实际应用中还应该恢复被拦截的fetch和XHR原始方法
  }
}