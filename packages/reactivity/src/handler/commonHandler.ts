import {
  hasOwn,
  isArray,
  isIntegerKey,
  isObject,
  isString
} from '@meils/vue-shared';
import { ITERATE_KEY, track, trigger } from '../effect';

import {
  reactive,
  reactiveCacheMap,
  readonly,
  readonlyCacheMap,
  shallowReactiveCacheMap,
  shallowReadonlyCacheMap,
  toRaw
} from '../reactive';
import { ReactiveFlags, Target } from '../types/common';
import { TrackOpTypes, TriggerOpTypes } from '../types/operation';

const get = /*#__PURE__*/ createGetter();
const set = /*#__PURE__*/ createSetter();
const readonlyGet = /*#__PURE__*/ createGetter(
  true /* isReadonly */,
  false /* shallow */
);

/**
 * 创建 get 代理方法
 * @param isReadonly
 * @param shallow
 * @returns
 */
function createGetter(isReadonly = false, shallow = false) {
  return function get(target: Target, key: string | symbol, receiver: object) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      // 获取 ReactiveFlags.IS_REACTIVE 属性
      // 利用的原理是闭包特性
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    } else if (key === ReactiveFlags.IS_SHALLOW) {
      return shallow;
    } else if (
      key === ReactiveFlags.RAW &&
      receiver ===
        (isReadonly
          ? shallow
            ? shallowReadonlyCacheMap
            : readonlyCacheMap
          : shallow
          ? shallowReactiveCacheMap
          : reactiveCacheMap
        ).get(target)
    ) {
      // const proxy = reactive(obj);
      // 可使用 proxy[ReactiveFlags.RAW] 获取 proxy 对象的原始 target 对象
      // 限制条件是 receiver 必须是 proxy 对象
      return target;
    }

    // TODO: 数组的 fix 处理

    // 使用 Reflect 反射取值
    const res = Reflect.get(target, key, receiver);

    // 某些特殊属性不需要依赖追踪处理（提升性能）
    // TODO: 排除 symbol 类型的 key
    if (isString(key) && isNonTrackableKeys(key)) {
      return res;
    }

    // 非只读的情况下才进行依赖收集
    if (!isReadonly) {
      // 依赖收集
      track(target, TrackOpTypes.GET, key);
    }

    // 浅处理直接返回，就不走后面的对象递归处理了
    if (shallow) {
      return res;
    }

    // 如果取值后返回值是对象，递归处理
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }

    return res;
  };
}

/**
 * 创建 set 代理函数
 * @returns
 */
function createSetter() {
  return function set(
    target: Target,
    key: string | symbol,
    value: unknown,
    receiver: object
  ) {
    // 取到旧的值
    const oldValue = (target as any)[key];
    const existingKey =
      isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key);

    const res = Reflect.set(target, key, value, receiver);
    if (target === toRaw(receiver)) {
      if (!existingKey) {
        // 不存在属性值，属于新增操作
        trigger(target, TriggerOpTypes.ADD, key);
      } else if (!Object.is(value, oldValue)) {
        // 新旧值不同，属性更新操作
        trigger(target, TriggerOpTypes.SET, key);
      }
    }
    return res;
  };
}

/**
 * 拦截删除操作
 * eg: delete obj.a 会触发
 * @param target
 * @param key
 * @returns
 */
function deleteProperty(target: object, key: string | symbol): boolean {
  const result = Reflect.deleteProperty(target, key);
  if (result) {
    // 删除成功，触发 trigger
    trigger(target, TriggerOpTypes.DELETE, key);
  }
  return result;
}

/**
 * 拦截 has trap
 * eg: "foo" in observed 会触发 has
 * @param target
 * @param key
 */
function has(target: object, key: string | symbol): boolean {
  const result = Reflect.has(target, key);
  // 依赖收集 track
  track(target, TrackOpTypes.HAS, key);
  return result;
}

/**
 * 拦截 ownKeys trap
 * eg: Object.keys(observed) 会触发 ownKeys
 * @param target
 * @param key
 */
function ownKeys(target: object) {
  const result = Reflect.ownKeys(target);
  // ownKeys 触发后，需要依赖收集
  // 数组的话，收集到 length 属性中
  // 其他类型，存储到 ITERATE_KEY 属性中

  // Q: 看到这里就能理解为什么要有 ITERATE_KEY 了？
  // 也就是说如果触发了对 key 的遍历，那么将依赖收集到 length 或 ITERATE_KEY 属性上
  // 之后如果内容有增减，只需要找 length 或 ITERATE_KEY 属性的依赖 Dep 就行
  track(target, TrackOpTypes.ITERATE, isArray(target) ? 'length' : ITERATE_KEY);
  return result;
}

// TargetType.COMMON 类型 + reactive 使用的 handler
export const commonHandler = {
  get, // 拦截 get trap
  set, // 拦截 set trap
  deleteProperty,
  has,
  ownKeys
};

// TargetType.COMMON 类型 + readonly 使用的 handler
export const readonlyCommonHandler = {
  get: readonlyGet,
  set(target: Target) {
    if (__DEV__) {
      console.warn('Failed to set : target is readonly', target);
    }
    return true;
  },
  deleteProperty(target: Target) {
    if (__DEV__) {
      console.warn('Failed to delete : target is readonly', target);
    }
    return true;
  }
  // Q: 为什么不需要 has 和 ownKeys 呢？
  // A: has 和 ownKeys 跟 get 类似，需要执行 track 依赖收集。但是因为 readonly 是不会二次进行更新的，因此这一步就没必要了。

  // Q: 为什么需要 get 呢？
  // A: 一些特殊属性值的访问，比如 ReactiveFlags.IS_REACTIVE 也是需要支持的。
};

/**
 * 判断 key 是否在不需要 track 的黑名单
 * @param key
 * @returns
 */
function isNonTrackableKeys(key: string) {
  return ['__proto__', '__v_isRef', '__isVue'].includes(key);
}
