import { Monitor } from '../core/Monitor';
import { ErrorData, ErrorType, DataType } from '../types';
import { getElementPath } from '../utils/common';

/**
 * 错误监控类
 * 负责捕获和监控各种类型的错误，包括JS错误、Promise异常、资源加载错误和API请求错误
 */
export class ErrorMonitor {
  /** 监控器实例，用于上报错误数据 */
  private monitor: Monitor;
  /** 原始的fetch函数引用，用于恢复 */
  private originalFetch: typeof fetch;
  /** 原始的XMLHttpRequest.open方法引用 */
  private originalXHROpen: typeof XMLHttpRequest.prototype.open;
  /** 原始的XMLHttpRequest.send方法引用 */
  private originalXHRSend: typeof XMLHttpRequest.prototype.send;

  /**
   * 构造函数
   * @param monitor 监控器实例
   */
  constructor(monitor: Monitor) {
    this.monitor = monitor;
    // 保存原始方法引用，用于后续恢复
    this.originalFetch = window.fetch;
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;
    // 初始化错误监控
    this.init();
  }

  /**
   * 初始化错误监控
   * 设置各种错误类型的监听器
   */
  private init(): void {
    // 监听JavaScript运行时错误
    this.handleJSError();
    // 监听Promise未处理的异常
    this.handlePromiseError();
    // 监听资源加载错误
    this.handleResourceError();
    // 监听API请求错误
    this.handleAPIError();
  }

  /**
   * 处理JavaScript运行时错误
   * 监听全局error事件，捕获JS执行时发生的错误
   */
  private handleJSError(): void {
    // 监听全局error事件，使用捕获阶段监听以捕获更多错误
    window.addEventListener('error', (event) => {
      // 从错误事件中提取关键信息
      const { message, filename, lineno, colno, error } = event;
      
      // 构建错误数据对象
      const errorData: ErrorData = {
        type: ErrorType.JS_ERROR,
        message: message || 'Unknown error',
        filename: filename,
        lineno: lineno,
        colno: colno,
        stack: error?.stack // 错误堆栈信息
      };

      // 上报错误数据
      this.reportError(errorData);

      // 添加错误面包屑记录，用于问题复现
      this.monitor.addBreadcrumb({
        timestamp: Date.now(),
        type: DataType.ERROR,
        category: 'javascript',
        message: `JS Error: ${message}`,
        level: 'error',
        data: {
          filename,
          lineno,
          colno
        }
      });
    }, true);
  }

  /**
   * 处理Promise未处理的异常
   * 监听unhandledrejection事件，捕获没有被.catch()处理的Promise异常
   */
  private handlePromiseError(): void {
    // 监听Promise拒绝事件
    window.addEventListener('unhandledrejection', (event) => {
      let message = 'Unhandled Promise Rejection';
      let stack = '';

      // 根据不同的reason类型提取错误信息
      if (event.reason) {
        if (event.reason instanceof Error) {
          // Error对象类型
          message = event.reason.message;
          stack = event.reason.stack || '';
        } else if (typeof event.reason === 'string') {
          // 字符串类型
          message = event.reason;
        } else {
          // 其他类型，尝试序列化
          try {
            message = JSON.stringify(event.reason);
          } catch {
            message = String(event.reason);
          }
        }
      }

      // 构建错误数据对象
      const errorData: ErrorData = {
        type: ErrorType.PROMISE_ERROR,
        message,
        stack
      };

      // 上报错误数据
      this.reportError(errorData);

      // 添加Promise错误面包屑记录
      this.monitor.addBreadcrumb({
        timestamp: Date.now(),
        type: DataType.ERROR,
        category: 'promise',
        message: `Promise Error: ${message}`,
        level: 'error',
        data: {
          reason: event.reason
        }
      });
    });
  }

