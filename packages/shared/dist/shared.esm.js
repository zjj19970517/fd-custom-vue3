// packages/shared/src/types.ts
var isObject = (val) => val !== null && typeof val === "object";
var isString = (val) => typeof val === "string";
var isSymbol = (val) => typeof val === "symbol";
var isArray = Array.isArray;
var isIntegerKey = (key) => isString(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
var isFunction = (val) => typeof val === "function";
var toTypeString = (value) => Object.prototype.toString.call(value);
var toRawTypeString = (value) => {
  return toTypeString(value).slice(8, -1);
};

// packages/shared/src/prototype.ts
var hasOwnProperty = Object.prototype.hasOwnProperty;
var hasOwn = (val, key) => hasOwnProperty.call(val, key);

// packages/shared/src/basic.ts
function def(obj, key, value) {
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    value
  });
}
var NOOP = () => {
};
export {
  NOOP,
  def,
  hasOwn,
  isArray,
  isFunction,
  isIntegerKey,
  isObject,
  isString,
  isSymbol,
  toRawTypeString,
  toTypeString
};
//# sourceMappingURL=shared.esm.js.map
