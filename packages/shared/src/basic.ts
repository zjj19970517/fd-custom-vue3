/* eslint-disable @typescript-eslint/no-empty-function */

export function def(obj: object, key: string | symbol, value: any) {
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    value
  });
}

export const NOOP = () => {};
