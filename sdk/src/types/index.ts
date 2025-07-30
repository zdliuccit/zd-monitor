/**
 * SDK监控配置接口
 * 定义SDK初始化时的所有配置选项
 */
export interface MonitorConfig {
  /** 应用唯一标识符，用于区分不同应用的数据 */
  appId: string;
  /** 数据上报的后端接口地址 */
  reportUrl: string;
  /** 数据采样率，范围0-1，默认1表示100%采样 */
  sampling?: number;
  /** 是否开启调试模式，会在控制台输出详细日志 */
  debug?: boolean;
  /** 是否启用性能监控功能 */
  enablePerformance?: boolean;
  /** 是否启用错误监控功能 */
  enableError?: boolean;
  /** 是否启用用户行为监控功能 */
  enableBehavior?: boolean;
  /** 面包屑记录的最大数量，超过后会删除最早的记录 */
  maxBreadcrumbsNum?: number;
  /** 数据发送前的钩子函数，可对数据进行过滤或修改，返回null则不发送 */
  beforeSend?: (data: ReportData) => ReportData | null;
  /** 数据上报的时间间隔（毫秒），默认10秒 */
  reportInterval?: number;
  /** 批量上报的数据条数，默认10条 */
  batchSize?: number;
  /** 队列最大长度，超过时强制上报，默认100条 */
  maxQueueSize?: number;
  /** 是否启用立即上报模式（紧急数据如错误立即发送），默认true */
  enableImmediateReport?: boolean;
}

/**
 * 上报数据的统一格式接口
 * 所有监控数据都会按照此格式进行上报
 */
export interface ReportData {
  /** 应用ID，标识数据来源 */
  appId: string;
  /** 数据产生的时间戳（毫秒） */
  timestamp: number;
  /** 数据类型：性能、错误或行为 */
  type: DataType;
  /** 具体的监控数据内容，根据type不同而不同 */
  data: PerformanceData | ErrorData | BehaviorData;
  /** 面包屑记录数组，用于复现问题的上下文 */
  breadcrumbs?: Breadcrumb[];
  /** 会话ID，用于关联同一会话的多个事件 */
  sessionId: string;
  /** 用户ID，可选，用于关联特定用户 */
  userId?: string;
  /** 事件发生时的页面URL */
  url: string;
  /** 用户代理字符串，包含浏览器和设备信息 */
  userAgent: string;
  /** 数据上报优先级，用于决定上报策略 */
  priority?: ReportPriority;
}

/**
 * 监控数据类型枚举
 * 定义SDK可以监控的三种主要数据类型
 */
export enum DataType {
  /** 性能监控数据（LCP、INP、CLS等） */
  PERFORMANCE = 'performance',
  /** 错误监控数据（JS错误、Promise异常等） */
  ERROR = 'error',
  /** 用户行为数据（点击、输入、滚动等） */
  BEHAVIOR = 'behavior'
}

/**
 * 性能监控数据接口
 * 包含各种性能指标的详细信息
 */
export interface PerformanceData {
  /** 性能指标类型（LCP、INP、CLS等） */
  type: PerformanceType;
  /** 性能指标名称 */
  name: string;
  /** 性能指标的数值 */
  value: number;
  /** 性能评级：好、需要改进、差 */
  rating?: 'good' | 'needs-improvement' | 'poor';
  /** 与上次测量的差值 */
  delta?: number;
  /** 原始的性能条目数据 */
  entries?: PerformanceEntry[];
  /** 导航类型（navigate、reload、back_forward等） */
  navigationType?: string;
}

/**
 * 性能指标类型枚举
 * 定义所有支持的性能监控指标
 */
export enum PerformanceType {
  /** 最大内容绘制时间 - 衡量加载性能 */
  LCP = 'LCP',
  /** 交互到下次绘制的延迟 - 衡量交互性能 */
  INP = 'INP', 
  /** 累积布局偏移 - 衡量视觉稳定性 */
  CLS = 'CLS',
  /** 首次内容绘制时间 */
  FCP = 'FCP',
  /** 首次输入延迟 */
  FID = 'FID',
  /** 首字节时间 */
  TTFB = 'TTFB',
  /** 导航时间统计 */
  NAVIGATION = 'navigation',
  /** 资源加载时间 */
  RESOURCE = 'resource',
  /** API请求时间 */
  API = 'api'
}

/**
 * 错误监控数据接口
 * 包含各种错误类型的详细信息
 */
