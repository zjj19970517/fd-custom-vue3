import { ComponentInstance } from './component';

export let currentRenderingInstance: ComponentInstance | null = null; // 当前正在渲染的组件实例

/**
 * 设置当前正在渲染的组件实例
 * @param instance
 * @returns 返回的是上一个正在渲染的组件实例
 */
export function setCurrentRenderingInstance(
  instance: ComponentInstance | null
): ComponentInstance | null {
  const prev = currentRenderingInstance;
  currentRenderingInstance = instance;
  return prev;
}
