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

export type VNodeTypes = string | Component;

export const Text = Symbol('Text');

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
  patchFlag = 0
) => {
  // 判断虚拟节点的 shapeFlag 标记
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : isFunction(type)
    ? ShapeFlags.FUNCTIONAL_COMPONENT
    : 0;

  return createBaseVNode(type, props, children, patchFlag, shapeFlag);
};

function createBaseVNode(
  type: VNodeTypes,
  props: Record<string, unknown> | null = null,
  children: unknown = null,
  patchFlag = 0,
  shapeFlag = 0
) {
  const vnode = {
    __v_isVNode: true, // 标志是一个虚拟节点
    __v_skip: true, // 跳过响应式代理
    el: null, // 和真实 DOM 对应起来
    type,
    props,
    children,
    component: null, // 虚拟节点
    key: props && props.key,
    shapeFlag,
    patchFlag,
    appContext: null // app 上下文对象
  } as VNode;

  // 规范化 children
  normalizeChildren(vnode, children);
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
    console.log('1111');
  }

  vnode.shapeFlag |= type; // 或 vnode.shapeFlag = vnode.shapeFlag | type
  vnode.children = children;
}

export function createTextVNode(text = '', flag = 0): VNode {
  return createVNode(Text, null, text, flag);
}
