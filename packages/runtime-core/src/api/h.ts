import { createVNode, VNode } from '../internal/vnode';

export function h(type: any, propsOrChildren?: any, children?: any): VNode {
  return createVNode(type, propsOrChildren, children);
}
