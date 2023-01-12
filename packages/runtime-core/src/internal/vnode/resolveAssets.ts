import { camelize, capitalize } from '@meils/vue-shared';
import { currentInstance } from '../component/component';
import { currentRenderingInstance } from '../component/componentRenderContext';

export const COMPONENTS = 'components';
export const DIRECTIVES = 'directives';
export const FILTERS = 'filters';

export type AssetTypes = typeof COMPONENTS | typeof DIRECTIVES | typeof FILTERS;

/**
 * 获取某个组件
 * @param componentName 组件名
 * @returns
 */
export function resolveComponent(componentName: string): any {
  return resolveAsset(COMPONENTS, componentName);
}

export function resolveAsset(type: AssetTypes, name: string) {
  const instance = currentRenderingInstance || currentInstance;
  if (instance) {
    const Component = instance.type;
    // 先从组件选项的 options 中找
    // 再从 appContext 上下文找
    const result =
      resolve(Component[type], capitalize(camelize(name))) ||
      resolve((instance.appContext as any)[type], capitalize(camelize(name)));

    return result;
  } else {
    console.warn('component instance is undefined');
  }
}

function resolve(registry: Record<string, any> | undefined, name: string) {
  return (
    registry &&
    (registry[name] ||
      registry[camelize(name)] ||
      registry[capitalize(camelize(name))])
  );
}
