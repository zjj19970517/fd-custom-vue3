/* eslint-disable @typescript-eslint/ban-types */
import { pauseTracking, resetTracking } from '@meils/vue-reactivity';
import {
  currentInstance,
  setCurrentInstance,
  unsetCurrentInstance
} from '../internal/component/component';

export const enum LifecycleHooks {
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
  BEFORE_UNMOUNT = 'bum',
  UNMOUNTED = 'um'
}

export function createHook(lifecycle: LifecycleHooks) {
  // hookCb 是回调函数
  return (hookCb: any) => {
    registerHook(lifecycle, hookCb);
  };
}

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT);
export const onMounted = createHook(LifecycleHooks.MOUNTED);
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE);
export const onUpdated = createHook(LifecycleHooks.UPDATED);
export const onBeforeUnmount = createHook(LifecycleHooks.BEFORE_UNMOUNT);
export const onUnmounted = createHook(LifecycleHooks.UNMOUNTED);

function registerHook(type: LifecycleHooks, hook: Function) {
  if (currentInstance) {
    const hooks = currentInstance[type] || (currentInstance[type] = []);
    const hookWrapper = (...args: unknown[]) => {
      pauseTracking();
      setCurrentInstance(currentInstance!);
      let result;
      try {
        result = hook(...args);
      } catch (e) {
        console.error('Failed to hookWrapper', e);
      }
      unsetCurrentInstance();
      resetTracking();
      return result;
    };
    hooks.push(hookWrapper);
  }
}
