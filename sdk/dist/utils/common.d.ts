/**
 * 生成或获取会话ID
 * 优先从localStorage获取已存储的会话ID，不存在则生成新的并存储
 * @returns 会话唯一标识符
 */
export declare function generateSessionId(): string;
/**
 * 生成或获取用户ID
 * 优先从localStorage获取已存储的用户ID，不存在则生成新的并存储
 * @returns 用户唯一标识符
 */
export declare function generateUserId(): string;
/**
 * 获取DOM元素的CSS选择器路径
 * 从指定元素开始向上遍历DOM树，生成唯一的CSS选择器路径
 * @param element 目标DOM元素
 * @returns CSS选择器字符串，如 "div > .container > button:nth-child(2)"
 */
export declare function getElementPath(element: Element): string;
/**
 * 获取DOM元素的文本内容
 * 根据元素类型提取相应的文本内容，并限制长度
 * @param element 目标DOM元素
 * @returns 元素的文本内容（最大100字符）
 */
export declare function getElementText(element: Element): string;
/**
 * 函数节流器
 * 限制函数在指定时间间隔内最多执行一次，防止频繁调用
 * @param func 需要节流的函数
 * @param delay 节流延迟时间（毫秒）
 * @returns 节流后的函数
 */
export declare function throttle<T extends (...args: any[]) => any>(func: T, delay: number): T;
/**
 * 函数防抖器
 * 延迟执行函数，如果在延迟期间再次调用则重新计时
 * @param func 需要防抖的函数
 * @param delay 防抖延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export declare function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T;
/**
 * 检测当前环境是否为机器人或爬虫
 * 通过分析User-Agent字符串来判断
 * @returns 如果是机器人或爬虫返回true，否则返回false
 */
export declare function isBot(): boolean;
/**
 * 获取当前网络连接类型
 * 使用Network Information API获取网络连接信息
 * @returns 网络连接类型字符串（如'4g', 'wifi', 'slow-2g'等）
 */
export declare function getConnectionType(): string;
