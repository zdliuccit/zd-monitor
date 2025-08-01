import { ReportData } from '../types';
/**
 * 本地存储管理器
 * 负责将监控数据存储在浏览器本地缓存中
 */
export declare class StorageManager {
    private readonly STORAGE_KEY;
    private readonly TIMER_KEY;
    private readonly MAX_STORAGE_SIZE;
    /**
     * 保存数据到本地存储
     * @param data 要保存的数据数组
     */
    save(data: ReportData[]): boolean;
    /**
     * 从本地存储读取数据
     * @returns 读取的数据数组，失败时返回空数组
     */
    load(): ReportData[];
    /**
     * 清空本地存储
     */
    clear(): void;
    /**
     * 检查localStorage是否可用
     */
    private isLocalStorageAvailable;
    /**
     * 获取存储的数据大小（字节）
     */
    getStorageSize(): number;
    /**
     * 保存上次上报时间
     * @param timestamp 上次上报的时间戳
     */
    saveLastReportTime(timestamp: number): boolean;
    /**
     * 获取上次上报时间
     * @returns 上次上报的时间戳，如果不存在返回0
     */
    getLastReportTime(): number;
    /**
     * 清空定时器存储
     */
    clearTimer(): void;
}
