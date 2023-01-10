import { ShapeFlags } from '@meils/vue-shared';
import { VNode } from '../vnode';
import { ComponentInstance } from './component';
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
