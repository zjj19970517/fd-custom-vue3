"use strict";
(() => {
  // packages/shared/src/types.ts
  var isObject = (val) => val !== null && typeof val === "object";
  var isString = (val) => typeof val === "string";
  var isSymbol = (val) => typeof val === "symbol";
  var isArray = Array.isArray;
  var isIntegerKey = (key) => isString(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
  var toTypeString = (value) => Object.prototype.toString.call(value);
  var toRawTypeString = (value) => {
    return toTypeString(value).slice(8, -1);
  };

  // packages/shared/src/prototype.ts
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var hasOwn = (val, key) => hasOwnProperty.call(val, key);
})();
//# sourceMappingURL=shared.global.js.map
