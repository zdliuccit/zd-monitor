(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.WebMonitorSDK = {}));
})(this, (function (exports) { 'use strict';

    /**
     * 监控数据类型枚举
     * 定义SDK可以监控的三种主要数据类型
     */
    exports.DataType = void 0;
    (function (DataType) {
        /** 性能监控数据（LCP、INP、CLS等） */
        DataType["PERFORMANCE"] = "performance";
        /** 错误监控数据（JS错误、Promise异常等） */
        DataType["ERROR"] = "error";
        /** 用户行为数据（点击、输入、滚动等） */
        DataType["BEHAVIOR"] = "behavior";
    })(exports.DataType || (exports.DataType = {}));
    /**
     * 性能指标类型枚举
     * 定义所有支持的性能监控指标
     */
    exports.PerformanceType = void 0;
    (function (PerformanceType) {
        /** 最大内容绘制时间 - 衡量加载性能 */
        PerformanceType["LCP"] = "LCP";
        /** 交互到下次绘制的延迟 - 衡量交互性能 */
        PerformanceType["INP"] = "INP";
        /** 累积布局偏移 - 衡量视觉稳定性 */
        PerformanceType["CLS"] = "CLS";
        /** 首次内容绘制时间 */
        PerformanceType["FCP"] = "FCP";
        /** 首次输入延迟 */
        PerformanceType["FID"] = "FID";
        /** 首字节时间 */
        PerformanceType["TTFB"] = "TTFB";
        /** 导航时间统计 */
        PerformanceType["NAVIGATION"] = "navigation";
        /** 资源加载时间 */
        PerformanceType["RESOURCE"] = "resource";
        /** API请求时间 */
        PerformanceType["API"] = "api";
    })(exports.PerformanceType || (exports.PerformanceType = {}));
    /**
     * 错误类型枚举
     * 定义SDK可以捕获的所有错误类型
     */
    exports.ErrorType = void 0;
    (function (ErrorType) {
        /** JavaScript运行时错误 */
        ErrorType["JS_ERROR"] = "js_error";
        /** Promise未处理的异常 */
        ErrorType["PROMISE_ERROR"] = "promise_error";
        /** 资源加载失败错误 */
        ErrorType["RESOURCE_ERROR"] = "resource_error";
        /** API请求错误 */
        ErrorType["API_ERROR"] = "api_error";
        /** 用户自定义错误 */
        ErrorType["CUSTOM_ERROR"] = "custom_error";
    })(exports.ErrorType || (exports.ErrorType = {}));
    /**
     * 用户行为类型枚举
     * 定义所有可监控的用户交互行为
     */
    exports.BehaviorType = void 0;
    (function (BehaviorType) {
        /** 点击事件 */
        BehaviorType["CLICK"] = "click";
        /** 输入事件 */
        BehaviorType["INPUT"] = "input";
        /** 滚动事件 */
        BehaviorType["SCROLL"] = "scroll";
        /** 路由变化事件 */
        BehaviorType["ROUTE_CHANGE"] = "route_change";
        /** 页面访问事件 */
        BehaviorType["PAGE_VIEW"] = "page_view";
    })(exports.BehaviorType || (exports.BehaviorType = {}));
    /**
     * 数据上报优先级枚举
     * 定义不同类型数据的上报优先级
     */
    exports.ReportPriority = void 0;
    (function (ReportPriority) {
        /** 低优先级 - 可以批量延迟上报（如用户行为数据） */
        ReportPriority["LOW"] = "low";
        /** 中优先级 - 定时批量上报（如性能数据） */
        ReportPriority["MEDIUM"] = "medium";
        /** 高优先级 - 立即上报（如错误数据） */
        ReportPriority["HIGH"] = "high";
    })(exports.ReportPriority || (exports.ReportPriority = {}));

    /**
     * 数据传输管理器
     * 负责将监控数据智能缓存并按优先级和时间间隔发送到后端服务器
     *
     * 特性：
     * - 支持按优先级分类的数据缓存
     * - 可配置的时间间隔批量上报
     * - 高优先级数据立即上报
     * - 队列溢出保护
     * - 失败重试机制
     * - 页面卸载时的数据保护
     */
    class Transport {
        /**
         * 构造函数
         * @param options 传输配置选项，包含各种缓存和上报策略配置
         */
        constructor(options) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            /** 高优先级数据队列（立即发送） */
            this.highPriorityQueue = [];
            /** 中优先级数据队列（定时批量发送） */
            this.mediumPriorityQueue = [];
            /** 低优先级数据队列（延迟批量发送） */
            this.lowPriorityQueue = [];
            /** 定时器ID，用于定时批量发送数据 */
            this.reportTimer = null;
            /** 标识传输器是否已被销毁 */
            this.isDestroyed = false;
            /** 当前正在发送的请求数量 */
            this.pendingRequests = 0;
            /** 失败重试队列 */
            this.retryQueue = [];
            // 合并传输配置选项，提供完整的默认值
            this.options = {
                url: options.url,
                timeout: (_a = options.timeout) !== null && _a !== void 0 ? _a : 5000, // 默认超时时间5秒
                withCredentials: (_b = options.withCredentials) !== null && _b !== void 0 ? _b : false, // 默认不携带身份凭证
                headers: (_c = options.headers) !== null && _c !== void 0 ? _c : {}, // 默认空请求头
                reportInterval: (_d = options.reportInterval) !== null && _d !== void 0 ? _d : 10000, // 默认10秒上报间隔
                batchSize: (_e = options.batchSize) !== null && _e !== void 0 ? _e : 10, // 默认批量大小10条
                maxQueueSize: (_f = options.maxQueueSize) !== null && _f !== void 0 ? _f : 100, // 默认队列最大100条
                enableImmediateReport: (_g = options.enableImmediateReport) !== null && _g !== void 0 ? _g : true, // 默认启用立即上报
                retryCount: (_h = options.retryCount) !== null && _h !== void 0 ? _h : 3, // 默认重试3次
                retryInterval: (_j = options.retryInterval) !== null && _j !== void 0 ? _j : 1000 // 默认重试间隔1秒
            };
            // 启动定时上报机制
            this.startReportTimer();
            // 设置页面关闭前的数据保护
            this.setupBeforeUnload();
            // 启动重试机制
            this.startRetryTimer();
        }
        /**
         * 启动定时上报定时器
         * 按配置的时间间隔定期检查并上报缓存的数据
         */
        startReportTimer() {
            this.reportTimer = window.setInterval(() => {
                this.processQueuedData();
            }, this.options.reportInterval);
        }
        /**
         * 启动重试定时器
         * 定期检查并处理失败的重试请求
         */
        startRetryTimer() {
            setInterval(() => {
                this.processRetryQueue();
            }, this.options.retryInterval);
        }
        /**
         * 设置页面关闭前的数据保护
         * 监听页面卸载和可见性变化事件，确保缓存数据不丢失
         */
        setupBeforeUnload() {
            // 监听页面即将卸载事件
            window.addEventListener('beforeunload', () => {
                this.flushAllQueues();
            });
            // 监听页面可见性变化事件（如切换标签页）
            window.addEventListener('visibilitychange', () => {
                // 当页面被隐藏时，尝试发送剩余数据
                if (document.visibilityState === 'hidden') {
                    this.flushAllQueues();
                }
            });
        }
        /**
         * 刷新所有队列中的数据
         * 在页面关闭或隐藏时调用，使用sendBeacon确保数据可靠发送
         */
        flushAllQueues() {
            const allData = [
                ...this.highPriorityQueue,
                ...this.mediumPriorityQueue,
                ...this.lowPriorityQueue
            ];
            if (allData.length > 0) {
                // 使用sendBeacon发送剩余数据，保证即使页面关闭也能发送成功
                this.trySendBeacon(allData);
                // 清空所有队列
                this.highPriorityQueue = [];
                this.mediumPriorityQueue = [];
                this.lowPriorityQueue = [];
            }
        }
        /**
         * 发送数据
         * 根据数据优先级决定是立即发送还是加入相应的缓存队列
         * @param data 需要发送的监控数据
         */
        send(data) {
            // 检查传输器是否已被销毁
            if (this.isDestroyed)
                return;
            // 根据优先级决定处理策略
            const priority = data.priority || this.getDefaultPriority(data.type);
            if (priority === exports.ReportPriority.HIGH && this.options.enableImmediateReport) {
                // 高优先级数据立即发送
                this.sendImmediately([data]);
            }
            else {
                // 其他优先级数据加入相应队列
                this.addToQueue(data, priority);
                // 检查是否需要强制上报（队列溢出保护）
                this.checkQueueOverflow();
            }
        }
        /**
         * 处理队列中的数据
         * 按优先级和批量大小处理各个队列中的数据
         */
        processQueuedData() {
            if (this.isDestroyed || this.pendingRequests > 3)
                return; // 限制并发请求数
            // 优先处理中优先级数据
            if (this.mediumPriorityQueue.length > 0) {
                const batch = this.mediumPriorityQueue.splice(0, this.options.batchSize);
                this.sendBatch(batch, exports.ReportPriority.MEDIUM);
            }
            // 其次处理低优先级数据
            if (this.lowPriorityQueue.length > 0) {
                const batch = this.lowPriorityQueue.splice(0, this.options.batchSize);
                this.sendBatch(batch, exports.ReportPriority.LOW);
            }
        }
        /**
         * 批量发送数据
         * 按照优先级顺序尝试不同的发送方式
         * @param batch 需要发送的数据批次
         * @param priority 数据优先级
         */
        sendBatch(batch, priority) {
            if (this.isDestroyed)
                return;
            this.pendingRequests++;
            // 将数据序列化为JSON字符串
            const data = JSON.stringify(batch);
            // 高优先级数据优先使用sendBeacon，其他使用fetch
            const sendPromise = priority === exports.ReportPriority.HIGH
                ? this.trySendBeacon(batch) || this.sendFetch(data)
                : this.sendFetch(data).catch(() => this.sendXHR(data));
            // 处理发送结果
            Promise.resolve(sendPromise)
                .then(() => {
                var _a;
                this.pendingRequests--;
                // 发送成功，记录日志
                if ((_a = this.options.headers) === null || _a === void 0 ? void 0 : _a['debug']) {
                    console.log(`数据上报成功: ${batch.length} 条数据, 优先级: ${priority}`);
                }
            })
                .catch(() => {
                this.pendingRequests--;
                // 发送失败，加入重试队列
                this.addToRetryQueue(batch);
            });
        }
        /**
         * 立即发送数据（高优先级）
         * @param data 需要立即发送的数据
         */
        sendImmediately(data) {
            this.sendBatch(data, exports.ReportPriority.HIGH);
        }
        /**
         * 尝试使用sendBeacon API发送数据
         * sendBeacon是最可靠的数据发送方式，即使页面关闭也能保证数据送达
         * @param data 需要发送的数据数组
         * @returns 如果发送成功返回Promise<void>，失败或不支持返回null
         */
        trySendBeacon(data) {
            // 检查浏览器是否支持sendBeacon API
            if (!navigator.sendBeacon) {
                return null;
            }
            try {
                // 将数据序列化为JSON字符串
                const payload = JSON.stringify(data);
                // 创建Blob对象，设置正确的MIME类型
                const blob = new Blob([payload], { type: 'application/json' });
                // 使用sendBeacon发送数据
                const success = navigator.sendBeacon(this.options.url, blob);
                return success ? Promise.resolve() : Promise.reject(new Error('SendBeacon failed'));
            }
            catch (error) {
                return Promise.reject(error);
            }
        }
        /**
         * 根据数据类型获取默认优先级
         * @param dataType 数据类型
         * @returns 默认优先级
         */
        getDefaultPriority(dataType) {
            switch (dataType) {
                case 'error':
                    return exports.ReportPriority.HIGH; // 错误数据高优先级
                case 'performance':
                    return exports.ReportPriority.MEDIUM; // 性能数据中优先级
                case 'behavior':
                    return exports.ReportPriority.LOW; // 行为数据低优先级
                default:
                    return exports.ReportPriority.MEDIUM;
            }
        }
        /**
         * 将数据添加到相应的优先级队列
         * @param data 要添加的数据
         * @param priority 数据优先级
         */
        addToQueue(data, priority) {
            switch (priority) {
                case exports.ReportPriority.HIGH:
                    this.highPriorityQueue.push(data);
                    break;
                case exports.ReportPriority.MEDIUM:
                    this.mediumPriorityQueue.push(data);
                    break;
                case exports.ReportPriority.LOW:
                    this.lowPriorityQueue.push(data);
                    break;
            }
        }
        /**
         * 检查队列是否溢出，如果溢出则强制上报
         */
        checkQueueOverflow() {
            const totalQueueSize = this.highPriorityQueue.length +
                this.mediumPriorityQueue.length +
                this.lowPriorityQueue.length;
            if (totalQueueSize >= this.options.maxQueueSize) {
                // 队列溢出，强制上报部分数据
                this.processQueuedData();
            }
        }
        /**
         * 将失败的数据加入重试队列
         * @param data 失败的数据
         */
        addToRetryQueue(data) {
            const retryItem = {
                data,
                retryCount: 0,
                nextRetryTime: Date.now() + this.options.retryInterval
            };
            this.retryQueue.push(retryItem);
        }
        /**
         * 处理重试队列
         */
        processRetryQueue() {
            if (this.retryQueue.length === 0 || this.pendingRequests > 3)
                return;
            const now = Date.now();
            const readyToRetry = this.retryQueue.filter(item => now >= item.nextRetryTime);
            readyToRetry.forEach(item => {
                if (item.retryCount < this.options.retryCount) {
                    item.retryCount++;
                    item.nextRetryTime = now + this.options.retryInterval * Math.pow(2, item.retryCount); // 指数退避
                    // 重新尝试发送
                    this.sendBatch(item.data, exports.ReportPriority.MEDIUM);
                }
                else {
                    // 超过重试次数，放弃该数据
                    const index = this.retryQueue.indexOf(item);
                    if (index > -1) {
                        this.retryQueue.splice(index, 1);
                    }
                }
            });
        }
        /**
         * 使用fetch API发送数据
         * 现代浏览器的标准HTTP请求方式，支持Promise和请求取消
         * @param data 需要发送的JSON字符串数据
         * @returns Promise对象，成功时resolve，失败时reject
         */
        async sendFetch(data) {
            // 创建AbortController用于请求超时控制
            const controller = new AbortController();
            // 设置超时定时器，超时后取消请求
            const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);
            try {
                // 发送POST请求
                await fetch(this.options.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.options.headers // 合并自定义请求头
                    },
                    body: data,
                    // 根据配置决定是否携带身份凭证
                    credentials: this.options.withCredentials ? 'include' : 'omit',
                    signal: controller.signal // 关联取消信号
                });
            }
            finally {
                // 无论成功失败都要清理定时器
                clearTimeout(timeoutId);
            }
        }
        /**
         * 使用XMLHttpRequest发送数据
         * 兼容性最好的HTTP请求方式，作为最后的fallback选项
         * @param data 需要发送的JSON字符串数据
         */
        sendXHR(data) {
            // 创建XMLHttpRequest对象
            const xhr = new XMLHttpRequest();
            // 初始化POST请求，异步模式
            xhr.open('POST', this.options.url, true);
            // 设置请求超时时间
            xhr.timeout = this.options.timeout;
            // 设置是否携带身份凭证
            xhr.withCredentials = this.options.withCredentials;
            // 设置请求头
            xhr.setRequestHeader('Content-Type', 'application/json');
            // 添加自定义请求头
            Object.entries(this.options.headers).forEach(([key, value]) => {
                xhr.setRequestHeader(key, value);
            });
            // 错误处理 - 静默处理，避免影响主业务
            xhr.onerror = () => {
                // 静默处理网络错误，避免影响主业务
            };
            // 超时处理 - 静默处理，避免影响主业务
            xhr.ontimeout = () => {
                // 静默处理请求超时，避免影响主业务  
            };
            try {
                // 发送请求数据
                xhr.send(data);
            }
            catch (error) {
                // 静默处理发送异常，确保不影响主业务逻辑
            }
        }
        /**
         * 销毁传输器
         * 清理所有定时器和事件监听器，发送剩余数据
         */
        destroy() {
            // 标记传输器为已销毁状态
            this.isDestroyed = true;
            // 清理定时上报定时器
            if (this.reportTimer) {
                clearInterval(this.reportTimer);
                this.reportTimer = null;
            }
            // 发送所有队列中剩余的数据，避免数据丢失
            this.flushAllQueues();
            // 清空重试队列
            this.retryQueue = [];
        }
        /**
         * 获取队列状态信息
         * 用于调试和监控
         * @returns 队列状态信息
         */
        getQueueStatus() {
            return {
                high: this.highPriorityQueue.length,
                medium: this.mediumPriorityQueue.length,
                low: this.lowPriorityQueue.length,
                retry: this.retryQueue.length,
                pending: this.pendingRequests
            };
        }
        /**
         * 手动触发数据上报
         * 用于特殊情况下的手动上报
         */
        flush() {
            this.processQueuedData();
        }
    }

    /**
     * 生成会话ID
     * 使用时间戳和随机字符串组合生成唯一的会话标识符
     * @returns 格式为 "session_{timestamp}_{randomString}" 的会话ID
     */
    function generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * 生成或获取用户ID
     * 优先从localStorage获取已存储的用户ID，不存在则生成新的并存储
     * @returns 用户唯一标识符
     */
    function generateUserId() {
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
        }
        catch (error) {
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
    function getElementPath(element) {
        /** 存储路径段的数组 */
        const path = [];
        /** 当前遍历的元素 */
        let current = element;
        // 向上遍历DOM树直到根节点
        while (current && current.nodeType === Node.ELEMENT_NODE) {
            /** 当前元素的选择器 */
            let selector = current.nodeName.toLowerCase();
            // 如果元素有ID，使用ID选择器并结束遍历
            if (current.id) {
                selector += `#${current.id}`;
                path.unshift(selector);
                break;
            }
            else {
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
    function getElementText(element) {
        var _a;
        // 对于输入框，优先获取value值，其次是placeholder
        if (element.tagName === 'INPUT') {
            return element.value || element.placeholder || '';
        }
        // 对于其他元素，获取文本内容并去除空白，限制在100字符内
        return ((_a = element.textContent) === null || _a === void 0 ? void 0 : _a.trim().slice(0, 100)) || '';
    }
    /**
     * 函数节流器
     * 限制函数在指定时间间隔内最多执行一次，防止频繁调用
     * @param func 需要节流的函数
     * @param delay 节流延迟时间（毫秒）
     * @returns 节流后的函数
     */
    function throttle(func, delay) {
        /** 定时器ID，用于清理定时器 */
        let timeoutId = null;
        /** 上次执行的时间戳 */
        let lastExecTime = 0;
        return (function (...args) {
            /** 当前时间戳 */
            const currentTime = Date.now();
            const context = this;
            // 如果距离上次执行的时间超过了延迟时间，立即执行
            if (currentTime - lastExecTime > delay) {
                func.apply(context, args);
                lastExecTime = currentTime;
            }
            else {
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
        });
    }
    /**
     * 函数防抖器
     * 延迟执行函数，如果在延迟期间再次调用则重新计时
     * @param func 需要防抖的函数
     * @param delay 防抖延迟时间（毫秒）
     * @returns 防抖后的函数
     */
    function debounce(func, delay) {
        /** 定时器ID，用于清理定时器 */
        let timeoutId = null;
        return (function (...args) {
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
        });
    }
    /**
     * 检测当前环境是否为机器人或爬虫
     * 通过分析User-Agent字符串来判断
     * @returns 如果是机器人或爬虫返回true，否则返回false
     */
    function isBot() {
        // 检测User-Agent中常见的机器人关键词
        return /bot|crawler|spider|crawling/i.test(navigator.userAgent);
    }

    /**
     * 监控器核心类
     * 负责管理整个SDK的配置、数据收集、插件管理和数据上报
     */
    class Monitor {
        /**
         * 监控器构造函数
         * @param config 监控配置对象
         */
        constructor(config) {
            /** 面包屑记录数组，用于记录用户操作轨迹 */
            this.breadcrumbs = [];
            /** 插件映射表，用于管理已安装的插件 */
            this.plugins = new Map();
            /** 标识监控器是否已被销毁 */
            this.isDestroyed = false;
            // 合并配置，为可选参数设置默认值
            this.config = this.mergeConfig(config);
            // 生成会话ID和用户ID
            this.sessionId = generateSessionId();
            this.userId = generateUserId();
            // 初始化数据传输管理器
            this.transport = new Transport({
                url: this.config.reportUrl,
                reportInterval: this.config.reportInterval,
                batchSize: this.config.batchSize,
                maxQueueSize: this.config.maxQueueSize,
                enableImmediateReport: this.config.enableImmediateReport
            });
            // 初始化监控器
            this.init();
        }
        /**
         * 合并用户配置和默认配置
         * 为所有可选配置项提供合理的默认值
         * @param config 用户提供的配置对象
         * @returns 合并后的完整配置对象
         */
        mergeConfig(config) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            return {
                appId: config.appId,
                reportUrl: config.reportUrl,
                sampling: (_a = config.sampling) !== null && _a !== void 0 ? _a : 1, // 默认100%采样
                debug: (_b = config.debug) !== null && _b !== void 0 ? _b : false, // 默认关闭调试模式
                enablePerformance: (_c = config.enablePerformance) !== null && _c !== void 0 ? _c : true, // 默认开启性能监控
                enableError: (_d = config.enableError) !== null && _d !== void 0 ? _d : true, // 默认开启错误监控
                enableBehavior: (_e = config.enableBehavior) !== null && _e !== void 0 ? _e : true, // 默认开启行为监控
                maxBreadcrumbsNum: (_f = config.maxBreadcrumbsNum) !== null && _f !== void 0 ? _f : 20, // 默认最多保存20条面包屑
                beforeSend: (_g = config.beforeSend) !== null && _g !== void 0 ? _g : ((data) => data), // 默认不对数据进行处理
                reportInterval: (_h = config.reportInterval) !== null && _h !== void 0 ? _h : 10000, // 默认10秒上报间隔
                batchSize: (_j = config.batchSize) !== null && _j !== void 0 ? _j : 10, // 默认批量大小为10
                maxQueueSize: (_k = config.maxQueueSize) !== null && _k !== void 0 ? _k : 100, // 默认队列最大100条
                enableImmediateReport: (_l = config.enableImmediateReport) !== null && _l !== void 0 ? _l : true // 默认启用立即上报
            };
        }
        /**
         * 初始化监控器
         * 根据采样率决定是否启动监控功能
         */
        init() {
            // 根据采样率决定是否启动监控
            if (this.shouldSample()) {
                this.setupErrorHandling();
            }
        }
        /**
         * 检查当前请求是否应该被采样
         * 使用随机数和采样率进行比较
         * @returns 如果应该采样返回true，否则返回false
         */
        shouldSample() {
            return Math.random() < this.config.sampling;
        }
        /**
         * 设置全局错误处理
         * 监听全局错误事件并确保SDK本身的错误不会影响宿主应用
         */
        setupErrorHandling() {
            // 保存原始的console.error方法
            const originalError = console.error;
            // 重写console.error，添加异常保护
            console.error = (...args) => {
                try {
                    originalError.apply(console, args);
                }
                catch (e) {
                    // 确保SDK本身的错误不会影响宿主应用
                }
            };
            // 监听JavaScript运行时错误
            window.addEventListener('error', (_event) => {
                this.safeExecute(() => {
                    // 错误处理逻辑将在后续模块中实现
                });
            });
            // 监听Promise未处理的异常
            window.addEventListener('unhandledrejection', (_event) => {
                this.safeExecute(() => {
                    // Promise错误处理逻辑将在后续模块中实现
                });
            });
        }
        /**
         * 安全执行函数
         * 在try-catch块中执行函数，确保SDK内部错误不会影响宿主应用
         * @param fn 需要安全执行的函数
         */
        safeExecute(fn) {
            try {
                // 检查监控器是否已被销毁
                if (!this.isDestroyed) {
                    fn();
                }
            }
            catch (error) {
                // 在调试模式下输出SDK内部错误信息
                if (this.config.debug) {
                    console.warn('WebMonitorSDK internal error:', error);
                }
            }
        }
        /**
         * 添加面包屑记录
         * 在面包屑数组中添加新的记录，如果超过最大数量则删除最早的记录
         * @param breadcrumb 需要添加的面包屑记录
         */
        addBreadcrumb(breadcrumb) {
            // 如果超过最大数量，删除最早的记录
            if (this.breadcrumbs.length >= this.config.maxBreadcrumbsNum) {
                this.breadcrumbs.shift();
            }
            // 添加新记录到数组末尾
            this.breadcrumbs.push(breadcrumb);
        }
        /**
         * 上报监控数据
         * 将监控数据包装成标准格式并发送到后端
         * @param data 需要上报的数据（不包含公共字段）
         */
        report(data) {
            this.safeExecute(() => {
                // 构建完整的上报数据对象
                const reportData = {
                    appId: this.config.appId, // 应用ID
                    timestamp: Date.now(), // 当前时间戳
                    sessionId: this.sessionId, // 会话ID
                    userId: this.userId, // 用户ID
                    url: window.location.href, // 当前页面URL
                    userAgent: navigator.userAgent, // 用户代理
                    breadcrumbs: [...this.breadcrumbs], // 面包屑记录的拷贝
                    ...data // 具体的监控数据
                };
                // 调用用户配置的beforeSend钩子函数
                const processedData = this.config.beforeSend(reportData);
                // 如果函数返回null，则不发送数据
                if (processedData) {
                    this.transport.send(processedData);
                    // 在调试模式下输出上报的数据
                    if (this.config.debug) {
                        console.log('WebMonitorSDK Report:', processedData);
                    }
                }
            });
        }
        /**
         * 安装插件
         * 向SDK中添加一个新的插件，并调用其安装方法
         * @param plugin 需要安装的插件对象
         */
        use(plugin) {
            // 检查插件是否已经安装
            if (this.plugins.has(plugin.name)) {
                console.warn(`Plugin ${plugin.name} already installed`);
                return;
            }
            // 将插件添加到插件映射表中
            this.plugins.set(plugin.name, plugin);
            // 调用插件的安装方法
            plugin.install(this);
        }
        /**
         * 卸载插件
         * 从 SDK 中移除指定的插件，并调用其卸载方法
         * @param pluginName 需要卸载的插件名称
         */
        unuse(pluginName) {
            // 从插件映射表中获取插件
            const plugin = this.plugins.get(pluginName);
            // 如果插件存在且有卸载方法，则调用卸载方法
            if (plugin && plugin.uninstall) {
                plugin.uninstall(this);
            }
            // 从插件映射表中移除插件
            this.plugins.delete(pluginName);
        }
        /**
         * 销毁监控器
         * 清理所有资源，卸载所有插件，停止所有监控功能
         */
        destroy() {
            // 标记监控器为已销毁状态
            this.isDestroyed = true;
            // 销毁数据传输管理器
            this.transport.destroy();
            // 卸载所有插件
            this.plugins.forEach(plugin => {
                if (plugin.uninstall) {
                    plugin.uninstall(this);
                }
            });
            // 清空插件映射表
            this.plugins.clear();
            // 清空面包屑记录
            this.breadcrumbs = [];
        }
        // Getters - 公共访问器方法
        /**
         * 获取是否开启调试模式
         * @returns 调试模式状态
         */
        get isDebug() {
            return this.config.debug;
        }
        /**
         * 获取应用ID
         * @returns 当前应用的唯一标识符
         */
        get appId() {
            return this.config.appId;
        }
        /**
         * 获取当前会话ID
         * @returns 当前会话的唯一标识符
         */
        get currentSessionId() {
            return this.sessionId;
        }
        /**
         * 获取当前用户ID
         * @returns 当前用户的唯一标识符
         */
        get currentUserId() {
            return this.userId;
        }
    }

    var e,n,t,i,a=-1,o=function(e){addEventListener("pageshow",(function(n){n.persisted&&(a=n.timeStamp,e(n));}),!0);},c=function(){return window.performance&&performance.getEntriesByType&&performance.getEntriesByType("navigation")[0]},u=function(){var e=c();return e&&e.activationStart||0},f=function(e,n){var t=c(),i="navigate";a>=0?i="back-forward-cache":t&&(document.prerendering||u()>0?i="prerender":document.wasDiscarded?i="restore":t.type&&(i=t.type.replace(/_/g,"-")));return {name:e,value:void 0===n?-1:n,rating:"good",delta:0,entries:[],id:"v3-".concat(Date.now(),"-").concat(Math.floor(8999999999999*Math.random())+1e12),navigationType:i}},s=function(e,n,t){try{if(PerformanceObserver.supportedEntryTypes.includes(e)){var i=new PerformanceObserver((function(e){Promise.resolve().then((function(){n(e.getEntries());}));}));return i.observe(Object.assign({type:e,buffered:!0},t||{})),i}}catch(e){}},d=function(e,n,t,i){var r,a;return function(o){n.value>=0&&(o||i)&&((a=n.value-(r||0))||void 0===r)&&(r=n.value,n.delta=a,n.rating=function(e,n){return e>n[1]?"poor":e>n[0]?"needs-improvement":"good"}(n.value,t),e(n));}},l=function(e){requestAnimationFrame((function(){return requestAnimationFrame((function(){return e()}))}));},p=function(e){var n=function(n){"pagehide"!==n.type&&"hidden"!==document.visibilityState||e(n);};addEventListener("visibilitychange",n,!0),addEventListener("pagehide",n,!0);},v=function(e){var n=!1;return function(t){n||(e(t),n=!0);}},m=-1,h=function(){return "hidden"!==document.visibilityState||document.prerendering?1/0:0},g=function(e){"hidden"===document.visibilityState&&m>-1&&(m="visibilitychange"===e.type?e.timeStamp:0,T());},y=function(){addEventListener("visibilitychange",g,!0),addEventListener("prerenderingchange",g,!0);},T=function(){removeEventListener("visibilitychange",g,!0),removeEventListener("prerenderingchange",g,!0);},E=function(){return m<0&&(m=h(),y(),o((function(){setTimeout((function(){m=h(),y();}),0);}))),{get firstHiddenTime(){return m}}},C=function(e){document.prerendering?addEventListener("prerenderingchange",(function(){return e()}),!0):e();},L=[1800,3e3],w=function(e,n){n=n||{},C((function(){var t,i=E(),r=f("FCP"),a=s("paint",(function(e){e.forEach((function(e){"first-contentful-paint"===e.name&&(a.disconnect(),e.startTime<i.firstHiddenTime&&(r.value=Math.max(e.startTime-u(),0),r.entries.push(e),t(!0)));}));}));a&&(t=d(e,r,L,n.reportAllChanges),o((function(i){r=f("FCP"),t=d(e,r,L,n.reportAllChanges),l((function(){r.value=performance.now()-i.timeStamp,t(!0);}));})));}));},b=[.1,.25],S=function(e,n){n=n||{},w(v((function(){var t,i=f("CLS",0),r=0,a=[],c=function(e){e.forEach((function(e){if(!e.hadRecentInput){var n=a[0],t=a[a.length-1];r&&e.startTime-t.startTime<1e3&&e.startTime-n.startTime<5e3?(r+=e.value,a.push(e)):(r=e.value,a=[e]);}})),r>i.value&&(i.value=r,i.entries=a,t());},u=s("layout-shift",c);u&&(t=d(e,i,b,n.reportAllChanges),p((function(){c(u.takeRecords()),t(!0);})),o((function(){r=0,i=f("CLS",0),t=d(e,i,b,n.reportAllChanges),l((function(){return t()}));})),setTimeout(t,0));})));},A={passive:!0,capture:!0},I=new Date,P=function(i,r){e||(e=r,n=i,t=new Date,k(removeEventListener),F());},F=function(){if(n>=0&&n<t-I){var r={entryType:"first-input",name:e.type,target:e.target,cancelable:e.cancelable,startTime:e.timeStamp,processingStart:e.timeStamp+n};i.forEach((function(e){e(r);})),i=[];}},M=function(e){if(e.cancelable){var n=(e.timeStamp>1e12?new Date:performance.now())-e.timeStamp;"pointerdown"==e.type?function(e,n){var t=function(){P(e,n),r();},i=function(){r();},r=function(){removeEventListener("pointerup",t,A),removeEventListener("pointercancel",i,A);};addEventListener("pointerup",t,A),addEventListener("pointercancel",i,A);}(n,e):P(n,e);}},k=function(e){["mousedown","keydown","touchstart","pointerdown"].forEach((function(n){return e(n,M,A)}));},D=[100,300],x=function(t,r){r=r||{},C((function(){var a,c=E(),u=f("FID"),l=function(e){e.startTime<c.firstHiddenTime&&(u.value=e.processingStart-e.startTime,u.entries.push(e),a(!0));},m=function(e){e.forEach(l);},h=s("first-input",m);a=d(t,u,D,r.reportAllChanges),h&&p(v((function(){m(h.takeRecords()),h.disconnect();}))),h&&o((function(){var o;u=f("FID"),a=d(t,u,D,r.reportAllChanges),i=[],n=-1,e=null,k(addEventListener),o=l,i.push(o),F();}));}));},U=[2500,4e3],V={},W=function(e,n){n=n||{},C((function(){var t,i=E(),r=f("LCP"),a=function(e){var n=e[e.length-1];n&&n.startTime<i.firstHiddenTime&&(r.value=Math.max(n.startTime-u(),0),r.entries=[n],t());},c=s("largest-contentful-paint",a);if(c){t=d(e,r,U,n.reportAllChanges);var m=v((function(){V[r.id]||(a(c.takeRecords()),c.disconnect(),V[r.id]=!0,t(!0));}));["keydown","click"].forEach((function(e){addEventListener(e,(function(){return setTimeout(m,0)}),!0);})),p(m),o((function(i){r=f("LCP"),t=d(e,r,U,n.reportAllChanges),l((function(){r.value=performance.now()-i.timeStamp,V[r.id]=!0,t(!0);}));}));}}));},X=[800,1800],Y=function e(n){document.prerendering?C((function(){return e(n)})):"complete"!==document.readyState?addEventListener("load",(function(){return e(n)}),!0):setTimeout(n,0);},Z=function(e,n){n=n||{};var t=f("TTFB"),i=d(e,t,X,n.reportAllChanges);Y((function(){var r=c();if(r){var a=r.responseStart;if(a<=0||a>performance.now())return;t.value=Math.max(a-u(),0),t.entries=[r],i(!0),o((function(){t=f("TTFB",0),(i=d(e,t,X,n.reportAllChanges))(!0);}));}}));};

    /**
     * 性能监控类
     * 负责收集和监控各种性能指标，包括Core Web Vitals、导航时间、资源加载时间和API请求时间
     */
    class PerformanceMonitor {
        /**
         * 构造函数
         * @param monitor 监控器实例
         */
        constructor(monitor) {
            /** 性能观察器，用于监听资源加载事件 */
            this.observer = null;
            this.monitor = monitor;
            // 初始化性能监控
            this.init();
        }
        /**
         * 初始化性能监控
         * 启动所有性能数据收集功能
         */
        init() {
            // 收集Core Web Vitals指标
            this.collectWebVitals();
            // 收集页面导航时间
            this.collectNavigationTiming();
            // 收集资源加载时间
            this.collectResourceTiming();
            // 收集API请求时间
            this.collectAPITiming();
        }
        /**
         * 收集Core Web Vitals指标
         * 使用web-vitals库收集LCP、FID、CLS、FCP、TTFB等关键性能指标
         */
        collectWebVitals() {
            // Largest Contentful Paint - 最大内容绘制时间
            // 衡量页面加载性能的重要指标
            W((metric) => {
                this.reportMetric({
                    type: exports.PerformanceType.LCP,
                    name: 'LCP',
                    value: metric.value,
                    rating: metric.rating,
                    delta: metric.delta,
                    entries: metric.entries
                });
            });
            // First Input Delay - 首次输入延迟
            // 衡量页面交互响应性的关键指标
            x((metric) => {
                this.reportMetric({
                    type: exports.PerformanceType.FID,
                    name: 'FID',
                    value: metric.value,
                    rating: metric.rating,
                    delta: metric.delta,
                    entries: metric.entries
                });
            });
            // Cumulative Layout Shift - 累积布局偏移
            // 衡量页面视觉稳定性的重要指标
            S((metric) => {
                this.reportMetric({
                    type: exports.PerformanceType.CLS,
                    name: 'CLS',
                    value: metric.value,
                    rating: metric.rating,
                    delta: metric.delta,
                    entries: metric.entries
                });
            });
            // First Contentful Paint - 首次内容绘制
            // 衡量页面加载感知速度的指标
            w((metric) => {
                this.reportMetric({
                    type: exports.PerformanceType.FCP,
                    name: 'FCP',
                    value: metric.value,
                    rating: metric.rating,
                    delta: metric.delta,
                    entries: metric.entries
                });
            });
            // Time to First Byte - 首字节时间
            // 衡量服务器响应速度的指标
            Z((metric) => {
                this.reportMetric({
                    type: exports.PerformanceType.TTFB,
                    name: 'TTFB',
                    value: metric.value,
                    rating: metric.rating,
                    delta: metric.delta,
                    entries: metric.entries
                });
            });
        }
        /**
         * 收集页面导航时间
         * 分析页面加载各个阶段的耗时，包括DNS查询、TCP连接、SSL握手、请求响应等
         */
        collectNavigationTiming() {
            // 监听页面加载完成事件
            window.addEventListener('load', () => {
                // 延迟执行确保所有指标都已计算完成
                setTimeout(() => {
                    // 获取导航时间条目
                    const navigation = performance.getEntriesByType('navigation')[0];
                    if (!navigation)
                        return;
                    // 计算各个阶段的耗时
                    const timing = {
                        /** DNS查询耗时 */
                        dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
                        /** TCP连接耗时 */
                        tcpConnect: navigation.connectEnd - navigation.connectStart,
                        /** SSL握手耗时 */
                        sslConnect: navigation.secureConnectionStart > 0 ? navigation.connectEnd - navigation.secureConnectionStart : 0,
                        /** 请求耗时 */
                        request: navigation.responseStart - navigation.requestStart,
                        /** 响应耗时 */
                        response: navigation.responseEnd - navigation.responseStart,
                        /** DOM解析耗时 */
                        domParse: navigation.domInteractive - navigation.responseEnd,
                        /** DOMContentLoaded事件耗时 */
                        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
                        /** 页面完全加载耗时 */
                        loadComplete: navigation.loadEventEnd - navigation.fetchStart,
                        /** 首次绘制时间 */
                        firstPaint: this.getFirstPaint(),
                        /** 首次内容绘制时间 */
                        firstContentfulPaint: this.getFirstContentfulPaint()
                    };
                    // 上报导航时间数据
                    this.reportMetric({
                        type: exports.PerformanceType.NAVIGATION,
                        name: 'Navigation Timing',
                        value: timing.loadComplete,
                        entries: [navigation],
                        navigationType: this.getNavigationType(typeof navigation.type === 'number' ? navigation.type : 0)
                    });
                    // 添加页面加载完成的面包屑记录
                    this.monitor.addBreadcrumb({
                        timestamp: Date.now(),
                        type: exports.DataType.PERFORMANCE,
                        category: 'navigation',
                        message: 'Page loaded',
                        level: 'info',
                        data: timing
                    });
                }, 0);
            });
        }
        /**
         * 收集资源加载时间
         * 监控页面中所有资源（图片、脚本、样式表等）的加载性能
         */
        collectResourceTiming() {
            // 检查浏览器是否支持PerformanceObserver
            if (!PerformanceObserver)
                return;
            try {
                // 创建性能观察器监听资源加载事件
                this.observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry) => {
                        if (entry.entryType === 'resource') {
                            const resource = entry;
                            // 过滤SDK自身的请求，避免循环上报
                            if (resource.name.includes(this.monitor.appId))
                                return;
                            // 上报资源加载性能数据
                            this.reportMetric({
                                type: exports.PerformanceType.RESOURCE,
                                name: resource.name,
                                value: resource.duration,
                                entries: [entry]
                            });
                            // 对加载时间超过3秒的资源添加警告面包屑
                            if (resource.duration > 3000) {
                                this.monitor.addBreadcrumb({
                                    timestamp: Date.now(),
                                    type: exports.DataType.PERFORMANCE,
                                    category: 'resource',
                                    message: `Slow resource: ${resource.name}`,
                                    level: 'warning',
                                    data: {
                                        duration: resource.duration,
                                        size: resource.transferSize || 0
                                    }
                                });
                            }
                        }
                    });
                });
                // 开始观察资源类型的性能条目
                this.observer.observe({ entryTypes: ['resource'] });
            }
            catch (error) {
                // 静默处理PerformanceObserver创建失败的错误
            }
        }
        /**
         * 收集API请求时间
         * 拦截fetch和XMLHttpRequest请求，统计API调用的性能数据
         */
        collectAPITiming() {
            // 拦截fetch API调用
            const originalFetch = window.fetch;
            window.fetch = async (...args) => {
                // 记录请求开始时间
                const startTime = performance.now();
                // 提取请求URL
                const url = typeof args[0] === 'string' ? args[0] : args[0].url;
                try {
                    // 执行原始的fetch请求
                    const response = await originalFetch.apply(window, args);
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    // 上报API性能数据
                    this.reportMetric({
                        type: exports.PerformanceType.API,
                        name: url,
                        value: duration,
                        entries: []
                    });
                    // 对响应时间超过2秒的API添加警告面包屑
                    if (duration > 2000) {
                        this.monitor.addBreadcrumb({
                            timestamp: Date.now(),
                            type: exports.DataType.PERFORMANCE,
                            category: 'api',
                            message: `Slow API: ${url}`,
                            level: 'warning',
                            data: {
                                duration,
                                status: response.status
                            }
                        });
                    }
                    return response;
                }
                catch (error) {
                    // 处理请求失败情况
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    // 上报失败的API请求数据
                    this.reportMetric({
                        type: exports.PerformanceType.API,
                        name: url,
                        value: duration,
                        entries: []
                    });
                    // 重新抛出错误，保持原有的错误处理逻辑
                    throw error;
                }
            };
            // 拦截XMLHttpRequest API调用
            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;
            const self = this; // 保存当前实例的引用
            // 拦截XMLHttpRequest.open方法
            XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
                // 在xhr根对象上存储请求信息
                this._monitor_url = url.toString();
                this._monitor_startTime = performance.now();
                // 调用原始open方法
                return originalOpen.call(this, method, url, async !== null && async !== void 0 ? async : true, user, password);
            };
            // 拦截XMLHttpRequest.send方法
            XMLHttpRequest.prototype.send = function (body) {
                const xhr = this;
                const startTime = xhr._monitor_startTime;
                const url = xhr._monitor_url;
                // 监听请求状态变化
                const onReadyStateChange = () => {
                    // 请求完成时计算耗时
                    if (xhr.readyState === 4) {
                        const endTime = performance.now();
                        const duration = endTime - startTime;
                        // 使用闭包保存的self引用上报数据
                        if (self && url) {
                            self.reportMetric({
                                type: exports.PerformanceType.API,
                                name: url,
                                value: duration,
                                entries: []
                            });
                            // 对慢请求添加面包屑记录
                            if (duration > 2000) {
                                self.monitor.addBreadcrumb({
                                    timestamp: Date.now(),
                                    type: exports.DataType.PERFORMANCE,
                                    category: 'api',
                                    message: `Slow XHR: ${url}`,
                                    level: 'warning',
                                    data: {
                                        duration,
                                        status: xhr.status
                                    }
                                });
                            }
                        }
                    }
                };
                // 添加事件监听器
                xhr.addEventListener('readystatechange', onReadyStateChange);
                // 调用原始send方法
                return originalSend.call(this, body);
            };
        }
        /**
         * 获取首次绘制时间
         * @returns 首次绘制的时间戳，无法获取时返回0
         */
        getFirstPaint() {
            // 获取所有paint类型的性能条目
            const entries = performance.getEntriesByType('paint');
            // 查找首次绘制条目
            const fpEntry = entries.find(entry => entry.name === 'first-paint');
            // 返回时间戳或默认值0
            return fpEntry ? fpEntry.startTime : 0;
        }
        /**
         * 获取首次内容绘制时间
         * @returns 首次内容绘制的时间戳，无法获取时返回0
         */
        getFirstContentfulPaint() {
            // 获取所有paint类型的性能条目
            const entries = performance.getEntriesByType('paint');
            // 查找首次内容绘制条目
            const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
            // 返回时间戳或默认值0
            return fcpEntry ? fcpEntry.startTime : 0;
        }
        /**
         * 获取导航类型字符串
         * @param type 导航类型数字
         * @returns 导航类型的字符串描述
         */
        getNavigationType(type) {
            // 导航类型映射表
            const types = ['navigate', 'reload', 'back_forward', 'prerender'];
            // 返回对应的类型名称或未知
            return types[type] || 'unknown';
        }
        /**
         * 上报性能指标数据
         * 将性能数据包装成标准格式并上报给监控器
         * @param data 性能指标数据
         */
        reportMetric(data) {
            // 通过监控器上报数据
            this.monitor.report({
                type: exports.DataType.PERFORMANCE,
                data
            });
        }
        /**
         * 销毁性能监控器
         * 清理所有观察器和事件监听器
         */
        destroy() {
            // 断开性能观察器
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
            // 注意：实际应用中还应该恢复被拦截的fetch和XHR原始方法
        }
    }

    /**
     * 错误监控类
     * 负责捕获和监控各种类型的错误，包括JS错误、Promise异常、资源加载错误和API请求错误
     */
    class ErrorMonitor {
        /**
         * 构造函数
         * @param monitor 监控器实例
         */
        constructor(monitor) {
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
        init() {
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
        handleJSError() {
            // 监听全局error事件，使用捕获阶段监听以捕获更多错误
            window.addEventListener('error', (event) => {
                // 从错误事件中提取关键信息
                const { message, filename, lineno, colno, error } = event;
                // 构建错误数据对象
                const errorData = {
                    type: exports.ErrorType.JS_ERROR,
                    message: message || 'Unknown error',
                    filename: filename,
                    lineno: lineno,
                    colno: colno,
                    stack: error === null || error === void 0 ? void 0 : error.stack // 错误堆栈信息
                };
                // 上报错误数据
                this.reportError(errorData);
                // 添加错误面包屑记录，用于问题复现
                this.monitor.addBreadcrumb({
                    timestamp: Date.now(),
                    type: exports.DataType.ERROR,
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
        handlePromiseError() {
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
                    }
                    else if (typeof event.reason === 'string') {
                        // 字符串类型
                        message = event.reason;
                    }
                    else {
                        // 其他类型，尝试序列化
                        try {
                            message = JSON.stringify(event.reason);
                        }
                        catch (_a) {
                            message = String(event.reason);
                        }
                    }
                }
                // 构建错误数据对象
                const errorData = {
                    type: exports.ErrorType.PROMISE_ERROR,
                    message,
                    stack
                };
                // 上报错误数据
                this.reportError(errorData);
                // 添加Promise错误面包屑记录
                this.monitor.addBreadcrumb({
                    timestamp: Date.now(),
                    type: exports.DataType.ERROR,
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
        handleResourceError() {
            // 监听全局error事件，使用捕获阶段监听资源加载错误
            window.addEventListener('error', (event) => {
                const target = event.target;
                // 只处理资源加载错误，排除JS执行错误
                if (target && target !== window && (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK' || target.tagName === 'AUDIO' || target.tagName === 'VIDEO')) {
                    // 构建资源错误数据对象
                    const errorData = {
                        type: exports.ErrorType.RESOURCE_ERROR,
                        message: `Resource load error: ${target.tagName}`,
                        resourceUrl: target.src || target.href || '', // 获取资源URL
                        elementSelector: getElementPath(target) // 获取元素的CSS选择器路径
                    };
                    // 上报资源错误数据
                    this.reportError(errorData);
                    // 添加资源错误面包屑记录
                    this.monitor.addBreadcrumb({
                        timestamp: Date.now(),
                        type: exports.DataType.ERROR,
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
        handleAPIError() {
            // 拦截fetch API调用
            window.fetch = async (...args) => {
                // 提取请求URL
                const url = typeof args[0] === 'string' ? args[0] : args[0].url;
                const startTime = Date.now();
                try {
                    // 执行原始的fetch请求
                    const response = await this.originalFetch.apply(window, args);
                    // 检查HTTP状态码，非2xx状态码视为错误
                    if (!response.ok) {
                        const errorData = {
                            type: exports.ErrorType.API_ERROR,
                            message: `API Error: ${response.status} ${response.statusText}`,
                            resourceUrl: url,
                            statusCode: response.status
                        };
                        // 上报API错误数据
                        this.reportError(errorData);
                        // 添加API错误面包屑记录
                        this.monitor.addBreadcrumb({
                            timestamp: Date.now(),
                            type: exports.DataType.ERROR,
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
                }
                catch (error) {
                    // 处理网络错误或其他异常
                    const errorData = {
                        type: exports.ErrorType.API_ERROR,
                        message: `Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        resourceUrl: url,
                        stack: error instanceof Error ? error.stack : undefined
                    };
                    // 上报网络错误数据
                    this.reportError(errorData);
                    // 添加网络错误面包屑记录
                    this.monitor.addBreadcrumb({
                        timestamp: Date.now(),
                        type: exports.DataType.ERROR,
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
            XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
                // 在xhr实例上存储请求信息
                this._monitor_url = url.toString();
                this._monitor_method = method;
                this._monitor_startTime = Date.now();
                // 调用原始open方法
                return self.originalXHROpen.call(this, method, url, async !== null && async !== void 0 ? async : true, user, password);
            };
            XMLHttpRequest.prototype.send = function (body) {
                const xhr = this;
                const url = xhr._monitor_url;
                const method = xhr._monitor_method;
                const startTime = xhr._monitor_startTime;
                // 定义网络错误处理函数
                const onError = () => {
                    const errorData = {
                        type: exports.ErrorType.API_ERROR,
                        message: `XMLHttpRequest Error: ${method} ${url}`,
                        resourceUrl: url,
                        statusCode: xhr.status
                    };
                    // 使用闭包保存的self引用上报错误
                    self.reportError(errorData);
                    // 添加面包屑记录
                    self.monitor.addBreadcrumb({
                        timestamp: Date.now(),
                        type: exports.DataType.ERROR,
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
                        const errorData = {
                            type: exports.ErrorType.API_ERROR,
                            message: `API Error: ${xhr.status} ${xhr.statusText}`,
                            resourceUrl: url,
                            statusCode: xhr.status
                        };
                        // 上报API错误
                        self.reportError(errorData);
                        // 添加面包屑记录
                        self.monitor.addBreadcrumb({
                            timestamp: Date.now(),
                            type: exports.DataType.ERROR,
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
        reportError(errorData) {
            // 通过监控器上报错误数据
            this.monitor.report({
                type: exports.DataType.ERROR,
                data: errorData
            });
        }
        /**
         * 上报自定义错误
         * 允许用户手动上报自定义的错误信息
         * @param message 错误消息
         * @param extra 额外的错误信息和上下文数据
         */
        reportCustomError(message, extra) {
            // 构建自定义错误数据对象
            const errorData = {
                type: exports.ErrorType.CUSTOM_ERROR,
                message,
                stack: new Error().stack, // 生成当前调用栈
                ...extra // 合并额外信息
            };
            // 上报自定义错误
            this.reportError(errorData);
            // 添加自定义错误面包屑记录
            this.monitor.addBreadcrumb({
                timestamp: Date.now(),
                type: exports.DataType.ERROR,
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
        destroy() {
            // 恢复原始的fetch方法
            window.fetch = this.originalFetch;
            // 恢复原始的XMLHttpRequest方法
            XMLHttpRequest.prototype.open = this.originalXHROpen;
            XMLHttpRequest.prototype.send = this.originalXHRSend;
            // 注意：实际应用中还应该移除error和unhandledrejection事件监听器
        }
    }

    /**
     * 用户行为监控类
     * 负责收集和监控用户在页面上的各种交互行为，包括点击、输入、滚动、路由变化等
     */
    class BehaviorMonitor {
        /**
         * 构造函数
         * @param monitor 监控器实例
         */
        constructor(monitor) {
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
        init() {
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
        trackPageView() {
            // 构建页面访问行为数据
            const behaviorData = {
                type: exports.BehaviorType.PAGE_VIEW,
                url: this.currentUrl
            };
            // 上报页面访问行为
            this.reportBehavior(behaviorData);
            // 添加页面访问面包屑记录
            this.monitor.addBreadcrumb({
                timestamp: Date.now(),
                type: exports.DataType.BEHAVIOR,
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
        trackClicks() {
            // 监听全局点击事件，使用捕获阶段以捕获更多点击
            document.addEventListener('click', (event) => {
                const target = event.target;
                if (!target)
                    return;
                // 构建点击行为数据
                const behaviorData = {
                    type: exports.BehaviorType.CLICK,
                    element: target.tagName, // 元素标签名
                    selector: getElementPath(target), // CSS选择器路径
                    text: getElementText(target) // 元素文本内容
                };
                // 上报点击行为数据
                this.reportBehavior(behaviorData);
                // 添加点击行为面包屑记录
                this.monitor.addBreadcrumb({
                    timestamp: Date.now(),
                    type: exports.DataType.BEHAVIOR,
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
        trackInputs() {
            // 使用防抖函数避免过于频繁的上报
            const handleInput = debounce((event) => {
                const target = event.target;
                // 过滤无效目标和密码输入框
                if (!target || target.type === 'password')
                    return;
                // 构建输入行为数据
                const behaviorData = {
                    type: exports.BehaviorType.INPUT,
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
                    type: exports.DataType.BEHAVIOR,
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
        trackScrolls() {
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
                        const behaviorData = {
                            type: exports.BehaviorType.SCROLL,
                            text: `${scrollDepth}%` // 滚动深度百分比
                        };
                        // 上报滚动行为数据
                        this.reportBehavior(behaviorData);
                        // 添加滚动行为面包屑记录
                        this.monitor.addBreadcrumb({
                            timestamp: Date.now(),
                            type: exports.DataType.BEHAVIOR,
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
        trackRouteChanges() {
            // 保存原始的History API方法引用
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;
            /**
             * 处理路由变化的通用函数
             * @param from 来源URL
             * @param to 目标URL
             */
            const handleRouteChange = (from, to) => {
                // 计算在前一个页面的停留时间
                const duration = Date.now() - this.startTime;
                // 构建路由变化行为数据
                const behaviorData = {
                    type: exports.BehaviorType.ROUTE_CHANGE,
                    from, // 来源页面
                    to, // 目标页面
                    duration // 在来源页面的停留时间
                };
                // 上报路由变化行为数据
                this.reportBehavior(behaviorData);
                // 添加路由变化面包屑记录
                this.monitor.addBreadcrumb({
                    timestamp: Date.now(),
                    type: exports.DataType.BEHAVIOR,
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
            history.pushState = function (_state, _title, _url) {
                const from = window.location.href;
                // 调用原始方法
                const result = originalPushState.apply(this, arguments);
                const to = window.location.href;
                // 检查URL是否发生变化
                if (from !== to) {
                    handleRouteChange(from, to);
                }
                return result;
            };
            // 拦截history.replaceState方法
            history.replaceState = function (_state, _title, _url) {
                const from = window.location.href;
                // 调用原始方法
                const result = originalReplaceState.apply(this, arguments);
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
        reportCustomBehavior(type, data) {
            // 构建完整的行为数据对象
            const behaviorData = {
                type: type,
                ...data // 合并用户提供的数据
            };
            // 上报自定义行为数据
            this.reportBehavior(behaviorData);
            // 添加自定义行为面包屑记录
            this.monitor.addBreadcrumb({
                timestamp: Date.now(),
                type: exports.DataType.BEHAVIOR,
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
        reportBehavior(data) {
            // 通过监控器上报行为数据
            this.monitor.report({
                type: exports.DataType.BEHAVIOR,
                data
            });
        }
        /**
         * 销毁行为监控器
         * 清理所有事件监听器和恢复被修改的原生方法
         */
        destroy() {
            // 清理事件监听器等资源
            // 注意：实际实现中需要：
            // 1. 保存对事件监听器的引用以便清理
            // 2. 恢复被修改的history.pushState和replaceState方法
            // 3. 移除所有添加的事件监听器
        }
    }

    /**
     * Vue框架集成插件
     * 为Vue 2.x和Vue 3.x应用提供错误监控和上报功能
     */
    const VuePlugin = {
        /** 插件名称 */
        name: 'vue',
        /**
         * 安装Vue插件
         * 自动检测Vue版本并设置相应的错误处理器
         * @param monitor 监控器实例
         */
        install(monitor) {
            // Vue 2.x 错误处理集成
            if (typeof window !== 'undefined' && window.Vue) {
                const Vue = window.Vue;
                /**
                 * 设置Vue 2.x的全局错误处理器
                 * @param error 错误对象
                 * @param vm Vue组件实例
                 * @param info 错讯信息，说明错误的来源
                 */
                Vue.config.errorHandler = (error, vm, info) => {
                    var _a, _b;
                    // 构建Vue错误数据对象
                    const errorData = {
                        type: exports.ErrorType.JS_ERROR,
                        message: error.message,
                        stack: error.stack,
                        source: `Vue ${info}`, // 标记为Vue错误
                        filename: ((_a = vm === null || vm === void 0 ? void 0 : vm.$options) === null || _a === void 0 ? void 0 : _a.__file) || 'Vue Component' // 组件文件名
                    };
                    // 上报Vue错误数据
                    monitor.report({
                        type: exports.DataType.ERROR,
                        data: errorData
                    });
                    // 添加Vue错误面包屑记录，方便问题复现
                    monitor.addBreadcrumb({
                        timestamp: Date.now(),
                        type: exports.DataType.ERROR,
                        category: 'vue',
                        message: `Vue Error: ${error.message}`,
                        level: 'error',
                        data: {
                            info, // Vue错误信息
                            component: ((_b = vm === null || vm === void 0 ? void 0 : vm.$options) === null || _b === void 0 ? void 0 : _b.name) || 'Anonymous Component' // 组件名称
                        }
                    });
                };
            }
            // Vue 3.x 错误处理集成
            if (typeof window !== 'undefined' && window.Vue && window.Vue.version && window.Vue.version.startsWith('3')) {
                const Vue = window.Vue;
                // 创建Vue 3应用实例用于设置错误处理器
                const app = Vue.createApp({});
                /**
                 * 设置Vue 3.x的全局错误处理器
                 * @param error 错误对象
                 * @param instance Vue 3组件实例
                 * @param info 错误信息，说明错误的来源
                 */
                app.config.errorHandler = (error, instance, info) => {
                    var _a, _b;
                    // 构建Vue 3错误数据对象
                    const errorData = {
                        type: exports.ErrorType.JS_ERROR,
                        message: error.message,
                        stack: error.stack,
                        source: `Vue3 ${info}`, // 标记为Vue 3错误
                        filename: ((_a = instance === null || instance === void 0 ? void 0 : instance.$options) === null || _a === void 0 ? void 0 : _a.__file) || 'Vue3 Component' // 组件文件名
                    };
                    // 上报Vue 3错误数据
                    monitor.report({
                        type: exports.DataType.ERROR,
                        data: errorData
                    });
                    // 添加Vue 3错误面包屑记录
                    monitor.addBreadcrumb({
                        timestamp: Date.now(),
                        type: exports.DataType.ERROR,
                        category: 'vue3',
                        message: `Vue3 Error: ${error.message}`,
                        level: 'error',
                        data: {
                            info, // Vue 3错误信息
                            component: ((_b = instance === null || instance === void 0 ? void 0 : instance.type) === null || _b === void 0 ? void 0 : _b.name) || 'Anonymous Component' // Vue 3组件名称
                        }
                    });
                };
            }
        }
    };

    /**
     * React框架集成插件
     * 为React应用提供错误监控和上报功能，支持类组件的ErrorBoundary和React 18+的可恢复错误
     */
    const ReactPlugin = {
        /** 插件名称 */
        name: 'react',
        /**
         * 安装React插件
         * 拦截React的createElement和createRoot方法来集成错误监控
         * @param monitor 监控器实例
         */
        install(monitor) {
            // React ErrorBoundary 集成 - 为类组件提供错误捕获
            if (typeof window !== 'undefined' && window.React) {
                // 保存原始的createElement方法
                const originalCreateElement = window.React.createElement;
                /**
                 * 拦截React.createElement方法
                 * 为类组件自动添加错误边界处理逻辑
                 */
                window.React.createElement = function (type, _props, ..._children) {
                    // 检查是否为React类组件
                    if (typeof type === 'function' && type.prototype && type.prototype.isReactComponent) {
                        // 保存原始的componentDidCatch方法
                        const originalComponentDidCatch = type.prototype.componentDidCatch;
                        /**
                         * 重写componentDidCatch方法来捕获组件错误
                         * @param error 错误对象
                         * @param errorInfo React提供的错误信息，包含组件栈
                         */
                        type.prototype.componentDidCatch = function (error, errorInfo) {
                            // 构建React错误数据对象
                            const errorData = {
                                type: exports.ErrorType.JS_ERROR,
                                message: error.message,
                                stack: error.stack,
                                source: 'React Component', // 标记为React组件错误
                                filename: errorInfo.componentStack // 使用组件栈作为文件名
                            };
                            // 上报React组件错误
                            monitor.report({
                                type: exports.DataType.ERROR,
                                data: errorData
                            });
                            // 添加React错误面包屑记录
                            monitor.addBreadcrumb({
                                timestamp: Date.now(),
                                type: exports.DataType.ERROR,
                                category: 'react',
                                message: `React Error: ${error.message}`,
                                level: 'error',
                                data: {
                                    componentStack: errorInfo.componentStack, // React组件调用栈
                                    component: type.name || 'Anonymous Component' // 组件名称
                                }
                            });
                            // 调用原始的componentDidCatch方法（如果存在）
                            if (originalComponentDidCatch) {
                                originalComponentDidCatch.call(this, error, errorInfo);
                            }
                        };
                    }
                    // 调用原始的createElement方法
                    return originalCreateElement.apply(this, arguments);
                };
            }
            // React 18+ 可恢复错误处理集成
            if (typeof window !== 'undefined' && window.ReactDOM && window.ReactDOM.createRoot) {
                // 保存原始的createRoot方法
                const originalCreateRoot = window.ReactDOM.createRoot;
                /**
                 * 拦截React 18的createRoot方法
                 * 添加可恢复错误的监控功能
                 */
                window.ReactDOM.createRoot = function (container, options = {}) {
                    // 增强的配置选项，添加错误处理器
                    const enhancedOptions = {
                        ...options,
                        /**
                         * React 18可恢复错误处理器
                         * 处理React在渲染过程中可以恢复的错误
                         * @param error 错误对象
                         * @param errorInfo 错误信息和上下文
                         */
                        onRecoverableError: (error, errorInfo) => {
                            // 构建React可恢复错误数据对象
                            const errorData = {
                                type: exports.ErrorType.JS_ERROR,
                                message: error.message,
                                stack: error.stack,
                                source: 'React Recoverable Error' // 标记为可恢复错误
                            };
                            // 上报React可恢复错误
                            monitor.report({
                                type: exports.DataType.ERROR,
                                data: errorData
                            });
                            // 添加可恢复错误面包屑记录（级別为警告）
                            monitor.addBreadcrumb({
                                timestamp: Date.now(),
                                type: exports.DataType.ERROR,
                                category: 'react',
                                message: `React Recoverable Error: ${error.message}`,
                                level: 'warning', // 可恢复错误使用warning级別
                                data: errorInfo
                            });
                            // 调用用户提供的原始错误处理器（如果存在）
                            if (options.onRecoverableError) {
                                options.onRecoverableError(error, errorInfo);
                            }
                        }
                    };
                    // 调用原始的createRoot方法，传入增强的配置
                    return originalCreateRoot.call(this, container, enhancedOptions);
                };
            }
        }
    };

    /**
     * Web监控SDK主类
     * 前端性能监控、错误监控和用户行为分析的统一入口
     * 提供完整的数据收集、处理和上报功能
     */
    class WebMonitorSDK {
        /**
         * 构造函数
         * 创建SDK实例并根据配置启动相应的监控模块
         * @param config 监控配置对象
         */
        constructor(config) {
            /** SDK是否已初始化的标志 */
            this.isInitialized = false;
            // 防止机器人和爬虫初始化SDK，避免产生无效数据
            if (isBot()) {
                // 创建一个空的monitor实例以避免类型错误
                this.monitor = {};
                return;
            }
            // 创建核心监控器实例
            this.monitor = new Monitor(config);
            // 初始化所有监控模块
            this.init();
            // 将SDK实例挂载到全局对象，方便调试和插件访问
            window.__webMonitorSDK = this;
        }
        /**
         * 初始化SDK
         * 根据配置启动相应的监控模块，确保只初始化一次
         */
        init() {
            // 防止重复初始化
            if (this.isInitialized) {
                console.warn('WebMonitorSDK already initialized');
                return;
            }
            try {
                // 根据配置决定是否启用性能监控模块
                if (this.monitor['config'].enablePerformance) {
                    this.performanceMonitor = new PerformanceMonitor(this.monitor);
                }
                // 根据配置决定是否启用错误监控模块
                if (this.monitor['config'].enableError) {
                    this.errorMonitor = new ErrorMonitor(this.monitor);
                }
                // 根据配置决定是否启用用户行为监控模块
                if (this.monitor['config'].enableBehavior) {
                    this.behaviorMonitor = new BehaviorMonitor(this.monitor);
                }
                // 标记初始化完成
                this.isInitialized = true;
                // 在调试模式下输出初始化成功日志
                if (this.monitor.isDebug) {
                    console.log('WebMonitorSDK initialized successfully');
                }
            }
            catch (error) {
                // 处理初始化过程中的错误
                console.error('Failed to initialize WebMonitorSDK:', error);
            }
        }
        /**
         * 手动上报自定义错误
         * 允许开发者主动上报业务逻辑中发现的异常情况
         * @param message 错误消息
         * @param extra 额外的错误信息和上下文数据
         */
        reportError(message, extra) {
            if (this.errorMonitor) {
                this.errorMonitor.reportCustomError(message, extra);
            }
        }
        /**
         * 手动上报自定义用户行为
         * 允许开发者记录特定的业务行为和用户操作
         * @param type 行为类型标识
         * @param data 行为相关的数据
         */
        reportBehavior(type, data) {
            if (this.behaviorMonitor) {
                this.behaviorMonitor.reportCustomBehavior(type, data);
            }
        }
        /**
         * 手动上报任意监控数据
         * 通用的数据上报接口，支持上报任何类型的监控数据
         * @param data 要上报的数据，不需要包含公共字段（会自动添加）
         */
        report(data) {
            this.monitor.report(data);
        }
        /**
         * 安装插件
         * 使用插件来扩展SDK的功能，支持链式调用
         * @param plugin 插件实例
         * @returns SDK实例，支持链式调用
         */
        use(plugin) {
            this.monitor.use(plugin);
            return this;
        }
        /**
         * 卸载插件
         * 移除指定名称的插件，支持链式调用
         * @param pluginName 插件名称
         * @returns SDK实例，支持链式调用
         */
        unuse(pluginName) {
            this.monitor.unuse(pluginName);
            return this;
        }
        /**
         * 设置用户信息
         * 关联特定用户的监控数据，便于问题定位和用户行为分析
         * @param userId 用户唯一标识符
         * @param userInfo 用户的额外信息（如姓名、邮箱等）
         */
        setUser(userId, userInfo) {
            // 设置用户ID到监控器中
            this.monitor['userId'] = userId;
            // 添加用户设置的面包屑记录
            this.monitor.addBreadcrumb({
                timestamp: Date.now(),
                type: 'behavior',
                category: 'user',
                message: `User set: ${userId}`,
                level: 'info',
                data: userInfo
            });
        }
        /**
         * 设置标签
         * 为监控数据添加标签，便于分类和筛选
         * @param key 标签键
         * @param value 标签值
         */
        setTag(key, value) {
            // 初始化tags对象（如果不存在）
            if (!this.monitor.tags) {
                this.monitor.tags = {};
            }
            // 设置标签键值对
            this.monitor.tags[key] = value;
        }
        /**
         * 设置上下文信息
         * 为监控数据添加上下文信息，提供更丰富的环境数据
         * @param key 上下文键
         * @param value 上下文值
         */
        setContext(key, value) {
            // 初始化contexts对象（如果不存在）
            if (!this.monitor.contexts) {
                this.monitor.contexts = {};
            }
            // 设置上下文键值对
            this.monitor.contexts[key] = value;
        }
        /**
         * 销毁SDK实例
         * 清理所有监控模块和资源，移除事件监听器，释放内存
         */
        destroy() {
            var _a, _b, _c;
            // 检查是否已初始化
            if (!this.isInitialized) {
                return;
            }
            // 销毁所有监控模块
            (_a = this.performanceMonitor) === null || _a === void 0 ? void 0 : _a.destroy();
            (_b = this.errorMonitor) === null || _b === void 0 ? void 0 : _b.destroy();
            (_c = this.behaviorMonitor) === null || _c === void 0 ? void 0 : _c.destroy();
            // 销毁核心监控器
            this.monitor.destroy();
            // 重置初始化状态
            this.isInitialized = false;
            // 从全局对象中移除SDK实例
            delete window.__webMonitorSDK;
            // 在调试模式下输出销毁日志
            if (this.monitor.isDebug) {
                console.log('WebMonitorSDK destroyed');
            }
        }
        /**
         * 获取当前的SDK配置
         * @returns 配置对象，包含所有配置项
         */
        getConfig() {
            return this.monitor['config'];
        }
        /**
         * 获取当前会话ID
         * 会话ID用于关联同一次访问中的所有事件
         * @returns 当前会话的唯一标识符
         */
        getSessionId() {
            return this.monitor.currentSessionId;
        }
        /**
         * 获取当前用户ID
         * @returns 当前用户的唯一标识符
         */
        getUserId() {
            return this.monitor.currentUserId;
        }
    }
    /**
     * 创建WebMonitorSDK实例的工厂函数
     * 提供一种更函数式的创建方式
     * @param config 监控配置对象
     * @returns WebMonitorSDK实例
     */
    function createWebMonitorSDK(config) {
        return new WebMonitorSDK(config);
    }

    exports.ReactPlugin = ReactPlugin;
    exports.VuePlugin = VuePlugin;
    exports.WebMonitorSDK = WebMonitorSDK;
    exports.createWebMonitorSDK = createWebMonitorSDK;
    exports.default = WebMonitorSDK;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=web-monitor-sdk.dev.js.map
