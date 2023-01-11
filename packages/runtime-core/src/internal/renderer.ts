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
import { getSequence } from './getSequence';
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

  const isSameVNodeType = (n1: VNode, n2: VNode) => {
    return n1.type === n2.type && n1.key === n2.key;
  };

  const patchKeyedChildren = (
    c1: VNode[],
    c2: any[],
    container: RendererElement,
    parentAnchor: RendererNode | null,
    parentComponent: ComponentInstance | null
  ) => {
    // diff 的核心
    let i = 0;
    let e1 = c1.length - 1; // prev ending index
    let e2 = c2.length - 1; // next ending index
    // 第一步：左侧开始挨个遍历，处理相同节点
    // (a b) c
    // (a b) d e
    while (i <= e1 && i <= e2) {
      const prevChild = c1[i]; // prev value
      const nextChild = c2[i]; // next value
      if (isSameVNodeType(prevChild, nextChild)) {
        // 如果节点是相似节点，进行 patch 操作
        patch(prevChild, nextChild, container, parentAnchor, parentComponent);
      } else {
        break;
      }
      i++;
    }

    // 第二步：从右侧开始挨个遍历，处理相同节点
    // a (b c)
    // d e (b c)
    while (i <= e1 && i <= e2) {
      const prevChild = c1[e1];
      const nextChild = c2[e2];
      if (isSameVNodeType(prevChild, nextChild)) {
        // 如果节点是相似节点，进行 patch 操作
        patch(prevChild, nextChild, container, parentAnchor, parentComponent);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    // 为什么要从左侧和右侧开始处理相同节点呢？
    // 答：这种先从双端处理的做法，实际是想减少一次遍历的 O(n) 的 n 的大小。在前端场景中，很少有乱序的情况，一般都是插入和删除元素。因此这种做法会起到非常大的优化。

    // 第三步：对比完相同节点后，发现多了一些节点的情况
    // (a b)
    // (a b) c
    // i = 2, e1 = 1, e2 = 2
    // (a b)
    // d c (a b)
    // i = 0, e1 = -1, e2 = 1
    if (i > e1 && i <= e2) {
      const nextPos = e2 + 1;
      // 这里也要计算锚点，从而新增节点时可以准确插入
      const anchor = nextPos < c2.length ? c2[nextPos].el : parentAnchor;
      while (i <= e2) {
        // 新增节点
        patch(null, c2[i], container, anchor, parentComponent);
        i++;
      }
    }

    // 第四步：对比完相同节点后，发现少了一些节点的情况
    // (a b) c d
    // (a b)
    // i = 2, e1 = 3, e2 = 1
    // e a (b c)
    // (b c)
    // i = 0, e1 = 1, e2 = -1
    else if (i <= e1 && i > e2) {
      while (i <= e1) {
        // 删除节点
        hostRemove(c1[i].el as any);
        i++;
      }
    } else {
      // 第五步：未知序列，最复杂的情况了（中间可能存在新增、删除、位置变动）
      // a b [c d e] f g
      // a b [e c d] f g

      const s1 = i; // prev starting index
      const s2 = i; // next starting index

      // 5.1 为新的 children 构建 key:index 的 map 对象
      const keyToNewIndexMap = new Map();
      for (i = s2; i <= e2; i++) {
        // 遍历剩下的新的序列
        // 将新的序列存储到 Map 中
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
        // key 是 nextChild.key
        // value 是 索引 i
      }

      // 5.2 循环老的 children
      // 处理删除和更新的操作
      const needPatchCount = e2 - s2 + 1; // 需要做 patch 的总数
      let patched = 0; // 记录 patch 的数量
      const newIndexToOldIndex = new Array(needPatchCount).fill(0);
      let needMoved = false; // 是否需要移动操作
      let maxNewIndexSoFor = 0;
      // newIndexToOldIndex 这个数组存储的是新节点在老 children 中的 index 索引
      // 如果发现是 0 的话，那么就说明新值在老的里面不存在
      for (i = s1; i <= e1; i++) {
        const prevChild = c1[i];

        if (patched >= needPatchCount) {
          // 这是一步优化：判断如果新节点已经处理完毕，但是还在遍历老节点，那么这些老节点都删除即可
          hostRemove(prevChild.el as any);
        }
        let newIndex; // 这个索引表示遍历到的老节点，在新的 children 中的位置
        if (prevChild.key) {
          // 一般都会走到这里，可快速找到
          // 有 key 的情况下，可以使用 key 快速找到该节点在新的 children 中的位置
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          // 如果没有 key 的情况下，那么只能是遍历所有的新节点来找寻了
          for (let j = s2; j <= e2; j++) {
            if (isSameVNodeType(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }

        if (!newIndex) {
          // 遍历到的老节点，在新 children 中不存在
          // 删除节点
          hostRemove(prevChild.el as any);
        } else {
          if (newIndex >= maxNewIndexSoFor) {
            maxNewIndexSoFor = newIndex; // 记录上次的 new 位置
          } else {
            // 如果这一次的 newIndex 小于 上一次的 newIndex
            // 说明需要移动
            needMoved = true;
          }

          newIndexToOldIndex[newIndex - s2] = i + 1; // i + 1 是为了避免 0 的情况，因为默认值也是 0
          // 遍历到的老节点，在新 children 中存在
          // 更新节点
          patch(prevChild, c2[newIndex], container, null, parentComponent);
          patched++;
        }
      }

      // 利用最长递增子序列来优化移动逻辑
      // 这里主要是处理移动
      // needMoved 这个标识是为了优化 getSequence，只有需要移动的情况才去求最长递增子序列
      const increasingNewIndexSequence = needMoved
        ? getSequence(newIndexToOldIndex)
        : [];
      let j = increasingNewIndexSequence.length - 1;
      // 遍历剩下的需要处理的哪些节点
      for (i = needPatchCount - 1; i >= 0; i--) {
        // 从尾部开始处理，原因是因为这里我们要进行移动操作，使用的是 insertBefore，如果右侧的也是需要移动的元素，那么就会有问题，因此好的解决办法是，从右侧开始处理

        const nextIndex = s2 + i;
        const nextChild = c2[nextIndex];

        // 此时需要计算锚点，精准的插入到某个元素前面
        const anchor =
          nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : parentAnchor;

        if (newIndexToOldIndex[i] === 0) {
          // 此时说明老 children 中没有该节点，新增即可
          patch(null, nextChild, container, anchor, parentComponent);
        } else if (needMoved) {
          // 需要移动
          // j < 0 这里属于是优化手段
          if (j < 0 || increasingNewIndexSequence[j] !== i) {
            // 移动使用 insert 来完成
            hostInsert(nextChild.el, container as any, anchor as any);
          } else {
            j--;
          }
        }
      }
    }
  };

  const patchChildren = (
    n1: VNode,
    n2: VNode,
    container: RendererElement,
    anchor: RendererNode | null = null,
    parentComponent: ComponentInstance | null = null
  ) => {
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
        patchKeyedChildren(
          n1.children as VNode[],
          n2.children as any[],
          container,
          anchor,
          parentComponent
        );
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
