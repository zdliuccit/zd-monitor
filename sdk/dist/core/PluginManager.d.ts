import { Plugin } from '../types';
import { Monitor } from './Monitor';
/**
 * 插件管理器
 * 负责管理SDK的所有插件，包括安装、卸载、查询等功能
 */
export declare class PluginManager {
    /** 插件存储映射表，以插件名称为键 */
    private plugins;
    /** 监控器实例，用于传递给插件 */
    private monitor;
    /**
     * 构造函数
     * @param monitor 监控器实例
     */
    constructor(monitor: Monitor);
    /**
     * 安装插件
     * 将插件添加到管理器中并调用其安装方法
     * @param plugin 要安装的插件实例
     */
    install(plugin: Plugin): void;
    /**
     * 卸载插件
     * 从管理器中移除插件并调用其卸载方法
     * @param pluginName 要卸载的插件名称
     * @returns 卸载是否成功
     */
    uninstall(pluginName: string): boolean;
    /**
     * 获取指定名称的插件
     * @param name 插件名称
     * @returns 插件实例，不存在则返回undefined
     */
    getPlugin(name: string): Plugin | undefined;
    /**
     * 获取所有已安装的插件
     * @returns 插件实例数组
     */
    getAllPlugins(): Plugin[];
    /**
     * 检查是否安装了指定名称的插件
     * @param name 插件名称
     * @returns 是否存在该插件
     */
    hasPlugin(name: string): boolean;
    /**
     * 销毁插件管理器
     * 卸载所有插件并清理资源
     */
    destroy(): void;
}
