import { Monitor } from '../core/Monitor';
import { BehaviorData, BehaviorType, DataType } from '../types';
import { getElementPath, getElementText, throttle, debounce } from '../utils/common';

/**
 * 用户行为监控类
 * 负责收集和监控用户在页面上的各种交互行为，包括点击、输入、滚动、路由变化等
 */
export class BehaviorMonitor {
  /** 监控器实例，用于上报行为数据 */
  private monitor: Monitor;
  /** 当前页面URL，用于跟踪路由变化 */
  private currentUrl: string;
  /** 页面开始时间，用于计算页面停留时间 */
  private startTime: number;

  /**
   * 构造函数
   * @param monitor 监控器实例
   */
  constructor(monitor: Monitor) {
    this.monitor = monitor;
    // 记录当前页面URL
    this.currentUrl = window.location.href;
    // 记录初始化时间
    this.startTime = Date.now();
    // 初始化行为监控
    this.init();
  }

  /**
   * 初始化行为监控
   * 启动所有类型的用户行为跟踪功能
   */
  private init(): void {
    // 记录页面访问
    this.trackPageView();
    // 跟踪点击事件
    this.trackClicks();
    // 跟踪输入事件
    this.trackInputs();
    // 跟踪滚动事件
    this.trackScrolls();
    // 跟踪路由变化
    this.trackRouteChanges();
  }

  /**
   * 跟踪页面访问事件
   * 记录用户访问页面的行为，包括URL和来源页面
   */
  private trackPageView(): void {
    // 构建页面访问行为数据
    const behaviorData: BehaviorData = {
      type: BehaviorType.PAGE_VIEW,
      url: this.currentUrl
    };

    // 上报页面访问行为
    this.reportBehavior(behaviorData);

    // 添加页面访问面包屑记录
    this.monitor.addBreadcrumb({
      timestamp: Date.now(),
      type: DataType.BEHAVIOR,
      category: 'navigation',
      message: `Page view: ${this.currentUrl}`,
      level: 'info',
      data: {
        url: this.currentUrl,
        referrer: document.referrer // 来源页面
      }
    });
  }

