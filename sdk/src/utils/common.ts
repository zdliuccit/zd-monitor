/**
 * 生成会话ID
 * 使用时间戳和随机字符串组合生成唯一的会话标识符
 * @returns 格式为 "session_{timestamp}_{randomString}" 的会话ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 生成或获取用户ID
 * 优先从localStorage获取已存储的用户ID，不存在则生成新的并存储
 * @returns 用户唯一标识符
 */
export function generateUserId(): string {
  // 尝试从本地存储获取已有的用户ID
  const stored = localStorage.getItem('web_monitor_user_id');
  if (stored) {
    return stored;
  }
  
  // 生成新的用户ID
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  try {
    // 将用户ID存储到本地存储中
    localStorage.setItem('web_monitor_user_id', userId);
  } catch (error) {
    // 静默处理localStorage错误（如存储空间不足、隐私模式等）
  }
  
  return userId;
}

/**
 * 获取DOM元素的CSS选择器路径
 * 从指定元素开始向上遍历DOM树，生成唯一的CSS选择器路径
 * @param element 目标DOM元素
 * @returns CSS选择器字符串，如 "div > .container > button:nth-child(2)"
 */
export function getElementPath(element: Element): string {
  /** 存储路径段的数组 */
  const path: string[] = [];
  /** 当前遍历的元素 */
  let current: Element | null = element;

  // 向上遍历DOM树直到根节点
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    /** 当前元素的选择器 */
    let selector = current.nodeName.toLowerCase();
    
    // 如果元素有ID，使用ID选择器并结束遍历
    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    } else {
      // 计算元素在同级元素中的位置
      let nth = 1;
      let sibling = current.previousElementSibling;
      
      // 统计相同标签名的前面兄弟元素数量
      while (sibling) {
        if (sibling.nodeName.toLowerCase() === selector) {
          nth++;
        }
        sibling = sibling.previousElementSibling;
      }
      
      // 如果不是第一个同类元素，添加nth-child选择器
      if (nth > 1) {
        selector += `:nth-child(${nth})`;
      }
    }
    
    // 将当前选择器添加到路径数组的开头
    path.unshift(selector);
    // 继续遍历父元素
    current = current.parentElement;
  }

  // 使用' > '连接所有路径段
  return path.join(' > ');
}

/**
 * 获取DOM元素的文本内容
 * 根据元素类型提取相应的文本内容，并限制长度
 * @param element 目标DOM元素
 * @returns 元素的文本内容（最大100字符）
 */
export function getElementText(element: Element): string {
  // 对于输入框，优先获取value值，其次是placeholder
  if (element.tagName === 'INPUT') {
    return (element as HTMLInputElement).value || (element as HTMLInputElement).placeholder || '';
  }
  
  // 对于其他元素，获取文本内容并去除空白，限制在100字符内
  return element.textContent?.trim().slice(0, 100) || '';
}

/**
 * 函数节流器
 * 限制函数在指定时间间隔内最多执行一次，防止频繁调用
 * @param func 需要节流的函数
 * @param delay 节流延迟时间（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  /** 定时器ID，用于清理定时器 */
  let timeoutId: number | null = null;
  /** 上次执行的时间戳 */
  let lastExecTime = 0;
  
  return (function(this: any, ...args: any[]) {
    /** 当前时间戳 */
    const currentTime = Date.now();
    const context = this;
    
    // 如果距离上次执行的时间超过了延迟时间，立即执行
    if (currentTime - lastExecTime > delay) {
      func.apply(context, args);
      lastExecTime = currentTime;
    } else {
      // 清理之前的定时器
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // 设置新的定时器，在剩余时间后执行
      timeoutId = window.setTimeout(() => {
        func.apply(context, args);
        lastExecTime = Date.now();
        timeoutId = null;
      }, delay - (currentTime - lastExecTime));
    }
  }) as T;
}

/**
 * 函数防抖器
 * 延迟执行函数，如果在延迟期间再次调用则重新计时
 * @param func 需要防抖的函数
 * @param delay 防抖延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  /** 定时器ID，用于清理定时器 */
  let timeoutId: number | null = null;
  
  return (function(this: any, ...args: any[]) {
    const context = this;
    // 清理之前的定时器（重新计时）
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // 设置新的定时器
    timeoutId = window.setTimeout(() => {
      func.apply(context, args);
      timeoutId = null;
    }, delay);
  }) as T;
}

/**
 * 检测当前环境是否为机器人或爬虫
 * 通过分析User-Agent字符串来判断
 * @returns 如果是机器人或爬虫返回true，否则返回false
 */
export function isBot(): boolean {
  // 检测User-Agent中常见的机器人关键词
  return /bot|crawler|spider|crawling/i.test(navigator.userAgent);
}

/**
 * 获取当前网络连接类型
 * 使用Network Information API获取网络连接信息
 * @returns 网络连接类型字符串（如'4g', 'wifi', 'slow-2g'等）
 */
export function getConnectionType(): string {
  // 获取网络连接对象（兼容不同浏览器前缀）
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  // 返回有效连接类型或普通连接类型，都不存在则返回'unknown'
  return connection ? connection.effectiveType || connection.type || 'unknown' : 'unknown';
}