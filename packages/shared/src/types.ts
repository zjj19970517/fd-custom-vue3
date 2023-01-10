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

export const isMap = (val: unknown): val is Map<any, any> =>
  toTypeString(val) === '[object Map]';
export const isSet = (val: unknown): val is Set<any> =>
  toTypeString(val) === '[object Set]';

export const isPlainObject = (val: unknown): val is object =>
  toTypeString(val) === '[object Object]';

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

// on[EventName] 事件名（eg: onClick）
export const isOnEventName = (key: string) => /^on[A-Z]/.test(key);
