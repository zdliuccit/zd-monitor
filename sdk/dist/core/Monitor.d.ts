import { MonitorConfig, ReportData, Breadcrumb, Plugin } from '../types';
import { Transport } from './Transport';
/**
 * 监控器核心类
 * 负责管理整个SDK的配置、数据收集、插件管理和数据上报
 */
export declare class Monitor {
    /** 合并后的完整配置对象 */
    private config;
    /** 数据传输管理器 */
    private _transport;
    /** 面包屑记录数组，用于记录用户操作轨迹 */
    private breadcrumbs;
    /** 插件映射表，用于管理已安装的插件 */
    private plugins;
    /** 当前会话的唯一标识符 */
    private sessionId;
    /** 标识监控器是否已被销毁 */
    private isDestroyed;
    /**
     * 监控器构造函数
     * @param config 监控配置对象
     */
    constructor(config: MonitorConfig);
    /**
     * 合并用户配置和默认配置
     * 为所有可选配置项提供合理的默认值
     * @param config 用户提供的配置对象
     * @returns 合并后的完整配置对象
     */
    private mergeConfig;
    /**
     * 初始化监控器
     * 根据采样率决定是否启动监控功能
     */
    private init;
    /**
     * 检查当前请求是否应该被采样
     * 使用随机数和采样率进行比较
     * @returns 如果应该采样返回true，否则返回false
     */
    private shouldSample;
    /**
     * 设置全局错误处理
     * 监听全局错误事件并确保SDK本身的错误不会影响宿主应用
     */
    private setupErrorHandling;
    /**
     * 安全执行函数
     * 在try-catch块中执行函数，确保SDK内部错误不会影响宿主应用
     * @param fn 需要安全执行的函数
     */
    private safeExecute;
    /**
     * 添加面包屑记录
     * 在面包屑数组中添加新的记录，如果超过最大数量则删除最早的记录
     * @param breadcrumb 需要添加的面包屑记录
     */
    addBreadcrumb(breadcrumb: Breadcrumb): void;
    /**
     * 上报监控数据
     * 将监控数据包装成标准格式并发送到后端
     * @param data 需要上报的数据（不包含公共字段）
     */
    report(data: Omit<ReportData, 'appId' | 'timestamp' | 'sessionId' | 'url' | 'userAgent' | 'connectionType' | 'breadcrumbs'>): void;
    /**
     * 安装插件
     * 向SDK中添加一个新的插件，并调用其安装方法
     * @param plugin 需要安装的插件对象
     */
    use(plugin: Plugin): void;
    /**
     * 卸载插件
     * 从 SDK 中移除指定的插件，并调用其卸载方法
     * @param pluginName 需要卸载的插件名称
     */
    unuse(pluginName: string): void;
    /**
     * 销毁监控器
     * 清理所有资源，卸载所有插件，停止所有监控功能
     */
    destroy(): void;
    /**
     * 获取是否开启调试模式
     * @returns 调试模式状态
     */
    get isDebug(): boolean;
    /**
     * 获取应用ID
     * @returns 当前应用的唯一标识符
     */
    get appId(): string;
    /**
     * 获取当前会话ID
     * @returns 当前会话的唯一标识符
     */
    get currentSessionId(): string;
    /**
     * 获取传输器实例（用于调试）
     */
    get transport(): Transport;
    /**
     * 获取监控器调试信息
     */
    getDebugInfo(): {
        config: Required<MonitorConfig>;
        sessionId: string;
        breadcrumbsCount: number;
        pluginCount: number;
        isDestroyed: boolean;
        transportInfo: ReturnType<Transport['getDebugInfo']>;
    };
    /**
     * 打印监控器调试信息到控制台
     */
    logDebugInfo(): void;
}
