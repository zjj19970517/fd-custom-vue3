import { reactive } from '../src';
import { effect } from '../src/effect';
import { isRef, ref, toRef, toRefs, unRef } from '../src/ref';

describe('reactivity/ref', () => {
  test('ref basic test', () => {
    // 基础值
    const a = ref(1);
    expect(a.value).toBe(1);
    a.value = 2;
    expect(a.value).toBe(2);
  });

  it('should be reactive', () => {
    const a = ref(1);
    let dummy;
    let calls = 0;
    effect(() => {
      calls++;
      dummy = a.value;
    });
    expect(calls).toBe(1);
    expect(dummy).toBe(1);
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
    // same value should not trigger
    a.value = 2;
    expect(calls).toBe(2);
  });

  it('should make nested properties reactive', () => {
    const a = ref({
      count: 1
    });
    let dummy;
    effect(() => {
      dummy = a.value.count;
    });
    expect(dummy).toBe(1);
    a.value.count = 2;
    expect(dummy).toBe(2);
  });

  it('should unwrap nested ref in types', () => {
    const a = ref(0);
    const b = ref(a);

    expect(typeof (b.value + 1)).toBe('number');
  });

  it('isRef', () => {
    const a = ref(1);
    const user = reactive({
      age: 1
    });
    expect(isRef(a)).toBe(true);
    expect(isRef(1)).toBe(false);
    expect(isRef(user)).toBe(false);
  });

  it('unRef', () => {
    const a = ref(1);
    expect(unRef(a)).toBe(1);
    expect(unRef(1)).toBe(1);
  });

  test('toRef', () => {
    const a = reactive({
      x: 1
    });
    const x = toRef(a, 'x');
    expect(isRef(x)).toBe(true);
    expect(x.value).toBe(1);

    // source -> proxy
    a.x = 2;
    expect(x.value).toBe(2);

    // proxy -> source
    x.value = 3;
    expect(a.x).toBe(3);

    // reactivity
    let dummyX;
    effect(() => {
      dummyX = x.value;
    });
    expect(dummyX).toBe(x.value);

    // mutating source should trigger effect using the proxy refs
    a.x = 4;
    expect(dummyX).toBe(4);

    // should keep ref
    const r = { x: ref(1) };
    expect(toRef(r, 'x')).toBe(r.x);
  });

  test('toRefs', () => {
    const a = reactive({
      x: 1,
      y: 2
    });

    const { x, y } = toRefs(a);

    expect(isRef(x)).toBe(true);
    expect(isRef(y)).toBe(true);
    expect(x.value).toBe(1);
    expect(y.value).toBe(2);
  });
});

export {};
