import { ReportData, TransportOptions } from '../types';
import { StorageManager } from '../utils/storage';

/**
 * 数据传输管理器
 * 负责将监控数据缓存并按时间间隔发送到后端服务器
 * 
 * 特性：
 * - 单一队列数据缓存
 * - 可配置的时间间隔批量上报
 * - 队列溢出保护
 * - 失败重试机制
 * - 页面卸载时的数据保护
 */
export class Transport {
  /** 数据队列 */
  private dataQueue: ReportData[] = [];
  /** 定时器ID，用于定时批量发送数据 */
  private reportTimer: number | null = null;
  /** 传输配置选项 */
  private options: Required<TransportOptions>;
  /** 标识传输器是否已被销毁 */
  private isDestroyed = false;
  /** 当前正在发送的请求数量 */
  private pendingRequests = 0;
  /** 失败重试队列 */
  private retryQueue: Array<{ data: ReportData[], retryCount: number, nextRetryTime: number }> = [];
  /** 本地存储管理器 */
  private storageManager: StorageManager;

  /**
   * 构造函数
   * @param options 传输配置选项，包含各种缓存和上报策略配置
   */
  constructor(options: TransportOptions) {
    // 合并传输配置选项，提供完整的默认值
    this.options = {
      url: options.url,
      timeout: options.timeout ?? 5000, // 默认超时时间5秒
      withCredentials: options.withCredentials ?? false, // 默认不携带身份凭证
      headers: options.headers ?? {}, // 默认空请求头
      reportInterval: options.reportInterval ?? 60000, // 默认60秒（1分钟）上报间隔
      batchSize: options.batchSize ?? 10, // 默认批量大小10条
      maxQueueSize: options.maxQueueSize ?? 100, // 默认队列最大100条
      enableImmediateReport: options.enableImmediateReport ?? true, // 默认启用立即上报
      retryCount: options.retryCount ?? 3, // 默认重试3次
      retryInterval: options.retryInterval ?? 1000 // 默认重试间隔1秒
    };

    // 初始化存储管理器
    this.storageManager = new StorageManager();
    
    // 从本地存储恢复未上报的数据
    this.loadDataFromStorage();
    
    // 启动定时上报机制
    this.startReportTimer();
    // 设置页面关闭前的数据保护
    this.setupBeforeUnload();
    // 启动重试机制
    this.startRetryTimer();
  }

  /**
   * 从本地存储加载未上报的数据
   */
  private loadDataFromStorage(): void {
    const storedData = this.storageManager.load();
    this.dataQueue.push(...storedData);
    
    // 加载完成后清空存储
    this.storageManager.clear();
  }

  /**
   * 保存数据到本地存储
   */
  private saveDataToStorage(): void {
    if (this.dataQueue.length > 0) {
      this.storageManager.save(this.dataQueue);
    }
  }

  /**
   * 启动定时上报定时器
   * 按配置的时间间隔定期检查并上报缓存的数据
   * 考虑上次上报时间，避免页面刷新时重新计时
   */
  private startReportTimer(): void {
    const now = Date.now();
    const lastReportTime = this.storageManager.getLastReportTime();
    
    // 计算距离下次上报的剩余时间
    let nextReportDelay = this.options.reportInterval;
    if (lastReportTime > 0) {
      const timeSinceLastReport = now - lastReportTime;
      if (timeSinceLastReport < this.options.reportInterval) {
        // 如果距离上次上报还没到间隔时间，就等待剩余时间
        nextReportDelay = this.options.reportInterval - timeSinceLastReport;
      } else {
        // 如果已经超过间隔时间，立即上报
        nextReportDelay = 0;
      }
    }

    // 如果需要立即上报
    if (nextReportDelay <= 0) {
      this.processQueuedData();
      nextReportDelay = this.options.reportInterval;
    }

    // 设置定时器
    this.reportTimer = window.setInterval(() => {
      this.processQueuedData();
    }, this.options.reportInterval);

    // 如果首次延迟不等于间隔时间，需要先设置一个一次性定时器
    if (nextReportDelay !== this.options.reportInterval) {
      setTimeout(() => {
        this.processQueuedData();
      }, nextReportDelay);
    }
  }

