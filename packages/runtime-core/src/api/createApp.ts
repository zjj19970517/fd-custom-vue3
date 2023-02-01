import { isFunction } from '@meils/vue-shared';
import { Data } from '../internal/component/component';
import {
  genAppConfig,
  AppConfig,
  createAppConfigHandler
} from '../internal/config';
import { createVNode } from '../internal/vnode';

export interface AppContext {
  app: App; // App 实例
  config: AppConfig;
  provides: Data;
  components: Data;
}

type PluginInstallFunction = (app: App, ...options: any[]) => any;

export type Plugin =
  | (PluginInstallFunction & { install?: PluginInstallFunction })
  | {
      install: PluginInstallFunction;
    };

export interface App<HostElement = any> {
  // _ 开头的属性是私有属性
  _uid: number; // App 实例的 唯一 ID
  _context: AppContext; // App 实例上下文
  _container: HostElement | null; // App应用挂载到的容器节点元素
  _props: Record<string, unknown> | null; // 给根组件实例传入的 props
  config: AppConfig; // 全局配置
  mount(rootContainer: HostElement | string): void; // 挂载函数
  unmount(): void; // 卸载函数
  provide: (key: string, val: any) => this;
  component(name: string, component: any): this;
  use(plugin: Plugin, ...options: any[]): this;
}

export type CreateAppFunction<HostElement> = (
  rootComponent: any,
  rootProps?: Record<string, unknown> | null
) => App<HostElement>;

let uid = 0;

export function createAppAPI<HostElement>(
  render: any
): CreateAppFunction<HostElement> {
  // 闭包函数
  // render 参数将会保留下来，createApp 之后还会使用到
  /**
   * 实际使用到的 CreateApp 方法
   * @param hostComponent 根组件实例
   * @param rootProps 根组件的 props
   * @returns
   */
  return function createApp(hostComponent: any, rootProps = null): App {
    // app 也有上下文对象
    const context = createAppContext();
    let isMounted = false; // 是否已经 Mount 挂载完毕
    const installedPlugins = new Set(); // 安装成功的插件集合
    const app: App = (context.app = {
      _context: context,
      _uid: uid++,
      _container: null,
      _props: rootProps,
      ...createAppConfigHandler(context), // app.config
      /**
       * 将 App 挂载到 rootContainer 内
       * @param rootContainer
       */
      mount(rootContainer: HostElement) {
        if (!isMounted) {
          const vnode = createVNode(hostComponent, rootProps);
          vnode.appContext = context;
          // 渲染组件 vnode 到宿主容器中
          render(vnode, rootContainer);
          app._container = rootContainer;
          isMounted = true;
        } else {
          console.warn('app has mounted');
        }
      },
      /**
       * 卸载 App 实例
       */
      unmount() {
        if (isMounted) {
          // 第一个参数为 null 表示卸载
          render(null, app._container);
          app._container = null;
        } else {
          console.warn('The app is not mounted yet');
        }
      },
      provide(key: string, value: any) {
        context.provides[key] = value;
        return app;
      },
      use(plugin, ...options) {
        if (installedPlugins.has(plugin)) {
          console.warn(`Plugin has been installed`);
        } else if (plugin && isFunction(plugin.install)) {
          installedPlugins.add(plugin);
          // 插件的第一个参数是 app，之后是配置选项
          plugin.install(app, ...options);
        } else if (isFunction(plugin)) {
          installedPlugins.add(plugin);
          // 插件的第一个参数是 app，之后是配置选项
          plugin(app, ...options);
        }
        return app;
      },
      component(name: string, component: any): any {
        context.components[name] = component;
        return app;
      }
    });

    return app;
  };
}

/**
 * 创建 App 上下文
 * @returns
 */
export function createAppContext(): AppContext {
  return {
    app: {} as App,
    config: genAppConfig(),
    provides: {},
    components: {}
  };
}
