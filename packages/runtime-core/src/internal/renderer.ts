import { ReactiveEffect } from '@meils/vue-reactivity';
import { EMPTY_OBJ, PatchFlags, ShapeFlags } from '@meils/vue-shared';
import { createAppAPI, CreateAppFunction } from '../api/createApp';
import {
  ComponentInstance,
  createComponentInstance,
  setupComponent
} from './component/component';
import { isReservedProp } from './component/componentProps';
import { renderComponent } from './component/componentRender';
import { Fragment, normalizeVNode, VNode } from './vnode';

export interface RendererNode {
  [key: string]: any;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RendererElement extends RendererNode {}

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
        const prevTree = instance.subTree;
        const subTree = (instance.subTree = renderComponent(instance));
        if (prevTree) {
          const container = prevTree.el as any;
          patch(
            prevTree,
            subTree,
            hostParentNode(container) as any,
            null,
            instance
          );
        }
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
      console.log('更新组件');
      // 更新组件
      // updateComponent(n1, n2);
    }
  };

  const mountChildren = (
    children: any[],
    container: RendererElement,
    anchor: RendererNode | null,
    parentComponent: ComponentInstance | null
  ) => {
    for (let i = 0; i < children.length; i++) {
      const child = normalizeVNode(children[i]);
      patch(null, child, container, anchor, parentComponent);
    }
  };

  const mountElement = (
    vnode: VNode,
    container: RendererElement,
    anchor: RendererNode | null = null,
    parentComponent: ComponentInstance | null = null
  ) => {
    const { shapeFlag, props, type } = vnode;
    // 创建 element
    const el: any = (vnode.el = hostCreateElement(type) as any);
    if (props) {
      // 处理 props，比如 class、style、event 等属性
      for (const key in props) {
        if (!isReservedProp(key)) {
          hostPatchProp(el, key, null, props[key]);
        }
      }
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 处理子节点是纯文本的情况
      hostSetElementText(el, vnode.children as string);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 处理子节点是数组的情况
      mountChildren(vnode.children, el, null, parentComponent);
    }
    // 把创建的 DOM 元素节点挂载到 container 上
    hostInsert(el, container as any, anchor as any);
  };

  const patchProps = (
    el: any,
    oldProps: Record<string, unknown>,
    newProps: Record<string, unknown>
  ) => {
    // 遍历一遍新值
    for (const key in newProps) {
      const prevProp = oldProps[key];
      const nextProp = newProps[key];
      if (prevProp && nextProp) {
        // 新旧都有
        if (prevProp !== nextProp) {
          // 对比属性
          // 需要交给 host 来更新 key
          hostPatchProp(el, key, prevProp, nextProp);
        }
      } else if (nextProp) {
        // 新值有，旧值无
        hostPatchProp(el, key, null, nextProp);
      }
    }

    for (const key in oldProps) {
      // 遍历旧值，只处理前面没有处理的 key
      const prevProp = oldProps[key];
      const nextProp = newProps[key];
      if (!(key in newProps)) {
        hostPatchProp(el, key, prevProp, nextProp);
      }
    }
  };

  const updateElement = (
    n1: VNode,
    n2: VNode,
    container: RendererElement,
    anchor: RendererNode | null = null,
    parentComponent: ComponentInstance | null = null
  ) => {
    const { dynamicChildren } = n2;
    const el: any = (n2.el = n1.el);
    const oldProps = (n1 && n1.props) || EMPTY_OBJ; // 旧 Props
    const newProps = n2.props || EMPTY_OBJ; // 新 Props
    // 处理 props 的差异
    patchProps(el, oldProps, newProps);
    const optimized = !!dynamicChildren;
    // 处理 children 的差异
    if (optimized) {
      // 先处理稳定节点
      patchBlockChildren(
        n1.dynamicChildren!,
        dynamicChildren,
        el,
        parentComponent
      );
    } else {
      // 完整的 diff 逻辑
      patchChildren(n1, n2, el, anchor, parentComponent);
    }
  };

  const patchKeyedChildren = (
    c1: VNode[],
    c2: any[],
    container: RendererElement,
    parentAnchor: RendererNode | null,
    parentComponent: ComponentInstance | null
  ) => {
    // diff 的核心
  };

  const patchChildren = (
    n1: VNode,
    n2: VNode,
    container: RendererElement,
    anchor: RendererNode | null = null,
    parentComponent: ComponentInstance | null = null
  ) => {
    debugger;
    const { patchFlag, shapeFlag } = n2;
    const { shapeFlag: prevShapeFlag } = n2;
    if (patchFlag > 0) {
      if (patchFlag & PatchFlags.KEYED_FRAGMENT) {
        // Fragment 节点，children 有 key
        patchKeyedChildren(
          n1.children as any[],
          n2.children as any[],
          container,
          anchor,
          parentComponent
        );
        return;
      } else if (patchFlag & PatchFlags.UNKEYED_FRAGMENT) {
        // Fragment 节点，children 无 key
        return;
      }
    }
    // 对于一个元素的子节点 vnode 可能会有三种情况：纯文本、vnode 数组和空
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 新的节点为数组类型
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 数组 -> 数组
      } else if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 文本 -> 数组
      } else {
        // 空 -> 数组
      }
    } else if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 新的节点为文本类型
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 数组 -> 文本
      } else if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 文本 -> 文本
        if (n1.children !== n2.children) {
          console.log('文本更新', n2.children);
          hostSetElementText(container as any, n2.children);
        }
      } else {
        // 空 -> 文本
        hostSetElementText(container as any, n2.children);
      }
    } else {
      // 新的节点为空
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 数组 -> 空
      } else if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 文本 -> 空
        hostSetElementText(container as any, '');
      }
    }
  };

  const patchBlockChildren = (
    oldChildren: any[],
    newChildren: any[],
    fallbackContainer: RendererElement,
    parentComponent: ComponentInstance | null
  ) => {
    // 稳定的 Block，只需挨个遍历即可
    for (let i = 0; i < newChildren.length; i++) {
      const oldVNode = oldChildren[i];
      const newVNode = newChildren[i];
      const container =
        oldVNode && newVNode.type === Fragment
          ? hostParentNode(oldVNode.el)!
          : fallbackContainer;
      patch(oldVNode, newVNode, container, null, parentComponent);
    }
  };

  // 处理元素类型
  const processElement = (
    n1: VNode | null,
    n2: VNode,
    container: RendererElement,
    anchor: RendererNode | null = null,
    parentComponent: ComponentInstance | null = null
  ) => {
    if (n1 == null) {
      // 挂载组件
      mountElement(n2, container, anchor, parentComponent);
    } else {
      // 更新组件
      updateElement(n1, n2, container, anchor, parentComponent);
    }
  };

  const processText = (
    n1: VNode | null,
    n2: VNode,
    container: RendererElement,
    anchor: RendererNode | null = null
  ) => {
    if (n1 == null) {
      n2.el = hostCreateText(n2.children as string) as any;
      n2.el && hostInsert(n2.el as any, container as any, anchor as any);
    } else {
      if (n2.children !== n1.children) {
        hostSetText(n2.el as any, n2.children as string);
      }
    }
  };

  const processFragment = (
    n1: VNode | null,
    n2: VNode,
    container: RendererElement,
    anchor: RendererNode | null = null,
    parentComponent: ComponentInstance | null = null
  ) => {
    if (n1 == null) {
      // Fragment 节点的 el 属性，设置为一个空文本节点
      const fragmentStartAnchor = (n2.el = hostCreateText('')!);
      hostInsert(fragmentStartAnchor, container as any, anchor as any);
      mountChildren(n2.children, container, null, parentComponent);
    } else {
      debugger;
      // 更新 Fragment
      if (
        n2.patchFlag > 0 &&
        n2.patchFlag & PatchFlags.STABLE_FRAGMENT &&
        n2.dynamicChildren &&
        n1.dynamicChildren
      ) {
        // Fragment 是稳定的 Block
        patchBlockChildren(
          n1.dynamicChildren!,
          n2.dynamicChildren,
          n2.el!,
          parentComponent
        );
      } else {
        // 处理不稳定的 children
        patchChildren(n1, n2, container, anchor, parentComponent);
      }
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
      case Text:
        // 文本节点
        processText(n1, n2, container, anchor);
        break;
      case Fragment:
        // 处理 Fragment
        processFragment(n1, n2, container, anchor, parentComponent);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 元素节点
          processElement(n1, n2, container, anchor, parentComponent);
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