  /**
   * 跟踪点击事件
   * 监听用户在页面上的所有点击行为，记录点击目标的元素信息
   */
  private trackClicks(): void {
    // 监听全局点击事件，使用捕获阶段以捕获更多点击
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      // 构建点击行为数据
      const behaviorData: BehaviorData = {
        type: BehaviorType.CLICK,
        element: target.tagName, // 元素标签名
        selector: getElementPath(target), // CSS选择器路径
        text: getElementText(target) // 元素文本内容
      };

      // 上报点击行为数据
      this.reportBehavior(behaviorData);

      // 添加点击行为面包屑记录
      this.monitor.addBreadcrumb({
        timestamp: Date.now(),
        type: DataType.BEHAVIOR,
        category: 'interaction',
        message: `Click: ${target.tagName}`,
        level: 'info',
        data: {
          text: behaviorData.text,
          selector: behaviorData.selector
        }
      });
    }, true);
  }

  /**
   * 跟踪输入事件
   * 监听用户在表单元素中的输入行为，包括文本输入、选择等，注意隐私保护
   */
  private trackInputs(): void {
    // 使用防抖函数避免过于频繁的上报
    const handleInput = debounce((event: Event) => {
      const target = event.target as HTMLInputElement;
      // 过滤无效目标和密码输入框
      if (!target || target.type === 'password') return;

      // 构建输入行为数据
      const behaviorData: BehaviorData = {
        type: BehaviorType.INPUT,
        element: target.tagName,
        selector: getElementPath(target),
        // 限制文本长度并对敏感信息进行脱敏处理
        text: target.type === 'password' ? '***' : target.value.slice(0, 100)
      };

      // 上报输入行为数据
      this.reportBehavior(behaviorData);

      // 添加输入行为面包屑记录
      this.monitor.addBreadcrumb({
        timestamp: Date.now(),  
        type: DataType.BEHAVIOR,
        category: 'interaction',
        message: `Input: ${target.tagName}`,
        level: 'info',
        data: {
          type: target.type, // 输入框类型
          selector: behaviorData.selector
        }
      });
    }, 500); // 500ms防抖延迟

    // 监听input和change事件
    document.addEventListener('input', handleInput, true);
    document.addEventListener('change', handleInput, true);
  }

  /**
   * 跟踪滚动事件
   * 监听用户的页面滚动行为，记录滚动深度以分析用户阅读习惯
   */
  private trackScrolls(): void {
    /** 最大滚动深度，用于记录用户在页面上滚动的最远位置 */
    let maxScrollDepth = 0;

    // 使用节流函数避免过于频繁的滚动事件处理
    const handleScroll = throttle(() => {
      // 获取各种滚动相关的尺寸数据
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // 计算滚动深度百分比
      const scrollDepth = Math.round((scrollTop + windowHeight) / documentHeight * 100);
      
      // 只记录向下滚动的最大深度
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        
        // 只在25%、50%、75%、100%等特定深度节点上报，避免数据过多
        if (scrollDepth >= 25 && scrollDepth % 25 === 0) {
          const behaviorData: BehaviorData = {
            type: BehaviorType.SCROLL,
            text: `${scrollDepth}%` // 滚动深度百分比
          };

          // 上报滚动行为数据
          this.reportBehavior(behaviorData);

          // 添加滚动行为面包屑记录
          this.monitor.addBreadcrumb({
            timestamp: Date.now(),
            type: DataType.BEHAVIOR,
            category: 'interaction',
            message: `Scroll: ${scrollDepth}%`,
            level: 'info',
            data: {
              depth: scrollDepth,
              scrollTop,
              documentHeight
            }
          });
        }
      }
    }, 1000); // 1秒节流延迟

    // 监听滚动事件，使用passive选项提高性能
    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  /**
   * 跟踪路由变化事件
   * 监听单页应用中的路由变化，包括History API、浏览器前进后退和hash变化
   */
  private trackRouteChanges(): void {
    // 保存原始的History API方法引用
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    /**
     * 处理路由变化的通用函数
     * @param from 来源URL
     * @param to 目标URL
     */
    const handleRouteChange = (from: string, to: string) => {
      // 计算在前一个页面的停留时间
      const duration = Date.now() - this.startTime;
      
      // 构建路由变化行为数据
      const behaviorData: BehaviorData = {
        type: BehaviorType.ROUTE_CHANGE,
        from, // 来源页面
        to,   // 目标页面
        duration  // 在来源页面的停留时间
      };

      // 上报路由变化行为数据
      this.reportBehavior(behaviorData);

      // 添加路由变化面包屑记录
      this.monitor.addBreadcrumb({
        timestamp: Date.now(),
        type: DataType.BEHAVIOR,
        category: 'navigation',
        message: `Route change: ${from} -> ${to}`,
        level: 'info',
        data: {
          from,
          to,
          duration
        }
      });

      // 更新当前页面信息
      this.currentUrl = to;
      this.startTime = Date.now();
    };

    // 拦截history.pushState方法
    history.pushState = function(_state, _title, _url) {
      const from = window.location.href;
      // 调用原始方法
      const result = originalPushState.apply(this, arguments as any);
      const to = window.location.href;
      
      // 检查URL是否发生变化
      if (from !== to) {
        handleRouteChange(from, to);
      }
      
      return result;
    };

    // 拦截history.replaceState方法
    history.replaceState = function(_state, _title, _url) {
      const from = window.location.href;
      // 调用原始方法
      const result = originalReplaceState.apply(this, arguments as any);
      const to = window.location.href;
      
      // 检查URL是否发生变化
      if (from !== to) {
        handleRouteChange(from, to);
      }
      
      return result;
    };

    // 监听浏览器前进后退操作（popstate事件）
    window.addEventListener('popstate', () => {
      const to = window.location.href;
      handleRouteChange(this.currentUrl, to);
    });

    // 监听hash变化事件（用于hash路由）
    window.addEventListener('hashchange', () => {
      const to = window.location.href;
      handleRouteChange(this.currentUrl, to);
    });
  }

  /**
   * 上报自定义行为数据
   * 允许用户手动上报自定义的用户行为数据
   * @param type 行为类型
   * @param data 行为数据的部分字段
   */
  public reportCustomBehavior(type: string, data: Partial<BehaviorData>): void {
    // 构建完整的行为数据对象
    const behaviorData: BehaviorData = {
      type: type as BehaviorType,
      ...data // 合并用户提供的数据
    };

    // 上报自定义行为数据
    this.reportBehavior(behaviorData);

    // 添加自定义行为面包屑记录
    this.monitor.addBreadcrumb({
      timestamp: Date.now(),
      type: DataType.BEHAVIOR,
      category: 'custom',
      message: `Custom behavior: ${type}`,
      level: 'info',
      data
    });
  }

  /**
   * 上报行为数据
   * 将行为数据包装成标准格式并通过监控器上报
   * @param data 行为数据对象
   */
  private reportBehavior(data: BehaviorData): void {
    // 通过监控器上报行为数据
    this.monitor.report({
      type: DataType.BEHAVIOR,
      data
    });
  }

  /**
   * 销毁行为监控器
   * 清理所有事件监听器和恢复被修改的原生方法
   */
  public destroy(): void {
    // 清理事件监听器等资源
    // 注意：实际实现中需要：
    // 1. 保存对事件监听器的引用以便清理
    // 2. 恢复被修改的history.pushState和replaceState方法
    // 3. 移除所有添加的事件监听器
  }
}