  /**
   * 启动重试定时器
   * 定期检查并处理失败的重试请求
   */
  private startRetryTimer(): void {
    setInterval(() => {
      this.processRetryQueue();
    }, this.options.retryInterval);
  }

  /**
   * 设置页面关闭前的数据保护
   * 监听页面卸载和可见性变化事件，确保缓存数据不丢失
   */
  private setupBeforeUnload(): void {
    // 监听页面即将卸载事件
    window.addEventListener('beforeunload', () => {
      this.saveDataToStorage();
      this.flushAllQueues();
    });

    // 监听页面可见性变化事件（如切换标签页）
    window.addEventListener('visibilitychange', () => {
      // 当页面被隐藏时，保存数据到本地存储并尝试发送剩余数据
      if (document.visibilityState === 'hidden') {
        this.saveDataToStorage();
        this.flushAllQueues();
      }
    });
  }

  /**
   * 刷新队列中的数据
   * 在页面关闭或隐藏时调用，使用sendBeacon确保数据可靠发送
   */
  private flushAllQueues(): void {
    if (this.dataQueue.length > 0) {
      // 使用sendBeacon发送剩余数据，保证即使页面关闭也能发送成功
      this.trySendBeacon(this.dataQueue);
      
      // 清空队列
      this.dataQueue = [];
    }
  }

  /**
   * 发送数据
   * 将数据加入队列，等待批量发送
   * @param data 需要发送的监控数据
   */
  public send(data: ReportData): void {
    // 检查传输器是否已被销毁
    if (this.isDestroyed) return;
    
    // 数据加入队列
    this.dataQueue.push(data);
    
    // 检查是否需要强制上报（队列溢出保护）
    this.checkQueueOverflow();
  }

  /**
   * 处理队列中的数据
   * 按批量大小处理队列中的数据，处理完成后清空本地缓存
   */
  private processQueuedData(): void {
    if (this.isDestroyed || this.pendingRequests > 3) return; // 限制并发请求数
    
    const hasData = this.dataQueue.length > 0;
    
    // 处理队列数据
    if (this.dataQueue.length > 0) {
      const batch = this.dataQueue.splice(0, this.options.batchSize);
      this.sendBatch(batch);
      
      // 更新上次上报时间
      this.storageManager.saveLastReportTime(Date.now());
    }
    
    // 如果有数据被处理，清空本地存储
    if (hasData) {
      this.storageManager.clear();
    }
  }

  /**
   * 批量发送数据
   * @param batch 需要发送的数据批次
   */
  private sendBatch(batch: ReportData[]): void {
    if (this.isDestroyed) return;
    
    this.pendingRequests++;
    
    // 将数据序列化为JSON字符串
    const data = JSON.stringify(batch);
    
    // 尝试发送数据
    const sendPromise = this.sendFetch(data).catch(() => this.sendXHR(data));
    
    // 处理发送结果
    Promise.resolve(sendPromise)
      .then(() => {
        this.pendingRequests--;
        // 发送成功，记录日志
        if (this.options.headers?.['debug']) {
          console.log(`数据上报成功: ${batch.length} 条数据`);
        }
      })
      .catch(() => {
        this.pendingRequests--;
        // 发送失败，加入重试队列
        this.addToRetryQueue(batch);
      });
  }


