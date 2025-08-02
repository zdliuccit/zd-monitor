import { ReportData } from '../types';

/**
 * 本地存储管理器
 * 负责将监控数据存储在浏览器本地缓存中
 */
export class StorageManager {
  private readonly STORAGE_KEY = 'web_monitor_queue';
  private readonly TIMER_KEY = 'web_monitor_timer';
  private readonly MAX_STORAGE_SIZE = 1024 * 1024; // 1MB限制

  /**
   * 保存数据到本地存储
   * @param data 要保存的数据数组
   */
  public save(data: ReportData[]): boolean {
    if (!this.isLocalStorageAvailable()) {
      return false;
    }

    try {
      const jsonData = JSON.stringify(data);
      
      // 检查数据大小
      if (jsonData.length > this.MAX_STORAGE_SIZE) {
        console.warn('WebMonitorSDK: Data too large for localStorage');
        return false;
      }

      localStorage.setItem(this.STORAGE_KEY, jsonData);
      return true;
    } catch (error) {
      console.warn('WebMonitorSDK: Failed to save to localStorage:', error);
      return false;
    }
  }

  /**
   * 从本地存储读取数据
   * @returns 读取的数据数组，失败时返回空数组
   */
  public load(): ReportData[] {
    if (!this.isLocalStorageAvailable()) {
      return [];
    }

    try {
      const jsonData = localStorage.getItem(this.STORAGE_KEY);
      if (!jsonData) {
        return [];
      }

      const data = JSON.parse(jsonData);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('WebMonitorSDK: Failed to load from localStorage:', error);
      this.clear(); // 清除损坏的数据
      return [];
    }
  }

  /**
   * 清空本地存储
   */
  public clear(): void {
    if (this.isLocalStorageAvailable()) {
      try {
        localStorage.removeItem(this.STORAGE_KEY);
      } catch (error) {
        console.warn('WebMonitorSDK: Failed to clear localStorage:', error);
      }
    }
  }

  /**
   * 检查localStorage是否可用
   */
  private isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取存储的数据大小（字节）
   */
  public getStorageSize(): number {
    if (!this.isLocalStorageAvailable()) {
      return 0;
    }

    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? data.length : 0;
    } catch {
      return 0;
    }
  }

  /**
   * 保存上次上报时间
   * @param timestamp 上次上报的时间戳
   */
  public saveLastReportTime(timestamp: number): boolean {
    if (!this.isLocalStorageAvailable()) {
      return false;
    }

    try {
      localStorage.setItem(this.TIMER_KEY, timestamp.toString());
      return true;
    } catch (error) {
      console.warn('WebMonitorSDK: Failed to save timer to localStorage:', error);
      return false;
    }
  }

  /**
   * 获取上次上报时间
   * @returns 上次上报的时间戳，如果不存在返回0
   */
  public getLastReportTime(): number {
    if (!this.isLocalStorageAvailable()) {
      return 0;
    }

    try {
      const timestamp = localStorage.getItem(this.TIMER_KEY);
      return timestamp ? parseInt(timestamp, 10) : 0;
    } catch (error) {
      console.warn('WebMonitorSDK: Failed to load timer from localStorage:', error);
      return 0;
    }
  }

  /**
   * 清空定时器存储
   */
  public clearTimer(): void {
    if (this.isLocalStorageAvailable()) {
      try {
        localStorage.removeItem(this.TIMER_KEY);
      } catch (error) {
        console.warn('WebMonitorSDK: Failed to clear timer from localStorage:', error);
      }
    }
  }

  /**
   * 获取存储的原始JSON数据（用于调试）
   * @returns 存储的原始JSON字符串
   */
  public getRawData(): string | null {
    if (!this.isLocalStorageAvailable()) {
      return null;
    }

    try {
      return localStorage.getItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('WebMonitorSDK: Failed to get raw data from localStorage:', error);
      return null;
    }
  }

  /**
   * 获取可读格式的存储数据（用于调试）
   * @returns 格式化后的数据信息
   */
  public getDebugInfo(): {
    hasData: boolean;
    dataCount: number;
    storageSize: number;
    lastReportTime: number;
    data: ReportData[] | null;
  } {
    const data = this.load();
    const rawData = this.getRawData();
    
    return {
      hasData: data.length > 0,
      dataCount: data.length,
      storageSize: rawData ? rawData.length : 0,
      lastReportTime: this.getLastReportTime(),
      data: data.length > 0 ? data : null
    };
  }

  /**
   * 打印存储数据到控制台（用于调试）
   */
  public logStorageData(): void {
    const debugInfo = this.getDebugInfo();
    
    console.group('📦 WebMonitorSDK Storage Debug Info');
    console.log('📊 数据统计:');
    console.log(`  • 是否有数据: ${debugInfo.hasData ? '✅' : '❌'}`);
    console.log(`  • 数据条数: ${debugInfo.dataCount}`);
    console.log(`  • 存储大小: ${(debugInfo.storageSize / 1024).toFixed(2)} KB`);
    
    if (debugInfo.lastReportTime > 0) {
      const lastReportDate = new Date(debugInfo.lastReportTime);
      console.log(`  • 上次上报: ${lastReportDate.toLocaleString()}`);
    } else {
      console.log('  • 上次上报: 暂无记录');
    }
    
    if (debugInfo.data && debugInfo.data.length > 0) {
      console.log('📋 存储的数据:');
      debugInfo.data.forEach((item, index) => {
        console.log(`  ${index + 1}. [${item.type}] ${new Date(item.timestamp).toLocaleString()}`);
        console.log('     ', item);
      });
    }
    
    console.groupEnd();
  }
}