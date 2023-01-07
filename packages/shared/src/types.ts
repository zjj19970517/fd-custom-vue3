/**
 * 类型判断工具集
 */

export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object';

export const isString = (val: unknown): val is string =>
  typeof val === 'string';

export const isSymbol = (val: unknown): val is symbol =>
  typeof val === 'symbol';

export const isArray = Array.isArray;

// 是否为数值类型的 key
export const isIntegerKey = (key: unknown) =>
  isString(key) &&
  key !== 'NaN' &&
  key[0] !== '-' &&
  '' + parseInt(key, 10) === key;

// eslint-disable-next-line @typescript-eslint/ban-types
export const isFunction = (val: unknown): val is Function =>
  typeof val === 'function';

/**
 * 类型处理工具
 */

// Object.prototype.toString.call
export const toTypeString = (value: unknown): string =>
  Object.prototype.toString.call(value);

export const toRawTypeString = (value: unknown): string => {
  // [object RawType] => RawType
  return toTypeString(value).slice(8, -1);
};
