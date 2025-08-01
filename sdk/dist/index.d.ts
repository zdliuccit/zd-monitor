import { MonitorConfig, ReportData, Plugin } from './types';
import { VuePlugin } from './plugins/vue';
import { ReactPlugin } from './plugins/react';
/**
 * Web监控SDK主类
 * 前端性能监控、错误监控和用户行为分析的统一入口
 * 提供完整的数据收集、处理和上报功能
 */
export declare class WebMonitorSDK {
    /** 核心监控器实例，负责配置管理和数据上报 */
    private monitor;
    /** 性能监控模块实例 */
    private performanceMonitor?;
    /** 错误监控模块实例 */
    private errorMonitor?;
    /** 用户行为监控模块实例 */
    private behaviorMonitor?;
    /** SDK是否已初始化的标志 */
    private isInitialized;
    /**
     * 构造函数
     * 创建SDK实例并根据配置启动相应的监控模块
     * @param config 监控配置对象
     */
    constructor(config: MonitorConfig);
    /**
     * 初始化SDK
     * 根据配置启动相应的监控模块，确保只初始化一次
     */
    private init;
    /**
     * 手动上报自定义错误
     * 允许开发者主动上报业务逻辑中发现的异常情况
     * @param message 错误消息
     * @param extra 额外的错误信息和上下文数据
     */
    reportError(message: string, extra?: Record<string, any>): void;
    /**
     * 手动上报自定义用户行为
     * 允许开发者记录特定的业务行为和用户操作
     * @param type 行为类型标识
     * @param data 行为相关的数据
     */
    reportBehavior(type: string, data: Record<string, any>): void;
    /**
     * 手动上报任意监控数据
     * 通用的数据上报接口，支持上报任何类型的监控数据
     * @param data 要上报的数据，不需要包含公共字段（会自动添加）
     */
    report(data: Omit<ReportData, 'appId' | 'timestamp' | 'sessionId' | 'url' | 'userAgent' | 'breadcrumbs'>): void;
    /**
     * 安装插件
     * 使用插件来扩展SDK的功能，支持链式调用
     * @param plugin 插件实例
     * @returns SDK实例，支持链式调用
     */
    use(plugin: Plugin): WebMonitorSDK;
    /**
     * 卸载插件
     * 移除指定名称的插件，支持链式调用
     * @param pluginName 插件名称
     * @returns SDK实例，支持链式调用
     */
    unuse(pluginName: string): WebMonitorSDK;
    /**
     * 设置用户信息
     * 关联特定用户的监控数据，便于问题定位和用户行为分析
     * @param userId 用户唯一标识符
     * @param userInfo 用户的额外信息（如姓名、邮箱等）
     */
    setUser(userId: string, userInfo?: Record<string, any>): void;
    /**
     * 设置标签
     * 为监控数据添加标签，便于分类和筛选
     * @param key 标签键
     * @param value 标签值
     */
    setTag(key: string, value: string): void;
    /**
     * 设置上下文信息
     * 为监控数据添加上下文信息，提供更丰富的环境数据
     * @param key 上下文键
     * @param value 上下文值
     */
    setContext(key: string, value: any): void;
    /**
     * 销毁SDK实例
     * 清理所有监控模块和资源，移除事件监听器，释放内存
     */
    destroy(): void;
    /**
     * 获取当前的SDK配置
     * @returns 配置对象，包含所有配置项
     */
    getConfig(): any;
    /**
     * 获取当前会话ID
     * 会话ID用于关联同一次访问中的所有事件
     * @returns 当前会话的唯一标识符
     */
    getSessionId(): string;
    /**
     * 获取当前用户ID
     * @returns 当前用户的唯一标识符
     */
    getUserId(): string;
}
/**
 * 创建WebMonitorSDK实例的工厂函数
 * 提供一种更函数式的创建方式
 * @param config 监控配置对象
 * @returns WebMonitorSDK实例
 */
export declare function createWebMonitorSDK(config: MonitorConfig): WebMonitorSDK;
export { VuePlugin, ReactPlugin };
export * from './types';
export default WebMonitorSDK;
