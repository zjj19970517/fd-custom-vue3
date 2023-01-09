import { isArray } from '@meils/vue-shared';
import { ComponentInstance } from './component';

export type NormalizedObjectEmitsOptions = Record<
  string, // 事件名
  ((...args: any[]) => any) | null // 处理函数
>;

/**
 * 标准化组件定义的 emits 选项
 * @param type 组件选项 options
 * @returns
 */
export function normalizeEmitsOptions(type: any) {
  const rawEmits = type.emits;
  const normalized: NormalizedObjectEmitsOptions = {};

  // 只处理 emits 是数组类型的情况
  if (isArray(rawEmits)) {
    rawEmits.forEach(key => (normalized[key] = null));
  }

  return normalized;
}

export function emit(
  instance: ComponentInstance,
  event: string,
  ...rawArgs: any[]
) {
  console.log('emit', instance, event, rawArgs);
}
