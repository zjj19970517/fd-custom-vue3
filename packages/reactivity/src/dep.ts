import { ReactiveEffect } from './effect';

type Dep = Set<ReactiveEffect>;

// 用于存储所有的 effect 对象

/**
 * 创建 Dep 对象，存储所有依赖
 * 依赖就是 ReactiveEffect
 * @param effects
 * @returns Set 集合
 */
export function createDep(effects: ReactiveEffect[] = []): Dep {
  const dep = new Set<ReactiveEffect>(effects || []);
  return dep;
}

export type { Dep };
