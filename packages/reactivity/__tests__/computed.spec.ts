import { effect, reactive } from '../src';
import { computed } from '../src/computed';

describe('reactivity/computed', () => {
  it('should return updated value', () => {
    const value = reactive({ foo: 1 });
    const cValue = computed(() => value.foo);
    value.foo += 1;
    expect(cValue.value).toBe(2);
  });

  it('should compute lazily', () => {
    const value = reactive({ foo: 0 });
    const getter = vi.fn(() => value.foo);
    const cValue = computed(getter);

    // lazy
    // getter 还没有被调用
    expect(getter).not.toHaveBeenCalled();

    effect(() => {
      cValue.value;
    });

    expect(cValue.value).toBe(0);
    expect(getter).toHaveBeenCalledTimes(1); // 已经被调用过一次了

    // should not compute again
    cValue.value;
    expect(getter).toHaveBeenCalledTimes(1); // 此时没有被再次调用

    // should not compute until needed
    value.foo = 2;
    expect(getter).toHaveBeenCalledTimes(2);

    // now it should compute
    expect(cValue.value).toBe(2);
    expect(getter).toHaveBeenCalledTimes(2);

    // should not compute again
    cValue.value;
    expect(getter).toHaveBeenCalledTimes(2);
  });
});

export {};
