// packages/reactivity/src/reactive.ts
import { isObject as isObject3 } from "@meils/vue-shared";

// packages/reactivity/src/handler/collectionHandler.ts
var collectionHandler = {};
var readonlyCollectionHandler = {};
var shallowCollectionHandler = {};

// packages/reactivity/src/handler/commonHandler.ts
import {
  hasOwn,
  isArray as isArray2,
  isIntegerKey as isIntegerKey2,
  isObject,
  isString
} from "@meils/vue-shared";

// packages/reactivity/src/effect.ts
import { isArray, isIntegerKey } from "@meils/vue-shared";

// packages/reactivity/src/dep.ts
function createDep(effects = []) {
  const dep = new Set(effects || []);
  return dep;
}

// packages/reactivity/src/types/operation.ts
var TrackOpTypes = /* @__PURE__ */ ((TrackOpTypes2) => {
  TrackOpTypes2["GET"] = "get";
  TrackOpTypes2["HAS"] = "has";
  TrackOpTypes2["ITERATE"] = "iterate";
  return TrackOpTypes2;
})(TrackOpTypes || {});
var TriggerOpTypes = /* @__PURE__ */ ((TriggerOpTypes2) => {
  TriggerOpTypes2["SET"] = "set";
  TriggerOpTypes2["ADD"] = "add";
  TriggerOpTypes2["DELETE"] = "delete";
  TriggerOpTypes2["CLEAR"] = "clear";
  return TriggerOpTypes2;
})(TriggerOpTypes || {});

// packages/reactivity/src/effect.ts
var shouldTrack = true;
var trackStack = [];
var activeEffect = null;
var targetMap = /* @__PURE__ */ new WeakMap();
var ITERATE_KEY = Symbol("iterate");
function pauseTracking() {
  trackStack.push(shouldTrack);
  shouldTrack = false;
}
function resetTracking() {
  const last = trackStack.pop();
  shouldTrack = last === void 0 ? true : last;
}
function track(target, type, key) {
  if (shouldTrack && activeEffect) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      depsMap = /* @__PURE__ */ new Map();
      targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
      dep = createDep([]);
      depsMap.set(key, dep);
    }
    trackEffects(dep);
  }
}
function trackEffects(dep) {
  if (shouldTrack && dep) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}