  /**
   * 尝试使用sendBeacon API发送数据
   * sendBeacon是最可靠的数据发送方式，即使页面关闭也能保证数据送达
   * @param data 需要发送的数据数组
   * @returns 如果发送成功返回Promise<void>，失败或不支持返回null
   */
  private trySendBeacon(data: ReportData[]): Promise<void> | null {
    // 检查浏览器是否支持sendBeacon API
    if (!navigator.sendBeacon) {
      return null;
    }

    try {
      // 将数据序列化为JSON字符串
      const payload = JSON.stringify(data);
      // 创建Blob对象，设置正确的MIME类型
      const blob = new Blob([payload], { type: 'application/json' });
      // 使用sendBeacon发送数据
      const success = navigator.sendBeacon(this.options.url, blob);
      return success ? Promise.resolve() : Promise.reject(new Error('SendBeacon failed'));
    } catch (error) {
      return Promise.reject(error);
    }
  }



  /**
   * 检查队列是否溢出，如果溢出则强制上报
   */
  private checkQueueOverflow(): void {
    if (this.dataQueue.length >= this.options.maxQueueSize) {
      // 队列溢出，强制上报部分数据
      this.processQueuedData();
    }
  }

  /**
   * 将失败的数据加入重试队列
   * @param data 失败的数据
   */
  private addToRetryQueue(data: ReportData[]): void {
    const retryItem = {
      data,
      retryCount: 0,
      nextRetryTime: Date.now() + this.options.retryInterval
    };
    this.retryQueue.push(retryItem);
  }

  /**
   * 处理重试队列
   */
  private processRetryQueue(): void {
    if (this.retryQueue.length === 0 || this.pendingRequests > 3) return;
    
    const now = Date.now();
    const readyToRetry = this.retryQueue.filter(item => now >= item.nextRetryTime);
    
    readyToRetry.forEach(item => {
      if (item.retryCount < this.options.retryCount) {
        item.retryCount++;
        item.nextRetryTime = now + this.options.retryInterval * Math.pow(2, item.retryCount); // 指数退避
        
        // 重新尝试发送
        this.sendBatch(item.data);
      } else {
        // 超过重试次数，放弃该数据
        const index = this.retryQueue.indexOf(item);
        if (index > -1) {
          this.retryQueue.splice(index, 1);
        }
      }
    });
  }

