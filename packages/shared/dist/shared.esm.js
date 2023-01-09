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
var isOnEventName = (key) => /^on[A-Z]/.test(key);

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
var cacheStringFunction = (fn) => {
  const cache = /* @__PURE__ */ Object.create(null);
  return (str) => {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  };
};
var NOOP = () => {
};
var camelizeRE = /-(\w)/g;
var camelize = cacheStringFunction((str) => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : "");
});

// packages/shared/src/shapeFlag.ts
var ShapeFlags = /* @__PURE__ */ ((ShapeFlags2) => {
  ShapeFlags2[ShapeFlags2["ELEMENT"] = 1] = "ELEMENT";
  ShapeFlags2[ShapeFlags2["FUNCTIONAL_COMPONENT"] = 2] = "FUNCTIONAL_COMPONENT";
  ShapeFlags2[ShapeFlags2["STATEFUL_COMPONENT"] = 4] = "STATEFUL_COMPONENT";
  ShapeFlags2[ShapeFlags2["TEXT_CHILDREN"] = 8] = "TEXT_CHILDREN";
  ShapeFlags2[ShapeFlags2["ARRAY_CHILDREN"] = 16] = "ARRAY_CHILDREN";
  ShapeFlags2[ShapeFlags2["COMPONENT"] = 6] = "COMPONENT";
  return ShapeFlags2;
})(ShapeFlags || {});

// packages/shared/src/define.ts
var EMPTY_OBJ = {};
var EMPTY_ARRAY = [];
export {
  EMPTY_ARRAY,
  EMPTY_OBJ,
  NOOP,
  ShapeFlags,
  camelize,
  def,
  hasOwn,
  isArray,
  isFunction,
  isIntegerKey,
  isObject,
  isOnEventName,
  isString,
  isSymbol,
  toRawTypeString,
  toTypeString
};
//# sourceMappingURL=shared.esm.js.map
