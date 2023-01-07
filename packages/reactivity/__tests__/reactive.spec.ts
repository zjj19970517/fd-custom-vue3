import { isReactive, reactive } from '../src';
import { isProxy, isReadonly, markRaw, readonly, toRaw } from '../src/reactive';

describe('[reactivity/reactive]', () => {
  test('reactive basic test', () => {
    const obj = { foo: 1 };
    const observed = reactive(obj);
    const observed1 = reactive(obj);
    expect(observed).toBe(observed1);
    expect(observed).not.toBe(obj); // observed 和 obj 不相同
    expect(isReactive(observed)).toBe(true); // isReactive(observed) === true
    expect(isReactive(obj)).toBe(false); // isReactive(obj) === false
    expect(isProxy(observed)).toBe(true); // isProxy(obj) === true
    expect(isReadonly(observed)).toBe(false); // isReadonly(obj) === false

    // 测试 trap 功能是否正常
    expect(observed.foo).toBe(1); // 测试 get 的正常
    expect('foo' in observed).toBe(true); // 测试 has 的正常
    expect(Object.keys(observed)).toEqual(['foo']); // 测试 ownKeys 的正常
    expect(delete observed.foo); // 测试 delete 的正常
  });

  // reactive 深度处理
  test('nested reactive', () => {
    const obj = {
      first: {
        foo: 1
      },
      second: [{ bar: 2 }]
    };
    const observed = reactive(obj);
    expect(isReactive(observed.first)).toBe(true);
    expect(isReactive(observed.second)).toBe(true);
    expect(isReactive(observed.second[0])).toBe(true);
  });

  test('toRaw basic test', () => {
    const obj = { foo: 1 };
    const observed = reactive(obj);
    expect(toRaw(observed)).toBe(obj);
    expect(toRaw(obj)).toBe(obj);
  });

  test('readonly basic test', () => {
    const obj = {
      foo: 1,
      inner: {
        bar: 2
      }
    };
    const observed = reactive(obj);
    const proxy = readonly(observed);
    expect(isReadonly(proxy)).toBe(true);
    expect(isReadonly(proxy.inner)).toBe(true);

    const proxy1 = reactive(proxy);
    expect(proxy1).toBe(proxy);
  });

  test('markRaw', () => {
    const obj = reactive({
      foo: { a: 1 },
      bar: markRaw({ b: 2 })
    });
    expect(isReactive(obj.foo)).toBe(true);
    expect(isReactive(obj.bar)).toBe(false);
  });
});

export {};
