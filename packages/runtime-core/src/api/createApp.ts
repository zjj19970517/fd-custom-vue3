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
}

export interface App<HostElement = any> {
  // _ 开头的属性是私有属性
  _uid: number; // App 实例的 唯一 ID
  _context: AppContext; // App 实例上下文
  _container: HostElement | null; // App应用挂载到的容器节点元素
  _props: Record<string, unknown> | null; // 给根组件实例传入的 props
  config: AppConfig; // 全局配置
  mount(rootContainer: HostElement | string): void; // 挂载函数
  unmount(): void; // 卸载函数
  provide: (key: string, val: any) => App;
}

export type CreateAppFunction<HostElement> = (
  rootComponent: any,
  rootProps?: Record<string, unknown> | null
) => App<HostElement>;

let uid = 0;

export function createAppAPI<HostElement>(
  render: any
): CreateAppFunction<HostElement> {
  /**
   * 实际使用到的 CreateApp 方法
   * @param hostComponent 根组件实例
   * @param rootProps 根组件的 props
   * @returns
   */
  return function createApp(hostComponent: any, rootProps = null): App {
    const context = createAppContext();
    const isMounted = false; // 是否已经 Mount 挂载完毕
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
          render(vnode, rootContainer);
          app._container = rootContainer;
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
    provides: {}
  };
}
