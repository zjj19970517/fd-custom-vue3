/**
 * 封装 DOM 操作
 */

import { RendererOptions } from '@meils/vue-runtime-core';

export const nodeOps: Omit<RendererOptions<Node, Element>, 'patchProp'> = {
  // 创建元素
  createElement(tag: string, is?: string) {
    return document.createElement(tag, is ? { is } : undefined);
  },
  // 创建文本节点
  createText: (text: string) => document.createTextNode(text),
  // 创建注释
  createComment: (text: string) => document.createComment(text),
  // 插入节点
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null);
  },
  // 移除节点
  remove: child => {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },
  // 设置文本节点
  setText: (node, text) => {
    node.nodeValue = text;
  },
  // 设置元素中的文本内容
  setElementText: (el, text) => {
    el.textContent = text;
  },
  // 获取父节点
  parentNode: node => node.parentNode as Element | null,
  // 获取兄弟节点
  nextSibling: node => node.nextSibling,
  // 传入选择器，获取对应的节点
  querySelector: selector => document.querySelector(selector),
  // 设置元素的作用域
  setScopeId(el, id) {
    el.setAttribute(id, '');
  },
  // 克隆节点
  cloneNode(el) {
    const cloned = el.cloneNode(true);
    return cloned;
  }
};
