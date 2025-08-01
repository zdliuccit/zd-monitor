import { Monitor } from '../core/Monitor';
/**
 * 性能监控类
 * 负责收集和监控各种性能指标，包括Core Web Vitals、导航时间、资源加载时间和API请求时间
 */
export declare class PerformanceMonitor {
    /** 监控器实例，用于上报性能数据 */
    private monitor;
    /** 性能观察器，用于监听资源加载事件 */
    private observer;
    /**
     * 构造函数
     * @param monitor 监控器实例
     */
    constructor(monitor: Monitor);
    /**
     * 初始化性能监控
     * 启动所有性能数据收集功能
     */
    private init;
    /**
     * 收集Core Web Vitals指标
     * 使用web-vitals库收集LCP、FID、CLS、FCP、TTFB等关键性能指标
     */
    private collectWebVitals;
    /**
     * 收集页面导航时间
     * 分析页面加载各个阶段的耗时，包括DNS查询、TCP连接、SSL握手、请求响应等
     */
    private collectNavigationTiming;
    /**
     * 收集资源加载时间
     * 监控页面中所有资源（图片、脚本、样式表等）的加载性能
     */
    private collectResourceTiming;
    /**
     * 收集API请求时间
     * 拦截fetch和XMLHttpRequest请求，统计API调用的性能数据
     */
    private collectAPITiming;
    /**
     * 获取首次绘制时间
     * @returns 首次绘制的时间戳，无法获取时返回0
     */
    private getFirstPaint;
    /**
     * 获取首次内容绘制时间
     * @returns 首次内容绘制的时间戳，无法获取时返回0
     */
    private getFirstContentfulPaint;
    /**
     * 获取导航类型字符串
     * @param type 导航类型数字
     * @returns 导航类型的字符串描述
     */
    private getNavigationType;
    /**
     * 上报性能指标数据
     * 将性能数据包装成标准格式并上报给监控器
     * @param data 性能指标数据
     */
    private reportMetric;
    /**
     * 销毁性能监控器
     * 清理所有观察器和事件监听器
     */
    destroy(): void;
}
