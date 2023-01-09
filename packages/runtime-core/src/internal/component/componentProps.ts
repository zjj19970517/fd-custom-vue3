import { shallowReactive } from '@meils/vue-reactivity';
import { camelize, hasOwn, isFunction, isObject } from '@meils/vue-shared';

import { ComponentInstance, Data } from './component';

type DefaultFactory<T> = (props: Data) => T | null | undefined;

export interface PropOptions<T = any, D = T> {
  // eslint-disable-next-line @typescript-eslint/ban-types
  type: PropType<T>;
  default?: D | DefaultFactory<D> | null | undefined | object;
}

export type PropType<T> = PropConstructor<T> | PropConstructor<T>[];

type PropConstructor<T = any> =
  // eslint-disable-next-line @typescript-eslint/ban-types
  { new (...args: any[]): T & {} } | { (): T } | PropMethod<T>;

type PropMethod<T, TConstructor = any> = [T] extends [
  ((...args: any) => any) | undefined
] // if is function with args, allowing non-required functions
  ? { new (): TConstructor; (): T; readonly prototype: TConstructor } // Create Function like constructor
  : never;

export type NormalizedProps = Record<string, PropOptions>;
export type NormalizedPropsOptions = [NormalizedProps, string[]] | [];

export function initProps(
  instance: ComponentInstance,
  isStateful: boolean,
  vnodeProps: Data | null = null
) {
  const props: Data = {};
  const attrs: Data = {};

  parseProps(instance, vnodeProps || {}, props, attrs);

  if (isStateful) {
    // props 是特殊的浅响应式对象
    instance.props = shallowReactive(props);
  } else {
    if (!instance.type.props) {
      // functional w/ optional props, props === attrs
      instance.props = attrs;
    } else {
      // functional w/ declared props
      instance.props = props;
    }
  }
  instance.attrs = attrs;
}

/**
 * 解析虚拟 DOM 节点中的 vnodeProps 属性
 * 将 vnodeProps 处理收集到 props、attars 中
 * @param instance
 * @param vnodeProps
 * @param props
 * @param attrs
 */
export function parseProps(
  instance: ComponentInstance,
  vnodeProps: Data,
  props: Data,
  attrs: Data
) {
  const [options, needCaseDefaultKeys] = instance.propsOptions;

  for (const key in vnodeProps) {
    const value = vnodeProps[key];
    const camelKey = camelize(key);
    if (isReservedProp(key)) {
      continue;
    }
    if (options && hasOwn(options, camelKey)) {
      // propsOptions 选项中有定义，交由 props 保存
      props[camelKey] = value;
    } else {
      // 非事件相关的，且不在 propsOptions 中定义的，交由 attrs 保存
      attrs[camelKey] = value;
    }
  }

  if (needCaseDefaultKeys && options) {
    let opt;
    needCaseDefaultKeys.forEach(key => {
      opt = options[key];
      if (isFunction(opt.default)) {
        props[key] = opt.default();
      } else {
        props[key] = opt.default;
      }
    });
  }
}

/**
 * 标准化组件定义的 props 选项
 * @param type 组件选项 options
 * @returns
 */
export function normalizePropsOptions(type: any) {
  const normalized: NormalizedPropsOptions[0] = {}; // 格式化后的 props 集合
  const needCaseDefaultKeys: NormalizedPropsOptions[1] = []; // 需要处理 default 的 key 集合

  // TODO: 还可以支持数组形式
  // 目前只处理 Object 类型的写法
  const rawPropsOptions = type.props;
  if (isObject(rawPropsOptions)) {
    for (const key in rawPropsOptions) {
      const normalizedKey = camelize(key);
      if (normalizedKey) {
        const opt = rawPropsOptions[key];
        normalized[normalizedKey] = opt;
        if (hasOwn(opt, 'default')) {
          needCaseDefaultKeys.push(normalizedKey);
        }
      }
    }
  }
  return [normalized, needCaseDefaultKeys] as NormalizedPropsOptions;
}

/**
 * 是否为保留的 key
 * @param propsKey
 * @returns
 */
export function isReservedProp(propsKey: string) {
  return ['key', 'ref'].includes(propsKey);
}
