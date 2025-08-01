import { ReportData, TransportOptions } from '../types';
/**
 * 数据传输管理器
 * 负责将监控数据智能缓存并按优先级和时间间隔发送到后端服务器
 *
 * 特性：
 * - 支持按优先级分类的数据缓存
 * - 可配置的时间间隔批量上报
 * - 高优先级数据立即上报
 * - 队列溢出保护
 * - 失败重试机制
 * - 页面卸载时的数据保护
 */
export declare class Transport {
    /** 高优先级数据队列（立即发送） */
    private highPriorityQueue;
    /** 中优先级数据队列（定时批量发送） */
    private mediumPriorityQueue;
    /** 低优先级数据队列（延迟批量发送） */
    private lowPriorityQueue;
    /** 定时器ID，用于定时批量发送数据 */
    private reportTimer;
    /** 传输配置选项 */
    private options;
    /** 标识传输器是否已被销毁 */
    private isDestroyed;
    /** 当前正在发送的请求数量 */
    private pendingRequests;
    /** 失败重试队列 */
    private retryQueue;
    /** 本地存储管理器 */
    private storageManager;
    /**
     * 构造函数
     * @param options 传输配置选项，包含各种缓存和上报策略配置
     */
    constructor(options: TransportOptions);
    /**
     * 从本地存储加载未上报的数据
     */
    private loadDataFromStorage;
    /**
     * 保存数据到本地存储
     */
    private saveDataToStorage;
    /**
     * 启动定时上报定时器
     * 按配置的时间间隔定期检查并上报缓存的数据
     */
    private startReportTimer;
    /**
     * 启动重试定时器
     * 定期检查并处理失败的重试请求
     */
    private startRetryTimer;
    /**
     * 设置页面关闭前的数据保护
     * 监听页面卸载和可见性变化事件，确保缓存数据不丢失
     */
    private setupBeforeUnload;
    /**
     * 刷新所有队列中的数据
     * 在页面关闭或隐藏时调用，使用sendBeacon确保数据可靠发送
     */
    private flushAllQueues;
    /**
     * 发送数据
     * 根据数据优先级决定是立即发送还是加入相应的缓存队列
     * @param data 需要发送的监控数据
     */
    send(data: ReportData): void;
    /**
     * 处理队列中的数据
     * 按优先级和批量大小处理各个队列中的数据，处理完成后清空本地缓存
     */
    private processQueuedData;
    /**
     * 批量发送数据
     * 按照优先级顺序尝试不同的发送方式
     * @param batch 需要发送的数据批次
     * @param priority 数据优先级
     */
    private sendBatch;
    /**
     * 立即发送数据（高优先级）
     * @param data 需要立即发送的数据
     */
    private sendImmediately;
    /**
     * 尝试使用sendBeacon API发送数据
     * sendBeacon是最可靠的数据发送方式，即使页面关闭也能保证数据送达
     * @param data 需要发送的数据数组
     * @returns 如果发送成功返回Promise<void>，失败或不支持返回null
     */
    private trySendBeacon;
    /**
     * 根据数据类型获取默认优先级
     * @param dataType 数据类型
     * @returns 默认优先级
     */
    private getDefaultPriority;
    /**
     * 将数据添加到相应的优先级队列
     * @param data 要添加的数据
     * @param priority 数据优先级
     */
    private addToQueue;
    /**
     * 检查队列是否溢出，如果溢出则强制上报
     */
    private checkQueueOverflow;
    /**
     * 将失败的数据加入重试队列
     * @param data 失败的数据
     */
    private addToRetryQueue;
    /**
     * 处理重试队列
     */
    private processRetryQueue;
    /**
     * 使用fetch API发送数据
     * 现代浏览器的标准HTTP请求方式，支持Promise和请求取消
     * @param data 需要发送的JSON字符串数据
     * @returns Promise对象，成功时resolve，失败时reject
     */
    private sendFetch;
    /**
     * 使用XMLHttpRequest发送数据
     * 兼容性最好的HTTP请求方式，作为最后的fallback选项
     * @param data 需要发送的JSON字符串数据
     */
    private sendXHR;
    /**
     * 销毁传输器
     * 清理所有定时器和事件监听器，发送剩余数据
     */
    destroy(): void;
    /**
     * 获取队列状态信息
     * 用于调试和监控
     * @returns 队列状态信息
     */
    getQueueStatus(): {
        high: number;
        medium: number;
        low: number;
        retry: number;
        pending: number;
    };
    /**
     * 手动触发数据上报
     * 用于特殊情况下的手动上报
     */
    flush(): void;
}
