/**
 * 属性操作
 * patchProp 在组件属性被修改时调用，主要让你针对不同属性，给 el 进行不同的操作
 */

import { RendererOptions } from '@meils/vue-runtime-core';
import { isOnEventName } from '@meils/vue-shared';

import { patchAttr } from './modules/attrs';
import { patchClass } from './modules/class';
import { patchEvent } from './modules/event';
import { patchStyle } from './modules/style';

export const patchProp: RendererOptions<Node, Element>['patchProp'] = (
  el, // DOM 元素
  key, // 要处理的属性 key
  prevValue,
  nextValue
) => {
  if (key === 'class') {
    // class
    patchClass(el, nextValue);
  } else if (key === 'style') {
    // style
    patchStyle(el, prevValue, nextValue);
  } else if (isOnEventName(key)) {
    // 事件处理 onClick
    patchEvent(el, key, prevValue, nextValue);
  } else {
    // attrs 属性
    patchAttr(el, key, nextValue);
  }
};
