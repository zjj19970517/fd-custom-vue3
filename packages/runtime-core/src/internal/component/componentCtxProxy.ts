import { EMPTY_OBJ, hasOwn } from '@meils/vue-shared';

import { ComponentInstance } from './component';

export interface ComponentRenderContext {
  [key: string]: any;
  _: ComponentInstance;
}

export const PublicCtxProxyHandler: ProxyHandler<any> = {
  get({ _: instance }: ComponentRenderContext, key: string) {
    const { ctx, setupState, data, props, type, appContext } = instance;
    if (!isInnerKey(key)) {
      // 非内部属性
      if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
        return setupState[key];
      } else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
        return data[key];
      } else if (props && hasOwn(instance.propsOptions[0]!, key)) {
        return props[key];
      } else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
        return ctx[key];
      } else {
        console.warn('unknown key');
      }
    }

    if (isPublicProperties(key)) {
      // TODO: 暂不支持这些属性
    } else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
      // 用户自定义的属性，也用 `$` 开头
      return ctx[key];
    } else if (hasOwn(appContext.config.globalProperties, key)) {
      // 全局定义的属性
      return appContext.config.globalProperties[key];
    } else {
      console.warn('unknown key');
    }
  },
  set(
    { _: instance }: ComponentRenderContext,
    key: string,
    value: any
  ): boolean {
    const { data, setupState, ctx } = instance;
    if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
      setupState[key] = value;
      return true;
    } else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
      data[key] = value;
      return true;
    } else if (hasOwn(instance.props, key)) {
      __DEV__ && console.warn('Props are readonly.');
      return false;
    } else if (key[0] === '$') {
      // $ 开头的属性，
      __DEV__ &&
        console.warn('Properties starting with $ are reserved and readonly.');
      return false;
    } else {
      Object.defineProperty(ctx, key, {
        enumerable: true,
        configurable: true,
        value
      });
    }
    return true;
  }
};

export function isInnerKey(key: string) {
  return key[0] === '$';
}

export function isPublicProperties(key: string) {
  return [
    '$',
    '$el',
    'data',
    '$props',
    '$refs',
    '$parent',
    '$root',
    '$options',
    '$watch'
    // ...
  ].includes(key);
}