function trigger(target, type, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const deps = [];
  if (isArray(target) && key === "length") {
  }
  if (key !== void 0) {
    deps.push(depsMap.get(key));
  }
  switch (type) {
    case "add" /* ADD */:
      if (isArray(target) && isIntegerKey(key)) {
        deps.push(depsMap.get("length"));
      } else {
        deps.push(depsMap.get(ITERATE_KEY));
      }
      break;
    case "delete" /* DELETE */:
      if (!isArray(target)) {
        deps.push(depsMap.get(ITERATE_KEY));
      }
      break;
    case "set" /* SET */:
      break;
  }
  const effects = [];
  for (const dep of deps) {
    if (dep) {
      effects.push(...dep);
    }
  }
  triggerEffects(createDep(effects));
}
function triggerEffects(dep) {
  for (const effect2 of dep) {
    if (effect2.computed) {
      triggerEffect(effect2);
    }
  }
  for (const effect2 of dep) {
    if (!effect2.computed) {
      triggerEffect(effect2);
    }
  }
}
function triggerEffect(effect2) {
  if (effect2.scheduler) {
    effect2.scheduler();
  } else {
    effect2.run();
  }
}
var ReactiveEffect = class {
  // 计算属性时使用
  constructor(fn, scheduler = null) {
    this.fn = fn;
    this.scheduler = scheduler;
  }
  active = true;
  // 暂时留着
  deps = [];
  // 属性访问要收集依赖（将 ReactiveEffect 收集到 dep中），依赖同样也要记录它被哪些 dep 收集了
  parent = null;
  // 上一个 ReactiveEffect 的实例
  computed = false;
  /**
   * 重点：设置 activeEffect = this -> 执行 fn 函数
   * @returns
   */
  run() {
    if (!this.active) {
      return this.fn();
    }
    const lastShouldTrack = shouldTrack;
    try {
      this.parent = activeEffect;
      activeEffect = this;
      shouldTrack = true;
      return this.fn();
    } catch (e) {
      console.error("Failed to ReactiveEffect.run", e);
      activeEffect = this.parent;
      shouldTrack = lastShouldTrack;
      this.parent = void 0;
    }
  }
};
function effect(getter, options) {
  const _effect = new ReactiveEffect(getter);
  if (options) {
    Object.assign(_effect, options);
  }
  if (!options || !options.lazy) {
    _effect.run();
  }
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

// packages/reactivity/src/types/common.ts
var ReactiveFlags = /* @__PURE__ */ ((ReactiveFlags2) => {
  ReactiveFlags2["SKIP"] = "__v_skip";
  ReactiveFlags2["IS_REACTIVE"] = "__v_isReactive";
  ReactiveFlags2["IS_READONLY"] = "__v_isReadonly";
  ReactiveFlags2["IS_SHALLOW"] = "__v_isShallow";
  ReactiveFlags2["RAW"] = "__v_raw";
  return ReactiveFlags2;
})(ReactiveFlags || {});

// packages/reactivity/src/handler/commonHandler.ts
var get = /* @__PURE__ */ createGetter();
var set = /* @__PURE__ */ createSetter();
var readonlyGet = /* @__PURE__ */ createGetter(
  true,
  false
  /* shallow */
);
var shallowGet = /* @__PURE__ */ createGetter(
  false,
  true
  /* shallow */
);
function createGetter(isReadonly2 = false, shallow = false) {
  return function get2(target, key, receiver) {
    if (key === "__v_isReactive" /* IS_REACTIVE */) {
      return !isReadonly2;
    } else if (key === "__v_isReadonly" /* IS_READONLY */) {
      return isReadonly2;
    } else if (key === "__v_isShallow" /* IS_SHALLOW */) {
      return shallow;
    } else if (key === "__v_raw" /* RAW */ && receiver === (isReadonly2 ? shallow ? shallowReadonlyCacheMap : readonlyCacheMap : shallow ? shallowReactiveCacheMap : reactiveCacheMap).get(target)) {
      return target;
    }
    const res = Reflect.get(target, key, receiver);
    if (isString(key) && isNonTrackableKeys(key)) {
      return res;
    }
    if (!isReadonly2) {
      track(target, "get" /* GET */, key);
    }
    if (shallow) {
      return res;
    }
    if (isObject(res)) {
      return isReadonly2 ? readonly(res) : reactive(res);
    }
    return res;
  };
}
function createSetter() {
  return function set2(target, key, value, receiver) {
    const oldValue = target[key];
    const existingKey = isArray2(target) && isIntegerKey2(key) ? Number(key) < target.length : hasOwn(target, key);
    const res = Reflect.set(target, key, value, receiver);
    if (target === toRaw(receiver)) {
      if (!existingKey) {
        trigger(target, "add" /* ADD */, key);
      } else if (!Object.is(value, oldValue)) {
        trigger(target, "set" /* SET */, key);
      }
    }
    return res;
  };
}
function deleteProperty(target, key) {
  const result = Reflect.deleteProperty(target, key);
  if (result) {
    trigger(target, "delete" /* DELETE */, key);
  }
  return result;
}
function has(target, key) {
  const result = Reflect.has(target, key);
  track(target, "has" /* HAS */, key);
  return result;
}
function ownKeys(target) {
  const result = Reflect.ownKeys(target);
  track(target, "iterate" /* ITERATE */, isArray2(target) ? "length" : ITERATE_KEY);
  return result;
}
var commonHandler = {
  get,
  // 拦截 get trap
  set,
  // 拦截 set trap
  deleteProperty,
  has,
  ownKeys
};
var readonlyCommonHandler = {
  get: readonlyGet,
  set(target) {
    if (true) {
      console.warn("Failed to set : target is readonly", target);
    }
    return true;
  },
  deleteProperty(target) {
    if (true) {
      console.warn("Failed to delete : target is readonly", target);
    }
    return true;
  }
  // Q: 为什么不需要 has 和 ownKeys 呢？
  // A: has 和 ownKeys 跟 get 类似，需要执行 track 依赖收集。但是因为 readonly 是不会二次进行更新的，因此这一步就没必要了。
  // Q: 为什么需要 get 呢？
  // A: 一些特殊属性值的访问，比如 ReactiveFlags.IS_REACTIVE 也是需要支持的。
};
var shallowCommonHandler = Object.assign({}, commonHandler, {
  get: shallowGet
});
function isNonTrackableKeys(key) {
  return ["__proto__", "__v_isRef", "__isVue"].includes(key);
}

// packages/reactivity/src/utils/index.ts
import { isObject as isObject2, toRawTypeString } from "@meils/vue-shared";
function targetTypeMap(rawType) {
  switch (rawType) {
    case "Object":
    case "Array":
      return 1 /* COMMON */;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2 /* COLLECTION */;
    default:
      return 0 /* INVALID */;
  }
}
function getTargetType(value) {
  return value["__v_skip" /* SKIP */] || !Object.isExtensible(value) ? 0 /* INVALID */ : targetTypeMap(toRawTypeString(value));
}
function toReactive(value) {
  return isObject2(value) ? reactive(value) : value;
}

// packages/reactivity/src/reactive.ts
var reactiveCacheMap = /* @__PURE__ */ new WeakMap();
var readonlyCacheMap = /* @__PURE__ */ new WeakMap();
var shallowReactiveCacheMap = /* @__PURE__ */ new WeakMap();
var shallowReadonlyCacheMap = /* @__PURE__ */ new WeakMap();
var shallowCacheMap = /* @__PURE__ */ new WeakMap();
function reactive(target) {
  if (isReadonly(target)) {
    return target;
  }
  return createReactiveObject(
    target,
    // arr、obj、map、set 这几种类型
    false,
    commonHandler,
    // arr、obj 适用于这个
    collectionHandler,
    // map、set 适用于这个
    reactiveCacheMap
  );
}
function readonly(target) {
  return createReactiveObject(
    target,
    true,
    readonlyCommonHandler,
    readonlyCollectionHandler,
    readonlyCacheMap
  );
}
function shallowReactive(target) {
  return createReactiveObject(
    target,
    false,
    shallowCommonHandler,
    shallowCollectionHandler,
    shallowCacheMap
  );
}
function isReadonly(value) {
  return !!(value && value["__v_isReadonly" /* IS_READONLY */]);
}
function isProxy(value) {
  return isReactive(value) || isReadonly(value);
}
function isReactive(value) {
  return !!(value && value["__v_isReactive" /* IS_REACTIVE */]);
}
function toRaw(observed) {
  const raw = observed && observed["__v_raw" /* RAW */];
  return raw ? toRaw(raw) : observed;
}
function createReactiveObject(target, isReadonly2, baseHandler, collectionHandler2, proxyMap) {
  if (!isObject3(target)) {
    console.warn("target must be a object");
    return target;
  }
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  const targetType = getTargetType(target);
  if (targetType === 0 /* INVALID */) {
    return target;
  }
  const proxy = new Proxy(
    target,
    // 代理使用的 handler
    // 公共 COMMON 类型使用 baseHandlers（处理 obj、array）
    // 集合 COLLECTION 类型 使用 collectionHandlers（处理 set、map）
    targetType === 2 /* COLLECTION */ ? collectionHandler2 : baseHandler
  );
  proxyMap.set(target, proxy);
  return proxy;
}
function markRaw(value) {
  Object.defineProperty(value, "__v_skip" /* SKIP */, {
    configurable: true,
    enumerable: false,
    value
  });
  return value;
}

// packages/reactivity/src/ref.ts
import { isArray as isArray3 } from "@meils/vue-shared";
function ref(value) {
  return createRef(value);
}
function shallowRef(value) {
  return createRef(
    value,
    true
    /* shallow */
  );
}
function createRef(value, shallow = false) {
  if (isRef(value)) {
    return value;
  }
  return new RefImpl(value, shallow);
}
var RefImpl = class {
  dep = createDep([]);
  // 收集到的依赖放置在 dep 中
  _value;
  // 私有变量，保存内部真实的值
  _rawValue;
  // 原始值
  shallow = false;
  __v_isRef = true;
  // 特殊属性，标志该对象为 Ref 对象
  constructor(value, shallow = false) {
    this._rawValue = shallow ? value : toRaw(value);
    this._value = shallow ? value : toReactive(value);
    this.shallow = shallow;
  }
  get value() {
    trackRefValue(this);
    return this._value;
  }
  set value(newVal) {
    if (!Object.is(this._rawValue, newVal)) {
      this._value = this.shallow ? newVal : toReactive(newVal);
      this._rawValue = newVal;
      triggerRefValue(this);
    }
  }
};
function trackRefValue(ref2) {
  if (shouldTrack && activeEffect) {
    trackEffects(ref2.dep);
  }
}
function triggerRefValue(ref2) {
  triggerEffects(ref2.dep);
}
function isRef(value) {
  return !!(value && value.__v_isRef);
}
function triggerRef(ref2) {
  triggerRefValue(ref2);
}
function unRef(val) {
  return isRef(val) ? val.value : val;
}
function toRef(observed, key, defaultValue) {
  const val = observed[key];
  if (isRef(val)) {
    return val;
  }
  return new ObjectRefImpl(observed, key, defaultValue);
}
var ObjectRefImpl = class {
  // 特殊属性，标志该对象为 Ref 对象
  constructor(_object, _key, _defaultValue) {
    this._object = _object;
    this._key = _key;
    this._defaultValue = _defaultValue;
  }
  __v_isRef = true;
  get value() {
    const currVal = this._object[this._key];
    return !currVal ? this._defaultValue : currVal;
  }
  set value(newVal) {
    this._object[this._key] = newVal;
  }
};
function toRefs(object) {
  const ret = isArray3(object) ? new Array(object.length) : {};
  for (const key in object) {
    ret[key] = toRef(object, key);
  }
  return ret;
}
var shallowUnwrapHandlers = {
  // 判断是否为 ref，自动进行 .value 解构
  get: (target, key, receiver) => unRef(Reflect.get(target, key, receiver)),
  set: (target, key, value, receiver) => {
    const oldValue = target[key];
    if (isRef(oldValue) && !isRef(value)) {
      oldValue.value = value;
      return true;
    } else {
      return Reflect.set(target, key, value, receiver);
    }
  }
};
function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, shallowUnwrapHandlers);
}

