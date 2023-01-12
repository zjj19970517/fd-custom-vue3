import {
  isReactive,
  isRef,
  ReactiveEffect,
  ReactiveFlags
} from '@meils/vue-reactivity';
import type { EffectScheduler } from '@meils/vue-reactivity/src/effect';
import {
  isArray,
  isFunction,
  isMap,
  isObject,
  isPlainObject,
  isSet,
  NOOP
} from '@meils/vue-shared';
import {
  queuePostFlushCb,
  queuePreFlushCb,
  SchedulerJob
} from '../internal/scheduler';

export type WatchCallback<V = any, OV = any> = (value: V, oldValue: OV) => any;

export type OnCleanup = (cleanupFn: () => void) => void;

export type WatchEffect = (onCleanup: OnCleanup) => void;

export interface WatchOptionsBase {
  flush?: 'pre' | 'post' | 'sync';
}

export interface WatchOptions extends WatchOptionsBase {
  immediate?: boolean;
  deep?: boolean;
}

export type WatchStopHandle = () => void;

export function watch(
  source: any,
  callback: ((value: any, oldValue: any, onCleanup: OnCleanup) => any) | null,
  options?: WatchOptions
): WatchStopHandle {
  return doWatch(
    source,
    callback,
    options
      ? Object.assign(
          {},
          { immediate: false, deep: false, flush: 'pre' },
          options
        )
      : { immediate: false, deep: false, flush: 'pre' }
  );
}

export function watchEffect(
  effect: WatchEffect,
  options?: WatchOptionsBase
): WatchStopHandle {
  return doWatch(effect, null, options);
}

export function watchPostEffect(effect: WatchEffect): WatchStopHandle {
  return doWatch(effect, null, { flush: 'post' } as WatchOptionsBase);
}

export function watchSyncEffect(effect: WatchEffect): WatchStopHandle {
  return doWatch(effect, null, { flush: 'sync' } as WatchOptionsBase);
}

export function doWatch(
  source: any,
  callback: ((value: any, oldValue: any, onCleanup: OnCleanup) => any) | null,
  { immediate, deep, flush }: WatchOptions = {}
) {
  let getter: () => any = NOOP; // 响应式数据访问函数
  let isMultiSource = false; // 是否有多个数据源
  if (isArray(source)) {
    getter = () =>
      source.map(s => {
        if (isRef(s)) {
          return s.value;
        } else if (isReactive(s)) {
          // 这里 traverse 会递归去获得 reactive 对象的所有键值
          return traverse(s);
        } else if (isFunction(s)) {
          return s();
        }
      });
    isMultiSource = true;
  } else if (isRef(source)) {
    getter = () => source.value;
  } else if (isReactive(source)) {
    getter = () => source;
    deep = true;
  } else if (isFunction(source)) {
    if (!!callback) {
      // 进入这里说明是 watch 而不是 watchEffect
      getter = () => source();
    } else {
      // 进入这里说明是 watchEffect 而不是 watch
      getter = () => {
        // 如果清理函数有，就调用清理函数，防止内存泄露
        if (cleanup) {
          cleanup();
        }
        // watchEffect 的唯一参数是清除副作用的方法
        return source(onCleanup);
      };
    }
  } else {
    console.warn('watch only support Ref、 Reactive');
  }

  if (!!callback && deep) {
    // deep 的保底处理
    const baseGetter = getter;
    getter = () => traverse(baseGetter());
  }

  let cleanup: () => void;
  // 提供一个清楚副作用的函数
  const onCleanup: OnCleanup = (fn: () => void) => {
    // effect.onStop 上可以绑定任何函数
    // effect.onStop 会在 effect 被 stop 时执行
    cleanup = effect.onStop = () => {
      fn();
    };
  };

  // 旧的值
  let oldValue = isMultiSource ? [] : {};

  // watch 监听的数据变化后，执行 job 方法
  // job 内的本质也是要调用 callback 的
  const job: SchedulerJob = () => {
    if (!effect.active) {
      // effect 已经被取消了，因此不需要在执行 callback
      return;
    }
    if (callback) {
      // effect.run() 实质也是在调用 getter
      // 获取新值，同时触发依赖收集
      const newValue = effect.run();

      // 新值和旧值不一样 || deep
      // 回调 callback
      if (
        deep ||
        (isMultiSource
          ? (newValue as any[]).some(
              (v, i) => !Object.is(v, (oldValue as any[])[i])
            )
          : !Object.is(newValue, oldValue))
      ) {
        // 深度处理
        try {
          // 如果清理函数有，就调用清理函数，防止内存泄露
          if (cleanup) {
            cleanup();
          }
          callback(newValue, oldValue, onCleanup);
          oldValue = newValue;
        } catch (e) {
          console.error('Failed to doWatch', e);
        }
      }
    } else {
      // watchEffect 的情况下
      // 再次执行第一个参数即可
      effect.run();
    }
  };

  let scheduler: EffectScheduler;
  if (flush === 'sync') {
    // 同步
    scheduler = job as any; // the scheduler function gets called directly
  } else if (flush === 'post') {
    // 后置
    scheduler = () => queuePostFlushCb(job);
  } else {
    // 默认是前置
    // default: 'pre'
    scheduler = () => queuePreFlushCb(job);
  }

  // 响应式副作用
  const effect = new ReactiveEffect(getter, scheduler);

  if (!!callback) {
    // watch
    if (immediate) {
      job(); // 立即执行，job 内部也会触发依赖收集的
    } else {
      // 这里一访问值，就会触发依赖收集
      oldValue = effect.run();
    }
  } else if (flush === 'post') {
    // watchEffect && flush == 'post'
    // post 的情况下，需要使用 queuePostFlushCb 来异步立即执行
    queuePostFlushCb(effect.run.bind(effect));
  } else {
    // watchEffect && sync | pre
    // 这里就是 watchEffect 会立即执行的原因
    // 这里执行会触发依赖收集
    effect.run();
  }

  // 返回一个停止侦听的函数
  return () => {
    effect.stop();
  };
}

export function traverse(value: unknown, seen?: Set<unknown>) {
  if (!isObject(value) || (value as any)[ReactiveFlags.SKIP]) {
    return value;
  }
  seen = seen || new Set();
  if (seen.has(value)) {
    return value;
  }
  seen.add(value);
  if (isRef(value)) {
    traverse(value.value, seen);
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], seen);
    }
  } else if (isSet(value) || isMap(value)) {
    value.forEach((v: any) => {
      traverse(v, seen);
    });
  } else if (isPlainObject(value)) {
    for (const key in value) {
      traverse((value as any)[key], seen);
    }
  }
  return value;
}
