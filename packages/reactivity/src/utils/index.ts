import { isObject, toRawTypeString } from '@meils/vue-shared';
import { reactive } from '../reactive';

import { ReactiveFlags, Target, TargetType } from '../types/common';

/**
 * 获取如下的类型对应的 TargetType
 * @param rawType Object | Array | Map | Set | WeakMap | WeakSet
 * @returns
 */
export function targetTypeMap(rawType: string) {
  switch (rawType) {
    case 'Object':
    case 'Array':
      return TargetType.COMMON;
    case 'Map':
    case 'Set':
    case 'WeakMap':
    case 'WeakSet':
      return TargetType.COLLECTION;
    default:
      return TargetType.INVALID;
  }
}

/**
 * 获取对象 target 的类型
 * @param value
 * @returns INVALID 无效 ｜ COMMON ｜ COLLECTION
 */
export function getTargetType(value: Target) {
  // 无效的条件：带有 __v_skip 属性 || 对象不可被扩展
  // 1. __v_skip 表示不可被代理，需要跳过
  // 2. !Object.isExtensible(value) 对象不可被扩展
  return value[ReactiveFlags.SKIP] || !Object.isExtensible(value)
    ? TargetType.INVALID
    : targetTypeMap(toRawTypeString(value));
}

export function toReactive<T = unknown>(value: T): T {
  return isObject(value) ? reactive(value) : value;
}