// packages/reactivity/src/computed.ts
import { NOOP } from "@meils/vue-shared";
function computed(getterOrOptions) {
  let getter;
  let setter;
  if (typeof getterOrOptions === "function") {
    getter = getterOrOptions;
    setter = NOOP;
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  const obj = new ComputedRefImpl(getter, setter);
  return obj;
}
var ComputedRefImpl = class {
  constructor(getter, _setter) {
    this._setter = _setter;
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
        triggerRefValue(this);
      }
    });
    this.effect.computed = true;
    this.effect.active = true;
  }
  dep = createDep([]);
  // 每一个 computed 都有自己的 dep，用来收集依赖
  _value;
  // 记录 computed 的计算值
  __v_isRef = true;
  // 标记也是 Ref 类型
  _dirty = true;
  // 脏标记，默认是 true，那么第一次访问肯定需要执行计算
  effect;
  get value() {
    trackRefValue(this);
    if (this._dirty) {
      this._dirty = false;
      this._value = this.effect.run();
    }
    return this._value;
  }
  set value(newValue) {
    this._setter(newValue);
  }
};
export {
  ITERATE_KEY,
  ReactiveEffect,
  ReactiveFlags,
  TrackOpTypes,
  TriggerOpTypes,
  computed,
  createRef,
  effect,
  isProxy,
  isReactive,
  isReadonly,
  isRef,
  markRaw,
  pauseTracking,
  proxyRefs,
  reactive,
  readonly,
  ref,
  resetTracking,
  shallowReactive,
  shallowRef,
  toRaw,
  toRef,
  toRefs,
  track,
  trackEffects,
  trackRefValue,
  trigger,
  triggerEffects,
  triggerRef,
  triggerRefValue,
  unRef
};
//# sourceMappingURL=reactivity.esm.js.map
