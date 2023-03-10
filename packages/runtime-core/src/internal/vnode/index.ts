import { ReactiveFlags } from '@meils/vue-reactivity';
import {
  ShapeFlags,
  isString,
  isObject,
  isFunction,
  isArray
} from '@meils/vue-shared';

import { AppContext } from '../../api/createApp';
import { Component } from '../component/component';
import { RendererNode } from '../renderer';
import { blockStack, currentBlock } from './utils';

export type VNodeTypes = string | Component;

export const Text = Symbol('Text');
export const Fragment = Symbol('Fragment');

export interface VNode<HostNode = RendererNode> {
  __v_isVNode: true;
  [ReactiveFlags.SKIP]: true;
  type: VNodeTypes;
  props: Record<string, unknown> | null;
  key: string | null;
  children: any;
  component: any;
  el: HostNode | null;
  shapeFlag: number;
  patchFlag: number;
  appContext: AppContext | null;
  dynamicChildren: VNode[] | null;
  dynamicProps: string[] | null;
}

/**
 * 创建虚拟 DOM
 * @param type 节点类型
 * @param props 属性
 * @param children 子属性集
 */
export const createVNode = (
  type: VNodeTypes,
  props: Record<string, unknown> | null = null,
  children: unknown = null,
  patchFlag = 0,
  dynamicProps: string[] | null = null
) => {
  // 判断虚拟节点的 shapeFlag 标记
  // 或者说是 vnode 的类型
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : isFunction(type)
    ? ShapeFlags.FUNCTIONAL_COMPONENT
    : 0;
  return createBaseVNode(
    type,
    props,
    children,
    patchFlag,
    dynamicProps,
    shapeFlag
  );
};

export function createBaseVNode(
  type: VNodeTypes,
  props: Record<string, unknown> | null = null,
  children: unknown = null,
  patchFlag = 0,
  dynamicProps: string[] | null = null,
  shapeFlag = 0,
  isBlockNode = false // 是否为 Block 节点
) {
  const vnode: VNode = {
    __v_isVNode: true, // 标志是一个虚拟节点
    __v_skip: true, // 跳过响应式代理
    el: null, // 和真实 DOM 对应起来
    type,
    props,
    children,
    component: null, // 对应的组件
    key: props && (props.key as string),
    shapeFlag,
    patchFlag,
    appContext: null, // app 上下文对象
    dynamicChildren: null,
    dynamicProps
  };

  if (shapeFlag === 0) {
    // 判断虚拟节点的 shapeFlag 标记
    const shapeFlag = isString(type)
      ? ShapeFlags.ELEMENT
      : isObject(type)
      ? ShapeFlags.STATEFUL_COMPONENT
      : isFunction(type)
      ? ShapeFlags.FUNCTIONAL_COMPONENT
      : 0;
    vnode.shapeFlag = shapeFlag;
  }

  // 规范化 children
  // 更新 vnode.shapeFlag
  normalizeChildren(vnode, children);

  if (currentBlock && vnode.patchFlag > 0 && !isBlockNode) {
    // 收集 dynamicChildren
    currentBlock.push(vnode);
  }
  return vnode;
}

function normalizeChildren(vnode: VNode, children: unknown) {
  let type = 0;
  if (!children) {
    children = null;
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN;
  } else {
    type = ShapeFlags.TEXT_CHILDREN;
  }

  vnode.shapeFlag |= type; // 或 vnode.shapeFlag = vnode.shapeFlag | type
  vnode.children = children;
}

export function normalizeVNode(child: any): VNode {
  if (isString(child)) {
    return createVNode(Text, null, String(child));
  }
  return child as VNode;
  // 其他标准化处理，比如数组使用 Fragment 包裹 等
}
