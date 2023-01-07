const hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * 对象上是否存在某个属性 key
 * @param val 目标对象
 * @param key key属性
 * @returns
 * 如果存在某属性，断言 key 的类型 keyof typeof val
 */
export const hasOwn = (
  val: object,
  key: string | symbol
): key is keyof typeof val => hasOwnProperty.call(val, key);