  /**
   * 处理资源加载错误
   * 监听图片、脚本、样式表、音频、视频等资源的加载失败错误
   */
  private handleResourceError(): void {
    // 监听全局error事件，使用捕获阶段监听资源加载错误
    window.addEventListener('error', (event) => {
      const target = event.target as HTMLElement;
      
      // 只处理资源加载错误，排除JS执行错误
      if (target && target !== (window as any) && (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK' || target.tagName === 'AUDIO' || target.tagName === 'VIDEO')) {
        // 构建资源错误数据对象
        const errorData: ErrorData = {
          type: ErrorType.RESOURCE_ERROR,
          message: `Resource load error: ${target.tagName}`,
          resourceUrl: (target as any).src || (target as any).href || '', // 获取资源URL
          elementSelector: getElementPath(target) // 获取元素的CSS选择器路径
        };

        // 上报资源错误数据
        this.reportError(errorData);

        // 添加资源错误面包屑记录
        this.monitor.addBreadcrumb({
          timestamp: Date.now(),
          type: DataType.ERROR,
          category: 'resource',
          message: `Resource Error: ${target.tagName}`,
          level: 'error',
          data: {
            url: errorData.resourceUrl,
            element: target.tagName
          }
        });
      }
    }, true);
  }

  /**
   * 处理API请求错误
   * 拦截fetch和XMLHttpRequest请求，捕获HTTP错误和网络错误
   */
  private handleAPIError(): void {
    // 拦截fetch API调用
    window.fetch = async (...args) => {
      // 提取请求URL
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      const startTime = Date.now();

      try {
        // 执行原始的fetch请求
        const response = await this.originalFetch.apply(window, args);
        
        // 检查HTTP状态码，非2xx状态码视为错误
        if (!response.ok) {
          const errorData: ErrorData = {
            type: ErrorType.API_ERROR,
            message: `API Error: ${response.status} ${response.statusText}`,
            resourceUrl: url,
            statusCode: response.status
          };

          // 上报API错误数据
          this.reportError(errorData);

          // 添加API错误面包屑记录
          this.monitor.addBreadcrumb({
            timestamp: Date.now(),
            type: DataType.ERROR,
            category: 'api',
            message: `API Error: ${url}`,
            level: 'error',
            data: {
              status: response.status,
              statusText: response.statusText,
              duration: Date.now() - startTime
            }
          });
        }

        return response;
      } catch (error) {
        // 处理网络错误或其他异常
        const errorData: ErrorData = {
          type: ErrorType.API_ERROR,
          message: `Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          resourceUrl: url,
          stack: error instanceof Error ? error.stack : undefined
        };

        // 上报网络错误数据
        this.reportError(errorData);

        // 添加网络错误面包屑记录
        this.monitor.addBreadcrumb({
          timestamp: Date.now(),
          type: DataType.ERROR,
          category: 'api',
          message: `Network Error: ${url}`,
          level: 'error',
          data: {
            error: error instanceof Error ? error.message : String(error),
            duration: Date.now() - startTime
          }
        });

        // 重新抛出错误，保持原有的错误处理流程
        throw error;
      }
    };

    // 拦截XMLHttpRequest API调用
    const self = this; // 保存当前实例的引用用于闭包
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async?: boolean, user?: string | null, password?: string | null) {
      // 在xhr实例上存储请求信息
      (this as any)._monitor_url = url.toString();
      (this as any)._monitor_method = method;
      (this as any)._monitor_startTime = Date.now();
      // 调用原始open方法
      return self.originalXHROpen.call(this, method, url, async ?? true, user, password);
    };

    XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
      const xhr = this;
      const url = (xhr as any)._monitor_url;
      const method = (xhr as any)._monitor_method;
      const startTime = (xhr as any)._monitor_startTime;

      // 定义网络错误处理函数
      const onError = () => {
        const errorData: ErrorData = {
          type: ErrorType.API_ERROR,
          message: `XMLHttpRequest Error: ${method} ${url}`,
          resourceUrl: url,
          statusCode: xhr.status
        };

        // 使用闭包保存的self引用上报错误
        self.reportError(errorData);
        
        // 添加面包屑记录
        self.monitor.addBreadcrumb({
          timestamp: Date.now(),
          type: DataType.ERROR,
          category: 'api',
          message: `XHR Error: ${method} ${url}`,
          level: 'error',
          data: {
            method,
            status: xhr.status,
            duration: Date.now() - startTime
          }
        });
      };

      // 定义请求完成处理函数
      const onLoad = () => {
        // 检查HTTP状态码，4xx和5xx视为错误
        if (xhr.status >= 400) {
          const errorData: ErrorData = {
            type: ErrorType.API_ERROR,
            message: `API Error: ${xhr.status} ${xhr.statusText}`,
            resourceUrl: url,
            statusCode: xhr.status
          };

          // 上报API错误
          self.reportError(errorData);
          
          // 添加面包屑记录
          self.monitor.addBreadcrumb({
            timestamp: Date.now(),
            type: DataType.ERROR,
            category: 'api',
            message: `XHR ${xhr.status}: ${method} ${url}`,
            level: 'error',
            data: {
              method,
              status: xhr.status,
              statusText: xhr.statusText,
              duration: Date.now() - startTime
            }
          });
        }
      };

      // 添加事件监听器
      xhr.addEventListener('error', onError);
      xhr.addEventListener('load', onLoad);
      
      // 调用原始send方法
      return self.originalXHRSend.call(this, body);
    };
  }

  /**
   * 上报错误数据
   * 将错误数据包装成标准格式并通过监控器上报
   * @param errorData 错误数据对象
   */
  public reportError(errorData: ErrorData): void {
    // 通过监控器上报错误数据
    this.monitor.report({
      type: DataType.ERROR,
      data: errorData
    });
  }

  /**
   * 上报自定义错误
   * 允许用户手动上报自定义的错误信息
   * @param message 错误消息
   * @param extra 额外的错误信息和上下文数据
   */
  public reportCustomError(message: string, extra?: Record<string, any>): void {
    // 构建自定义错误数据对象
    const errorData: ErrorData = {
      type: ErrorType.CUSTOM_ERROR,
      message,
      stack: new Error().stack, // 生成当前调用栈
      ...extra // 合并额外信息
    };

    // 上报自定义错误
    this.reportError(errorData);

    // 添加自定义错误面包屑记录
    this.monitor.addBreadcrumb({
      timestamp: Date.now(),
      type: DataType.ERROR,
      category: 'custom',
      message: `Custom Error: ${message}`,
      level: 'error',
      data: extra
    });
  }

  /**
   * 销毁错误监控器
   * 恢复被拦截的原始方法，清理所有事件监听器
   */
  public destroy(): void {
    // 恢复原始的fetch方法
    window.fetch = this.originalFetch;
    // 恢复原始的XMLHttpRequest方法
    XMLHttpRequest.prototype.open = this.originalXHROpen;
    XMLHttpRequest.prototype.send = this.originalXHRSend;
    // 注意：实际应用中还应该移除error和unhandledrejection事件监听器
  }
}