/**
 * runtime-dom 运行时 DOM 操作相关
 * 对应 web 端应用
 */

import { createRenderer, Renderer } from '@meils/vue-runtime-core';
import { isString } from '@meils/vue-shared';

import { nodeOps } from './nodeOps';
import { patchProp } from './patchProps';

let renderer: Renderer; // 缓存全局渲染器

// 渲染器选项（ DOM场景专用 ）
const rendererOptions = Object.assign({}, nodeOps, { patchProp });

// 确保 renderer
function ensureRenderer() {
  // 如果创建过一遍了，就不需要再创建了，直接复用全局的
  return renderer || (renderer = createRenderer(rendererOptions));
}

/**
 * 重写的 createApp
 * @param rootComponent 根组件实例
 * @param rootProps 根组件的 props 属性
 */
export const createApp = (
  rootComponent: any,
  rootProps: Record<string, unknown> | null = null
) => {
  // 获得 渲染器 renderer
  // 调用 renderer 的 createApp 方法获得 app 实例
  const app = ensureRenderer().createApp(rootComponent, rootProps);
  const { mount } = app;
  // 重写 mount
  app.mount = (containerOrSelector: Element | string) => {
    let container: Element | string | null = null;
    if (isString(containerOrSelector)) {
      container = document.querySelector(containerOrSelector);
    } else {
      container = containerOrSelector;
    }
    if (!container) return;
    // 先清空 container 容器
    container.innerHTML = '';
    mount(container);
  };
  return app;
};

export * from '@meils/vue-runtime-core';
