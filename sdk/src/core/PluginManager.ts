import { Plugin } from '../types';
import { Monitor } from './Monitor';

/**
 * 插件管理器
 * 负责管理SDK的所有插件，包括安装、卸载、查询等功能
 */
export class PluginManager {
  /** 插件存储映射表，以插件名称为键 */
  private plugins: Map<string, Plugin> = new Map();
  /** 监控器实例，用于传递给插件 */
  private monitor: Monitor;

  /**
   * 构造函数
   * @param monitor 监控器实例
   */
  constructor(monitor: Monitor) {
    this.monitor = monitor;
  }

  /**
   * 安装插件
   * 将插件添加到管理器中并调用其安装方法
   * @param plugin 要安装的插件实例
   */
  public install(plugin: Plugin): void {
    // 检查插件是否已经安装
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin ${plugin.name} already installed`);
      return;
    }

    try {
      // 调用插件的安装方法，传入监控器实例
      plugin.install(this.monitor);
      // 将插件添加到管理器中
      this.plugins.set(plugin.name, plugin);
      
      // 在调试模式下输出安装成功的日志
      if (this.monitor.isDebug) {
        console.log(`Plugin ${plugin.name} installed successfully`);
      }
    } catch (error) {
      // 处理插件安装失败的情况
      console.error(`Failed to install plugin ${plugin.name}:`, error);
    }
  }

  /**
   * 卸载插件
   * 从管理器中移除插件并调用其卸载方法
   * @param pluginName 要卸载的插件名称
   * @returns 卸载是否成功
   */
  public uninstall(pluginName: string): boolean {
    // 查找指定的插件
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      console.warn(`Plugin ${pluginName} not found`);
      return false;
    }

    try {
      // 如果插件提供了卸载方法，则调用它
      if (plugin.uninstall) {
        plugin.uninstall(this.monitor);
      }
      // 从管理器中移除插件
      this.plugins.delete(pluginName);
      
      // 在调试模式下输出卸载成功的日志
      if (this.monitor.isDebug) {
        console.log(`Plugin ${pluginName} uninstalled successfully`);
      }
      return true;
    } catch (error) {
      // 处理插件卸载失败的情况
      console.error(`Failed to uninstall plugin ${pluginName}:`, error);
      return false;
    }
  }

  /**
   * 获取指定名称的插件
   * @param name 插件名称
   * @returns 插件实例，不存在则返回undefined
   */
  public getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * 获取所有已安装的插件
   * @returns 插件实例数组
   */
  public getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 检查是否安装了指定名称的插件
   * @param name 插件名称
   * @returns 是否存在该插件
   */
  public hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * 销毁插件管理器
   * 卸载所有插件并清理资源
   */
  public destroy(): void {
    // 遍历所有插件进行卸载
    for (const [name, plugin] of this.plugins) {
      try {
        // 如果插件提供了卸载方法，则调用它
        if (plugin.uninstall) {
          plugin.uninstall(this.monitor);
        }
      } catch (error) {
        // 静默处理单个插件卸载失败，不影响其他插件
        console.error(`Error uninstalling plugin ${name}:`, error);
      }
    }
    // 清空所有插件
    this.plugins.clear();
  }
}