  /**
   * 使用fetch API发送数据
   * 现代浏览器的标准HTTP请求方式，支持Promise和请求取消
   * @param data 需要发送的JSON字符串数据
   * @returns Promise对象，成功时resolve，失败时reject
   */
  private async sendFetch(data: string): Promise<void> {
    // 创建AbortController用于请求超时控制
    const controller = new AbortController();
    // 设置超时定时器，超时后取消请求
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

    try {
      // 发送POST请求
      await fetch(this.options.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.options.headers // 合并自定义请求头
        },
        body: data,
        // 根据配置决定是否携带身份凭证
        credentials: this.options.withCredentials ? 'include' : 'omit',
        signal: controller.signal // 关联取消信号
      });
    } finally {
      // 无论成功失败都要清理定时器
      clearTimeout(timeoutId);
    }
  }

  /**
   * 使用XMLHttpRequest发送数据
   * 兼容性最好的HTTP请求方式，作为最后的fallback选项
   * @param data 需要发送的JSON字符串数据
   */
  private sendXHR(data: string): void {
    // 创建XMLHttpRequest对象
    const xhr = new XMLHttpRequest();
    // 初始化POST请求，异步模式
    xhr.open('POST', this.options.url, true);
    // 设置请求超时时间
    xhr.timeout = this.options.timeout;
    // 设置是否携带身份凭证
    xhr.withCredentials = this.options.withCredentials;
    
    // 设置请求头
    xhr.setRequestHeader('Content-Type', 'application/json');
    // 添加自定义请求头
    Object.entries(this.options.headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    // 错误处理 - 静默处理，避免影响主业务
    xhr.onerror = () => {
      // 静默处理网络错误，避免影响主业务
    };

    // 超时处理 - 静默处理，避免影响主业务
    xhr.ontimeout = () => {
      // 静默处理请求超时，避免影响主业务  
    };

    try {
      // 发送请求数据
      xhr.send(data);
    } catch (error) {
      // 静默处理发送异常，确保不影响主业务逻辑
    }
  }

  /**
   * 销毁传输器
   * 清理所有定时器和事件监听器，发送剩余数据
   */
  public destroy(): void {
    // 标记传输器为已销毁状态
    this.isDestroyed = true;
    
    // 清理定时上报定时器
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
    }

    // 发送所有队列中剩余的数据，避免数据丢失
    this.flushAllQueues();
    
    // 清空重试队列
    this.retryQueue = [];
    
    // 清空定时器缓存
    this.storageManager.clearTimer();
  }

  /**
   * 获取队列状态信息
   * 用于调试和监控
   * @returns 队列状态信息
   */
  public getQueueStatus(): {
    queue: number;
    retry: number;
    pending: number;
  } {
    return {
      queue: this.dataQueue.length,
      retry: this.retryQueue.length,
      pending: this.pendingRequests
    };
  }

  /**
   * 手动触发数据上报
   * 用于特殊情况下的手动上报
   */
  public flush(): void {
    this.processQueuedData();
  }

  /**
   * 获取存储管理器实例（用于调试）
   */
  public getStorageManager(): StorageManager {
    return this.storageManager;
  }

  /**
   * 获取传输器调试信息
   */
  public getDebugInfo(): {
    isDestroyed: boolean;
    queueStatus: ReturnType<Transport['getQueueStatus']>;
    storageInfo: ReturnType<StorageManager['getDebugInfo']>;
    options: Required<TransportOptions>;
  } {
    return {
      isDestroyed: this.isDestroyed,
      queueStatus: this.getQueueStatus(),
      storageInfo: this.storageManager.getDebugInfo(),
      options: { ...this.options }
    };
  }

  /**
   * 打印传输器调试信息到控制台
   */
  public logDebugInfo(): void {
    const debugInfo = this.getDebugInfo();
    
    console.group('🚀 WebMonitorSDK Transport Debug Info');
    
    console.log('📈 传输器状态:');
    console.log(`  • 是否已销毁: ${debugInfo.isDestroyed ? '✅' : '❌'}`);
    console.log(`  • 内存队列: ${debugInfo.queueStatus.queue} 条`);
    console.log(`  • 重试队列: ${debugInfo.queueStatus.retry} 条`);
    console.log(`  • 正在发送: ${debugInfo.queueStatus.pending} 个请求`);
    
    console.log('⚙️ 配置信息:');
    console.log(`  • 上报间隔: ${debugInfo.options.reportInterval / 1000}s`);
    console.log(`  • 批量大小: ${debugInfo.options.batchSize} 条`);
    console.log(`  • 队列上限: ${debugInfo.options.maxQueueSize} 条`);
    console.log(`  • 重试次数: ${debugInfo.options.retryCount} 次`);
    
    console.log('💾 存储状态:');
    console.log(`  • 本地缓存: ${debugInfo.storageInfo.hasData ? '✅' : '❌'}`);
    console.log(`  • 缓存条数: ${debugInfo.storageInfo.dataCount} 条`);
    console.log(`  • 缓存大小: ${(debugInfo.storageInfo.storageSize / 1024).toFixed(2)} KB`);
    
    if (debugInfo.storageInfo.lastReportTime > 0) {
      const lastReportDate = new Date(debugInfo.storageInfo.lastReportTime);
      const timeSinceLastReport = Date.now() - debugInfo.storageInfo.lastReportTime;
      console.log(`  • 上次上报: ${lastReportDate.toLocaleString()} (${Math.round(timeSinceLastReport / 1000)}s前)`);
    }
    
    console.groupEnd();
    
    // 如果有本地缓存数据，提供查看选项
    if (debugInfo.storageInfo.hasData) {
      console.log('💡 提示: 使用 monitor.transport.getStorageManager().logStorageData() 查看详细缓存数据');
    }
  }
}