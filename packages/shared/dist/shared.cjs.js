"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/shared/src/index.ts
var src_exports = {};
__export(src_exports, {
  hasOwn: () => hasOwn,
  isArray: () => isArray,
  isIntegerKey: () => isIntegerKey,
  isObject: () => isObject,
  isString: () => isString,
  isSymbol: () => isSymbol,
  toRawTypeString: () => toRawTypeString,
  toTypeString: () => toTypeString
});
module.exports = __toCommonJS(src_exports);

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  hasOwn,
  isArray,
  isIntegerKey,
  isObject,
  isString,
  isSymbol,
  toRawTypeString,
  toTypeString
});
//# sourceMappingURL=shared.cjs.js.map
