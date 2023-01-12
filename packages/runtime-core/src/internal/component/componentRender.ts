import { ShapeFlags } from '@meils/vue-shared';
import { VNode } from '../vnode';
import { ComponentInstance, Data } from './component';
import { setCurrentRenderingInstance } from './componentRenderContext';

/**
 * 调用组件的 render 函数，渲染出组件的子树
 * @param instance
 * @returns VNode
 */
export function renderComponent(instance: ComponentInstance): VNode {
  const { vnode, render, proxy } = instance;
  const prev = setCurrentRenderingInstance(instance);
  let subTree: VNode;
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    // 有状态的组件
    subTree = render!.call(proxy, proxy);
  } else {
    // TODO: 函数式组件，暂时不支持
    subTree = {} as VNode;
  }

  setCurrentRenderingInstance(prev);
  return subTree;
}

export function shouldUpdateComponent(n1: VNode, n2: VNode) {
  const { props: prevProps } = n1;
  const { props: nextProps } = n2;

  if (prevProps === nextProps) {
    // 因为存在属性的静态提升，因此这种情况也是可能发生的
    return false;
  }

  if (!prevProps) {
    // 旧 props 不存在
    return nextProps ? true : false;
  } else if (!nextProps) {
    // 旧 props 存在，新 props 不存在
    return true;
  }

  const nextKeys = Object.keys(nextProps);
  const prevKeys = Object.keys(prevProps);
  if (prevKeys.length !== nextKeys.length) {
    return true;
  }

  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i];
    if (!prevProps[key]) {
      // 新增的属性，需要更新
      return true;
    }
    if (nextProps[key] !== prevProps[key]) {
      // 更新的属性
      return true;
    }
  }

  for (let i = 0; i < prevKeys.length; i++) {
    const key = prevKeys[i];
    if (!nextKeys[key as any]) {
      // 删除的属性，需要更新
      return true;
    }
  }

  return false;
}
