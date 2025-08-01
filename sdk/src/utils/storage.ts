import { ReportData } from '../types';

/**
 * 本地存储管理器
 * 负责将监控数据存储在浏览器本地缓存中
 */
export class StorageManager {
  private readonly STORAGE_KEY = 'web_monitor_queue';
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
}