export interface ErrorData {
  /** 错误类型（JS错误、Promise异常等） */
  type: ErrorType;
  /** 错误消息 */
  message: string;
  /** 错误堆栈信息 */
  stack?: string;
  /** 发生错误的文件名 */
  filename?: string;
  /** 错误发生的行号 */
  lineno?: number;
  /** 错误发生的列号 */
  colno?: number;
  /** 错误来源描述 */
  source?: string;
  /** 发生错误的DOM元素选择器 */
  elementSelector?: string;
  /** 资源加载错误的URL */
  resourceUrl?: string;
  /** HTTP状态码（用于API错误） */
  statusCode?: number;
}

/**
 * 错误类型枚举
 * 定义SDK可以捕获的所有错误类型
 */
export enum ErrorType {
  /** JavaScript运行时错误 */
  JS_ERROR = 'js_error',
  /** Promise未处理的异常 */
  PROMISE_ERROR = 'promise_error', 
  /** 资源加载失败错误 */
  RESOURCE_ERROR = 'resource_error',
  /** API请求错误 */
  API_ERROR = 'api_error',
  /** 用户自定义错误 */
  CUSTOM_ERROR = 'custom_error'
}

/**
 * 用户行为数据接口
 * 记录用户在页面上的各种交互行为
 */
export interface BehaviorData {
  /** 行为类型（点击、输入、滚动等） */
  type: BehaviorType;
  /** 交互元素的标签名 */
  element?: string;
  /** DOM元素的CSS选择器 */
  selector?: string;
  /** 元素的文本内容 */
  text?: string;
  /** 相关的URL地址 */
  url?: string;
  /** 路由跳转的来源地址 */
  from?: string;
  /** 路由跳转的目标地址 */
  to?: string;
  /** 行为持续时间（毫秒） */
  duration?: number;
}

/**
 * 用户行为类型枚举
 * 定义所有可监控的用户交互行为
 */
export enum BehaviorType {
  /** 点击事件 */
  CLICK = 'click',
  /** 输入事件 */
  INPUT = 'input',
  /** 滚动事件 */
  SCROLL = 'scroll',
  /** 路由变化事件 */
  ROUTE_CHANGE = 'route_change',
  /** 页面访问事件 */
  PAGE_VIEW = 'page_view'
}

/**
 * 数据上报优先级枚举
 * 定义不同类型数据的上报优先级
 */
export enum ReportPriority {
  /** 低优先级 - 可以批量延迟上报（如用户行为数据） */
  LOW = 'low',
  /** 中优先级 - 定时批量上报（如性能数据） */
  MEDIUM = 'medium',
  /** 高优先级 - 立即上报（如错误数据） */
  HIGH = 'high'
}

/**
 * 面包屑记录接口
 * 用于记录事件发生前的上下文信息，帮助复现问题
 */
export interface Breadcrumb {
  /** 事件发生的时间戳（毫秒） */
  timestamp: number;
  /** 事件类型（性能、错误、行为） */
  type: DataType;
  /** 事件分类（更细化的分类） */
  category: string;
  /** 事件描述信息 */
  message: string;
  /** 事件级别 */
  level: 'info' | 'warning' | 'error';
  /** 附加的事件数据 */
  data?: any;
}

/**
 * 插件接口
 * 定义SDK插件的标准结构，用于扩展SDK功能
 */
export interface Plugin {
  /** 插件名称，必须唯一 */
  name: string;
  /** 插件安装方法，在使用use()时调用 */
  install(monitor: any): void;
  /** 插件卸载方法，在使用unuse()时调用（可选） */
  uninstall?(monitor: any): void;
}

/**
 * 数据传输配置接口
 * 定义数据上报时的网络请求参数和缓存策略
 */
export interface TransportOptions {
  /** 数据上报的目标URL */
  url: string;
  /** 请求超时时间（毫秒），默认5秒 */
  timeout?: number;
  /** 是否携带身份凭证（Cookie等），默认false */
  withCredentials?: boolean;
  /** 自定义HTTP请求头 */
  headers?: Record<string, string>;
  /** 数据上报的时间间隔（毫秒），默认10秒 */
  reportInterval?: number;
  /** 批量上报的数据条数，默认10条 */
  batchSize?: number;
  /** 队列最大长度，超过时强制上报，默认100条 */
  maxQueueSize?: number;
  /** 是否启用立即上报模式（紧急数据如错误立即发送），默认true */
  enableImmediateReport?: boolean;
  /** 失败重试次数，默认3次 */
  retryCount?: number;
  /** 重试间隔（毫秒），默认1秒 */
  retryInterval?: number;
}