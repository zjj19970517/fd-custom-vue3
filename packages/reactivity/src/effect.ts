import { isArray, isIntegerKey } from '@meils/vue-shared';
import { createDep, Dep } from './dep';
import { TrackOpTypes, TriggerOpTypes } from './types/operation';

export let shouldTrack = true; // 是否应该追踪依赖，默认是开启的
const trackStack: boolean[] = []; // 栈结构存储 shouldTrack 状态

export let activeEffect: ReactiveEffect | undefined | null = null; // 当前激活的副作用对象

const targetMap = new WeakMap<any, KeyToDepMap>();

export const ITERATE_KEY = Symbol('iterate');

type EffectScheduler = (...args: any[]) => any;

type KeyToDepMap = any;

interface ReactiveEffectRunner<T = any> {
  (): T;
  effect: ReactiveEffect;
}

interface ReactiveEffectOptions {
  lazy?: boolean;
  scheduler?: EffectScheduler;
}

// ========================================== track start ==========================================

/**
 * 暂停依赖追踪
 */
export function pauseTracking() {
  trackStack.push(shouldTrack);
  shouldTrack = false;
}

/**
 * 重置依赖追踪状态（或者也可以理解为是恢复上一个追踪状态 shouldTrack）
 */
export function resetTracking() {
  const last = trackStack.pop(); // 取出上次的 shouldTrack 值
  shouldTrack = last === undefined ? true : last;
}

/**
 * 开启对 target[key] 的依赖追踪(收集)
 * @param target
 * @param type
 * @param key
 */
export function track(
  target: object,
  type: TrackOpTypes,
  key: string | symbol
): void {
  // 依赖追踪的条件
  if (shouldTrack && activeEffect) {
    // 从 targetMap 中尝试获取 target 的 depsMap
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      // 未获取到便初始化
      // 之所以还使用 Map，是因为 target 对象的每一个属性都需要存储依赖
      depsMap = new Map();
      targetMap.set(target, depsMap);
    }

    // 获取 target[key] 的依赖
    let dep = depsMap.get(key);
    if (!dep) {
      // 未获取到值，则需要创建一个 Dep，同时设置到 depsMap 中
      dep = createDep([]);
      depsMap.set(key, dep);
    }

    // 正式依赖收集
    // 依赖收集的本质：触发属性的 get 后，将对应的 activeEffect 收集到该属性的 dep 中
    trackEffects(dep);
  }
}

/**
 * 依赖收集
 * @param dep 将 ActiveEffect 收集到该 dep 集中
 */
export function trackEffects(dep: Dep): void {
  // TODO: 依赖收集深度处理
  if (shouldTrack && dep) {
    // 依赖收集时候，互相记录关系
    // 方便后续的依赖清除优化
    dep.add(activeEffect!);
    activeEffect!.deps.push(dep);
  }
}

// ========================================== track end ==========================================

// ========================================== trigger start =======================================

/**
 * 触发更新
 * @param target
 * @param type 触发的操作类型 ADD | DELETE | SET
 * @param key
 * @param newValue
 * @param oldValue
 * @returns
 */
export function trigger(target: object, type: TriggerOpTypes, key?: unknown) {
  const depsMap = targetMap.get(target);

  if (!depsMap) {
    return;
  }

  // 首先声明一个 deps 数组，收集需要通知的所有依赖
  const deps: (Dep | undefined)[] = []; //
  if (isArray(target) && key === 'length') {
    // 数组处理
  }

  if (key !== void 0) {
    deps.push(depsMap.get(key));
  }

  // 针对不同的操作类型，做一些补充逻辑处理
  switch (type) {
    case TriggerOpTypes.ADD:
      if (isArray(target) && isIntegerKey(key)) {
        // 数组中新增属性
        // 添加 length 属性的依赖
        deps.push(depsMap.get('length'));
      } else {
        deps.push(depsMap.get(ITERATE_KEY));
      }
      break;
    case TriggerOpTypes.DELETE:
      if (!isArray(target)) {
        deps.push(depsMap.get(ITERATE_KEY));
      }
      break;
    case TriggerOpTypes.SET:
      break;
  }

  const effects: ReactiveEffect[] = [];
  for (const dep of deps) {
    if (dep) {
      effects.push(...dep);
    }
  }

  // 正式触发依赖的更新
  triggerEffects(createDep(effects));
}

export function triggerEffects(dep: Dep) {
  for (const effect of dep) {
    if (effect.computed) {
      triggerEffect(effect);
    }
  }
  for (const effect of dep) {
    if (!effect.computed) {
      triggerEffect(effect);
    }
  }
}

export function triggerEffect(effect: ReactiveEffect) {
  if (effect.scheduler) {
    effect.scheduler();
  } else {
    effect.run();
  }
}

// ========================================== trigger end =======================================

// ========================================== ReactiveEffect start =======================================

/**
 * 响应式副作用对象
 * 在Vue3中这就是要收集的依赖对象
 */
export class ReactiveEffect<T = any> {
  active = true; // 暂时留着
  deps = [] as Dep[]; // 属性访问要收集依赖（将 ReactiveEffect 收集到 dep中），依赖同样也要记录它被哪些 dep 收集了
  parent: ReactiveEffect | undefined | null = null; // 上一个 ReactiveEffect 的实例

  computed = false; // 计算属性时使用

  constructor(
    public fn: () => T, // 触发 get 的函数
    public scheduler: EffectScheduler | null = null // 调度执行函数
  ) {}

  /**
   * 重点：设置 activeEffect = this -> 执行 fn 函数
   * @returns
   */
  run() {
    if (!this.active) {
      return this.fn();
    }
    // 缓存 上一次的 shouldTrack 值
    const lastShouldTrack = shouldTrack;
    try {
      this.parent = activeEffect;
      activeEffect = this as ReactiveEffect;
      shouldTrack = true;

      // TODO: 嵌套层级控制

      return this.fn();
    } catch (e) {
      console.error('Failed to ReactiveEffect.run', e);
      // 使用上面的缓存 恢复状态
      activeEffect = this.parent;
      shouldTrack = lastShouldTrack;
      this.parent = undefined;
    }
  }
}

// ========================================== ReactiveEffect end =========================================

/**
 * 当前正在依赖收集中
 * @returns
 */
export function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}

/**
 * effect 接收一个函数，将其处理成响应式副作用函数
 * @param getter
 * @param options 可选的参数
 * @returns
 */
export function effect<T = any>(
  getter: () => T,
  options?: ReactiveEffectOptions
) {
  const _effect = new ReactiveEffect(getter);

  // 将传递的选项，合并到 _effect 对象里
  if (options) {
    Object.assign(_effect, options);
  }

  // 不传递 options 或 设置options.lazy为false 的情况下，立即执行 run
  if (!options || !options.lazy) {
    _effect.run();
  }

  // 把 _effect.run 这个方法返回
  // 可外部执行
  const runner = _effect.run.bind(_effect) as ReactiveEffectRunner;
  runner.effect = _effect;
  return runner;
}

export type {
  EffectScheduler,
  KeyToDepMap,
  ReactiveEffectRunner,
  ReactiveEffectOptions
};
