import { Monitor } from '../core/Monitor';
import { ErrorData } from '../types';
/**
 * 错误监控类
 * 负责捕获和监控各种类型的错误，包括JS错误、Promise异常、资源加载错误和API请求错误
 */
export declare class ErrorMonitor {
    /** 监控器实例，用于上报错误数据 */
    private monitor;
    /** 原始的fetch函数引用，用于恢复 */
    private originalFetch;
    /** 原始的XMLHttpRequest.open方法引用 */
    private originalXHROpen;
    /** 原始的XMLHttpRequest.send方法引用 */
    private originalXHRSend;
    /**
     * 构造函数
     * @param monitor 监控器实例
     */
    constructor(monitor: Monitor);
    /**
     * 初始化错误监控
     * 设置各种错误类型的监听器
     */
    private init;
    /**
     * 处理JavaScript运行时错误
     * 监听全局error事件，捕获JS执行时发生的错误
     */
    private handleJSError;
    /**
     * 处理Promise未处理的异常
     * 监听unhandledrejection事件，捕获没有被.catch()处理的Promise异常
     */
    private handlePromiseError;
    /**
     * 处理资源加载错误
     * 监听图片、脚本、样式表、音频、视频等资源的加载失败错误
     */
    private handleResourceError;
    /**
     * 处理API请求错误
     * 拦截fetch和XMLHttpRequest请求，捕获HTTP错误和网络错误
     */
    private handleAPIError;
    /**
     * 上报错误数据
     * 将错误数据包装成标准格式并通过监控器上报
     * @param errorData 错误数据对象
     */
    reportError(errorData: ErrorData): void;
    /**
     * 上报自定义错误
     * 允许用户手动上报自定义的错误信息
     * @param message 错误消息
     * @param extra 额外的错误信息和上下文数据
     */
    reportCustomError(message: string, extra?: Record<string, any>): void;
    /**
     * 销毁错误监控器
     * 恢复被拦截的原始方法，清理所有事件监听器
     */
    destroy(): void;
}
