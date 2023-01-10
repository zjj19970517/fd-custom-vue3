import { ReactiveEffect } from '@meils/vue-reactivity';
import { ShapeFlags } from '@meils/vue-shared';
import { createAppAPI, CreateAppFunction } from '../api/createApp';
import {
  ComponentInstance,
  createComponentInstance,
  setupComponent
} from './component/component';
import { renderComponent } from './component/componentRender';
import { VNode } from './vnode';

export interface RendererNode {
  [key: string]: any;
}

export type RendererElement = RendererNode;

export interface RendererOptions<
  HostNode = RendererNode,
  HostElement = RendererElement
> {
  // 处理 Props 的函数
  patchProp(el: HostElement, key: string, prevValue: any, nextValue: any): void;
  // 下面全是节点操作相关的方法
  insert(el: HostNode, parent: HostElement, anchor?: HostNode | null): void;
  remove(el: HostNode): void;
  createElement(type: string, isCustomizedBuiltIn?: string): HostElement;
  createText(text: string): HostNode;
  createComment(text: string): HostNode;
  setText(node: HostNode, text: string): void;
  setElementText(node: HostElement, text: string): void;
  parentNode(node: HostNode): HostElement | null;
  nextSibling(node: HostNode): HostNode | null;
  querySelector?(selector: string): HostElement | null;
  setScopeId?(el: HostElement, id: string): void;
  cloneNode?(node: HostNode): HostNode;
  insertStaticContent?(
    content: string,
    parent: HostElement,
    anchor: HostNode | null,
    isSVG: boolean,
    start?: HostNode | null,
    end?: HostNode | null
  ): [HostNode, HostNode];
}

export interface Renderer<HostElement = RendererElement> {
  createApp: CreateAppFunction<HostElement>;
}

/**
 * 创建一个 Renderer 渲染器
 * @param options 渲染器配置选项（操作 Props + 操作节点的方法）
 * 之所以要传入 RendererOptions，目的主要是为了实现与平台的低耦合
 */
export function createRenderer<
  HostNode = RendererNode,
  HostElement = RendererElement
>(options: RendererOptions<HostNode, HostElement>): Renderer<HostElement> {
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    setScopeId: hostSetScopeId,
    cloneNode: hostCloneNode,
    insertStaticContent: hostInsertStaticContent
  } = options;

  const setupRenderEffect = (
    instance: ComponentInstance,
    initialVNode: VNode,
    container: RendererElement,
    anchor: RendererNode | null = null
  ) => {
    const renderFn = () => {
      if (!instance.isMounted) {
        // 挂载组件
        // 渲染组件生成子树 vnode
        const subTree = (instance.subTree = renderComponent(instance));
        console.log(' 【 debug： render subTree 】 ', subTree);
        // 把子树 vnode 挂载到 container 中
        patch(null, subTree, container, null, instance);
        instance.isMounted = true;
      } else {
        // TODO: 更新组件
      }
    };
    instance.effect = new ReactiveEffect<any>(renderFn, () => {
      // 响应式状态更新
      // TODO: 需要异步执行
      update();
    });
    const update = (instance.update = () => instance.effect?.run());
    instance.update();
  };

  const mountComponent = (
    initialVNode: VNode,
    container: RendererElement,
    anchor: RendererNode | null = null,
    parentComponent: ComponentInstance | null = null
  ) => {
    // 第一步：创建组件实例
    const instance = createComponentInstance(initialVNode, parentComponent);

    // 第二步：组件初始化
    setupComponent(instance);

    // 第三步：设置并运行带副作用的渲染函数
    setupRenderEffect(instance, initialVNode, container, anchor);
  };

  // 处理组件类型节点
  const processComponent = (
    n1: VNode | null,
    n2: VNode,
    container: RendererElement,
    anchor: RendererNode | null = null,
    parentComponent: ComponentInstance | null = null
  ) => {
    if (n1 == null) {
      // 挂载组件
      mountComponent(n2, container, anchor, parentComponent);
    } else {
      // 更新组件
      // updateComponent(n1, n2);
    }
  };

  const patch = (
    n1: VNode | null,
    n2: VNode,
    container: RendererElement,
    anchor: RendererNode | null = null,
    parentComponent: ComponentInstance | null = null
  ) => {
    console.info('【 debug: exec patch 】', n1, n2, container);
    if (n1 === n2) {
      return;
    }
    const { type, shapeFlag } = n2;
    switch (type) {
      case 1:
        console.log('TODO');
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 元素节点
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          // 组件节点
          processComponent(n1, n2, container, anchor, parentComponent);
        } else {
          console.warn('Unimplemented type');
        }
    }
  };

  // 渲染虚拟 DOM 至 真实 DOM 内
  const render = (
    vnode: VNode,
    container: RendererElement | null,
    anchor: RendererNode | null = null,
    parentComponent: ComponentInstance | null = null
  ) => {
    if (!vnode) {
      if (container?._vnode) {
        // 卸载
        // unmount(container._vnode, null, null, true);
      }
    } else {
      // 挂载
      patch(
        container?._vnode || null,
        vnode,
        container!,
        anchor,
        parentComponent
      );
    }
    if (container) container._vnode = vnode;
  };

  return {
    createApp: createAppAPI(render)
  };
}
