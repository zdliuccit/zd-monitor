import { Monitor } from '../core/Monitor';
import { BehaviorData } from '../types';
/**
 * 用户行为监控类
 * 负责收集和监控用户在页面上的各种交互行为，包括点击、输入、滚动、路由变化等
 */
export declare class BehaviorMonitor {
    /** 监控器实例，用于上报行为数据 */
    private monitor;
    /** 当前页面URL，用于跟踪路由变化 */
    private currentUrl;
    /** 页面开始时间，用于计算页面停留时间 */
    private startTime;
    /**
     * 构造函数
     * @param monitor 监控器实例
     */
    constructor(monitor: Monitor);
    /**
     * 初始化行为监控
     * 启动所有类型的用户行为跟踪功能
     */
    private init;
    /**
     * 跟踪页面访问事件
     * 记录用户访问页面的行为，包括URL和来源页面
     */
    private trackPageView;
    /**
     * 跟踪点击事件
     * 监听用户在页面上的所有点击行为，记录点击目标的元素信息
     */
    private trackClicks;
    /**
     * 跟踪输入事件
     * 监听用户在表单元素中的输入行为，包括文本输入、选择等，注意隐私保护
     */
    private trackInputs;
    /**
     * 跟踪滚动事件
     * 监听用户的页面滚动行为，记录滚动深度以分析用户阅读习惯
     */
    private trackScrolls;
    /**
     * 跟踪路由变化事件
     * 监听单页应用中的路由变化，包括History API、浏览器前进后退和hash变化
     */
    private trackRouteChanges;
    /**
     * 上报自定义行为数据
     * 允许用户手动上报自定义的用户行为数据
     * @param type 行为类型
     * @param data 行为数据的部分字段
     */
    reportCustomBehavior(type: string, data: Partial<BehaviorData>): void;
    /**
     * 上报行为数据
     * 将行为数据包装成标准格式并通过监控器上报
     * @param data 行为数据对象
     */
    private reportBehavior;
    /**
     * 销毁行为监控器
     * 清理所有事件监听器和恢复被修改的原生方法
     */
    destroy(): void;
}
