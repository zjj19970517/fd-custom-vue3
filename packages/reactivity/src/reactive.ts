import { isObject } from '@meils/vue-shared';

import {
  collectionHandler,
  readonlyCollectionHandler,
  shallowCollectionHandler
} from './handler/collectionHandler';
import {
  commonHandler,
  readonlyCommonHandler,
  shallowCommonHandler
} from './handler/commonHandler';
import { ReactiveFlags, Target, TargetType } from './types/common';
import { getTargetType } from './utils';

export const reactiveCacheMap = new WeakMap<Target, any>(); // reactive 响应缓存集
export const readonlyCacheMap = new WeakMap<Target, any>(); // readonly 缓存集
export const shallowReactiveCacheMap = new WeakMap<Target, any>();
export const shallowReadonlyCacheMap = new WeakMap<Target, any>();
export const shallowCacheMap = new WeakMap<Target, any>();

/**
 * 响应式处理
 * @param target
 * @returns
 */
export function reactive(target: object) {
  /**
    reactive 接受一个 readonly 代理对象时，直接返回
    const proxy1 = readonly({});
    const proxy2 = reactive(proxy1);
    console.log(proxy1 === proxy2); // true
   */
  if (isReadonly(target)) {
    return target;
  }

  return createReactiveObject(
    target, // arr、obj、map、set 这几种类型
    false /* isReadonly */,
    commonHandler, // arr、obj 适用于这个
    collectionHandler, // map、set 适用于这个
    reactiveCacheMap
  );
}

/**
 * 创建只读
 * @param target
 * @returns
 */
export function readonly(target: object) {
  return createReactiveObject(
    target,
    true /* isReadonly */,
    readonlyCommonHandler,
    readonlyCollectionHandler,
    readonlyCacheMap
  );
}

/**
 * 浅响应式对象
 * @param target
 * @returns
 */
export function shallowReactive<T extends object>(target: T) {
  return createReactiveObject(
    target,
    false /* isReadonly */,
    shallowCommonHandler,
    shallowCollectionHandler,
    shallowCacheMap
  );
}

/**
 * 校验是否为只读对象（也就是判断是否为 readonly() 处理后的对象）
 * @param value
 * @returns
 */
export function isReadonly(value: unknown): boolean {
  return !!(value && (value as Target)[ReactiveFlags.IS_READONLY]);
}

/**
 * 判断是否已经代理过
 * @param value
 * @returns
 */
export function isProxy(value: unknown) {
  return isReactive(value) || isReadonly(value);
}

/**
 * 判断是否已经 reactive 处理过了，是响应式的
 * @param value
 * @returns
 */
export function isReactive(value: unknown) {
  return !!(value && (value as Target)[ReactiveFlags.IS_REACTIVE]);
}

/**
 * 处理一个响应式代理对象，返回其未被代理前的对象 target
 * @param observed
 * @returns
 */
export function toRaw(observed: any): any {
  // (observed as Target)[ReactiveFlags.RAW] 拿到的是这个代理对象原本的 target 对象，当然也可能是没有
  const raw = observed && observed[ReactiveFlags.RAW];
  // 为什么还要进行 toRaw 呢？
  // 主要用来处理 ：readonly(reactive({}))
  return raw ? toRaw(raw) : observed;
}

/**
 * 创建响应式对象
 * @param target 目标对象
 * @param isReadonly 是否为只读
 * @param baseHandlers
 * @param collectionHandlers
 * @param proxyMap
 * @returns
 */
function createReactiveObject(
  target: Target,
  isReadonly: boolean,
  baseHandler: ProxyHandler<any>,
  collectionHandler: ProxyHandler<any>,
  proxyMap: WeakMap<Target, any>
) {
  if (!isObject(target)) {
    console.warn('target must be a object');
    return target;
  }

  /**
   *  reactive 处理同一个对象，返回的仍旧是上次的代理后结果对象，原因是因为有缓存记录
      const obj1 = {};
      const proxy7 = reactive(obj1);
      const proxy8 = reactive(obj1);
      console.log(proxy7 === proxy8); // true
   */
  // 代理过后会有缓存记录，如果代理已经存在了，就直接返回
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }

  // 判断这个 target 对象能否被代理
  const targetType = getTargetType(target);
  if (targetType === TargetType.INVALID) {
    return target;
  }

  // 开始代理
  const proxy = new Proxy(
    target,
    // 代理使用的 handler
    // 公共 COMMON 类型使用 baseHandlers（处理 obj、array）
    // 集合 COLLECTION 类型 使用 collectionHandlers（处理 set、map）
    targetType === TargetType.COLLECTION ? collectionHandler : baseHandler
  );
  // 设置缓存
  proxyMap.set(target, proxy);
  // 返回代理对象
  return proxy;
}

/**
 * 标记一个对象，使得该对象不能被代理
 * @param value
 * @returns
 */
export function markRaw<T extends object>(
  value: T
): T & {
  __v_skip?: boolean;
} {
  Object.defineProperty(value, ReactiveFlags.SKIP, {
    configurable: true,
    enumerable: false,
    value
  });
  return value;
}
