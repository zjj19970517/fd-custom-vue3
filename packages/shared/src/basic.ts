/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-function */

// 往对象 obj 上定义某个属性
export function def(obj: object, key: string | symbol, value: any) {
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    value
  });
}

const cacheStringFunction = <T extends (str: string) => string>(fn: T): T => {
  const cache: Record<string, string> = Object.create(null);
  return ((str: string) => {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  }) as any;
};

export const NOOP = () => {};

const camelizeRE = /-(\w)/g;
/**
 * 连字符格式转驼峰
 */
export const camelize = cacheStringFunction((str: string): string => {
  return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''));
});

// 小驼峰转换为大驼峰
export const capitalize = cacheStringFunction(
  (str: string) => str.charAt(0).toUpperCase() + str.slice(1)
);

export const invokeArrayFns = (fns: Function[], arg?: any) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i](arg);
  }
};
