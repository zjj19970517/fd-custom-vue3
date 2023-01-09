import { NOOP } from '@meils/vue-shared';
import { createDep, Dep } from './dep';
import { ReactiveEffect } from './effect';
import { Ref, trackRefValue, triggerRefValue } from './ref';

export type ComputedGetter<T> = (...args: any[]) => T;
export type ComputedSetter<T> = (v: T) => void;

export interface WritableComputedOptions<T> {
  get: ComputedGetter<T>;
  set: ComputedSetter<T>;
}

export interface ComputedRef<T = any> extends Ref<T> {
  readonly value: T;
}

export function computed<T>(getter: ComputedGetter<T>): ComputedRef<T>;
export function computed<T>(
  options: WritableComputedOptions<T>
): ComputedRef<T>;
export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>
) {
  let getter: ComputedGetter<T>;
  let setter: ComputedSetter<T>;
  if (typeof getterOrOptions === 'function') {
    getter = getterOrOptions;
    setter = NOOP;
  } else {
    // 自定义 get、set
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  // 返回一个 ComputedRefImpl 实例对象
  const obj = new ComputedRefImpl(getter, setter) as any;
  return obj;
}

class ComputedRefImpl<T = any> {
  public dep?: Dep = createDep([]); // 每一个 computed 都有自己的 dep，用来收集依赖

  private _value!: T; // 记录 computed 的计算值

  public readonly __v_isRef = true; // 标记也是 Ref 类型

  public _dirty = true; // 脏标记，默认是 true，那么第一次访问肯定需要执行计算

  public readonly effect: ReactiveEffect<T>;

  constructor(
    getter: ComputedGetter<T>,
    private readonly _setter: ComputedSetter<T>
  ) {
    // 实例化一个响应式副作用对象
    // 用来实现：当 computed getter 依赖的某些响应式数据发生变化的时候，触发计算值的重新计算执行
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
        // computed 计算值更新
        // 因为 computed 也属于响应式值，因此也需要 trigger 触发依赖更新
        triggerRefValue(this);
      }
    });

    // 标志该 effect 是 computed 类型
    this.effect.computed = true;
    this.effect.active = true;
  }

  get value() {
    // 收集依赖
    trackRefValue(this);
    if (this._dirty) {
      // 如果已经脏了，需要重新计算
      this._dirty = false;
      this._value = this.effect.run()!;
    }
    return this._value;
  }

  set value(newValue: T) {
    this._setter(newValue);
  }
}
