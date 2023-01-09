import { isArray } from '@meils/vue-shared';
import { createDep, Dep } from './dep';
import {
  activeEffect,
  shouldTrack,
  trackEffects,
  triggerEffects
} from './effect';
import { toRaw } from './reactive';
import { toReactive } from './utils';

export interface Ref<T = any> {
  value: T;
  dep?: Dep;
}

export function ref(value: unknown) {
  return createRef(value);
}

export function shallowRef(value: unknown) {
  return createRef(value, true /* shallow */);
}

export function createRef(value: unknown, shallow = false) {
  // 已经被 ref 处理过了，就不需要二次处理了
  if (isRef(value)) {
    return value;
  }

  // 本质是返回一个 RefImpl 实例对象
  return new RefImpl(value, shallow);
}

/**
 * 辅助 Ref 的代理对象
 */
class RefImpl<T = unknown> {
  public dep?: Dep = createDep([]); // 收集到的依赖放置在 dep 中

  private _value: T; // 私有变量，保存内部真实的值
  private _rawValue: T; // 原始值

  private shallow = false;

  public readonly __v_isRef = true; // 特殊属性，标志该对象为 Ref 对象

  constructor(value: T, shallow = false) {
    this._rawValue = shallow ? value : toRaw(value); // 记录原始值
    // 如果 value 是 reactive 处理过后的，则通过 toRaw 取原始对象
    // eg: ref(reactive(obj)) ==> ref(obj)

    this._value = shallow ? value : toReactive(value); // 如果是对象，需要使用 reactive 处理
    // NOTE: shallow 开启后，主要针对 value 类型为 object 的情况
    // 此时不会对 value 做 reactive 处理

    this.shallow = shallow;
  }

  get value() {
    // 触发依赖追踪收集
    trackRefValue(this);
    return this._value;
  }

  set value(newVal) {
    if (!Object.is(this._rawValue, newVal)) {
      this._value = this.shallow ? newVal : toReactive(newVal);
      this._rawValue = newVal;
      // 触发依赖
      triggerRefValue(this);
    }
  }
}

/**
 * 追踪收集 Ref 的依赖
 * @param ref
 */
export function trackRefValue(ref: Ref) {
  if (shouldTrack && activeEffect) {
    trackEffects(ref.dep!);
  }
}

/**
 * 触发 Ref 的依赖更新
 * @param ref
 */
export function triggerRefValue(ref: Ref) {
  triggerEffects(ref.dep!);
}

/**
 * 判断一个对象时都为 Ref 对象
 * @param value
 * @returns
 */
export function isRef(value: unknown): value is Ref {
  return !!(value && (value as RefImpl).__v_isRef);
}

// triggerRef 可以跟 shallowRef 搭配使用
export function triggerRef(ref: Ref): void {
  triggerRefValue(ref);
}

// Eg:
// const shallow = shallowRef({
//   greet: 'Hello, world'
// })

// 这不会触发作用 (effect)，因为 ref 是浅层的
// 只有对 .value 重新赋值才会是响应式的
// shallow.value.greet = 'Hello, universe'

// 此时可以手动触发
// triggerRef(shallow)

/**
 * 接出 ref 的值
 * @param val
 * @returns
 */
export function unRef<T>(val: T | Ref<T>): T {
  return isRef(val) ? val.value : val;
}

/**
 * 为一个 reactive 对象的某个属性创建一个 ref
 * @param observed
 * @param key
 * @param defaultValue
 * @returns
 */
export function toRef<T extends object, K extends keyof T>(
  observed: T,
  key: K,
  defaultValue?: T[K]
): any {
  const val = observed[key];
  // 取值发现已经是 Ref，就没必要再继续处理了
  if (isRef(val)) {
    return val;
  }
  return new ObjectRefImpl<T, K>(observed, key, defaultValue);
}

// const fooRef = toRef(state, 'foo')
// fooRef.value++  ===> 这里实质是 state.foo++
// 本质：ref.value ===> 指向 observed[key]
export class ObjectRefImpl<T extends object, K extends keyof T> {
  public readonly __v_isRef = true; // 特殊属性，标志该对象为 Ref 对象
  constructor(
    private readonly _object: T,
    private readonly _key: K,
    private readonly _defaultValue?: T[K]
  ) {}

  get value() {
    const currVal = this._object[this._key];
    return !currVal ? this._defaultValue : currVal;
  }

  set value(newVal) {
    this._object[this._key] = newVal!;
  }
}

export function toRefs<T extends object>(object: T) {
  const ret: any = isArray(object) ? new Array(object.length) : {};
  for (const key in object) {
    ret[key] = toRef(object, key);
  }
  return ret;
}

const shallowUnwrapHandlers: ProxyHandler<any> = {
  // 判断是否为 ref，自动进行 .value 解构
  get: (target, key, receiver) => unRef(Reflect.get(target, key, receiver)),
  set: (target, key, value, receiver) => {
    const oldValue = target[key];
    if (isRef(oldValue) && !isRef(value)) {
      oldValue.value = value;
      return true;
    } else {
      return Reflect.set(target, key, value, receiver);
    }
  }
};

export function proxyRefs<T extends object>(objectWithRefs: T) {
  return new Proxy(objectWithRefs, shallowUnwrapHandlers);
}
