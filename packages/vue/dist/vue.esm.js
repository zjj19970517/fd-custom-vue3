var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// packages/runtime-dom/dist/runtime-dom.esm.js
var runtime_dom_esm_exports = {};
__export(runtime_dom_esm_exports, {
  ReactiveEffect: () => ReactiveEffect,
  closeBlock: () => closeBlock,
  computed: () => computed,
  createApp: () => createApp,
  createBaseVNode: () => createBaseVNode,
  createElementBlock: () => createElementBlock,
  createElementVNode: () => createElementVNode,
  createRenderer: () => createRenderer,
  createTextVNode: () => createTextVNode,
  createVNode: () => createVNode,
  effect: () => effect,
  h: () => h,
  isProxy: () => isProxy,
  isReactive: () => isReactive,
  isReadonly: () => isReadonly,
  isRef: () => isRef,
  markRaw: () => markRaw,
  openBlock: () => openBlock,
  reactive: () => reactive,
  readonly: () => readonly,
  ref: () => ref,
  registerRuntimeCompiler: () => registerRuntimeCompiler,
  shallowReactive: () => shallowReactive,
  toDisplayString: () => toDisplayString,
  toRaw: () => toRaw,
  toRef: () => toRef,
  toRefs: () => toRefs,
  unRef: () => unRef
});
var isObject = (val) => val !== null && typeof val === "object";
var isString = (val) => typeof val === "string";
var isArray = Array.isArray;
var isIntegerKey = (key) => isString(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
var isFunction = (val) => typeof val === "function";
var isMap = (val) => toTypeString(val) === "[object Map]";
var isSet = (val) => toTypeString(val) === "[object Set]";
var isPlainObject = (val) => toTypeString(val) === "[object Object]";
var toTypeString = (value) => Object.prototype.toString.call(value);
var toRawTypeString = (value) => {
  return toTypeString(value).slice(8, -1);
};
var hasOwnProperty = Object.prototype.hasOwnProperty;
var hasOwn = (val, key) => hasOwnProperty.call(val, key);
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
var ShapeFlags = /* @__PURE__ */ ((ShapeFlags2) => {
  ShapeFlags2[ShapeFlags2["ELEMENT"] = 1] = "ELEMENT";
  ShapeFlags2[ShapeFlags2["FUNCTIONAL_COMPONENT"] = 2] = "FUNCTIONAL_COMPONENT";
  ShapeFlags2[ShapeFlags2["STATEFUL_COMPONENT"] = 4] = "STATEFUL_COMPONENT";
  ShapeFlags2[ShapeFlags2["TEXT_CHILDREN"] = 8] = "TEXT_CHILDREN";
  ShapeFlags2[ShapeFlags2["ARRAY_CHILDREN"] = 16] = "ARRAY_CHILDREN";
  ShapeFlags2[ShapeFlags2["COMPONENT"] = 6] = "COMPONENT";
  return ShapeFlags2;
})(ShapeFlags || {});
var EMPTY_OBJ = {};
var collectionHandler = {};
var readonlyCollectionHandler = {};
var shallowCollectionHandler = {};
function createDep(effects = []) {
  const dep = new Set(effects || []);
  return dep;
}
var TrackOpTypes = /* @__PURE__ */ ((TrackOpTypes2) => {
  TrackOpTypes2["GET"] = "get";
  TrackOpTypes2["HAS"] = "has";
  TrackOpTypes2["ITERATE"] = "iterate";
  return TrackOpTypes2;
})(TrackOpTypes || {});
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
  const last2 = trackStack.pop();
  shouldTrack = last2 === void 0 ? true : last2;
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
    case "add":
      if (isArray(target) && isIntegerKey(key)) {
        deps.push(depsMap.get("length"));
      } else {
        deps.push(depsMap.get(ITERATE_KEY));
      }
      break;
    case "delete":
      if (!isArray(target)) {
        deps.push(depsMap.get(ITERATE_KEY));
      }
      break;
    case "set":
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
    if (key === "__v_isReactive") {
      return !isReadonly2;
    } else if (key === "__v_isReadonly") {
      return isReadonly2;
    } else if (key === "__v_isShallow") {
      return shallow;
    } else if (key === "__v_raw" && receiver === (isReadonly2 ? shallow ? shallowReadonlyCacheMap : readonlyCacheMap : shallow ? shallowReactiveCacheMap : reactiveCacheMap).get(target)) {
      return target;
    }
    const res = Reflect.get(target, key, receiver);
    if (isString(key) && isNonTrackableKeys(key)) {
      return res;
    }
    if (!isReadonly2) {
      track(target, "get", key);
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
    const existingKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
    const res = Reflect.set(target, key, value, receiver);
    if (target === toRaw(receiver)) {
      if (!existingKey) {
        trigger(target, "add", key);
      } else if (!Object.is(value, oldValue)) {
        trigger(target, "set", key);
      }
    }
    return res;
  };
}
function deleteProperty(target, key) {
  const result = Reflect.deleteProperty(target, key);
  if (result) {
    trigger(target, "delete", key);
  }
  return result;
}
function has(target, key) {
  const result = Reflect.has(target, key);
  track(target, "has", key);
  return result;
}
function ownKeys(target) {
  const result = Reflect.ownKeys(target);
  track(target, "iterate", isArray(target) ? "length" : ITERATE_KEY);
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
function targetTypeMap(rawType) {
  switch (rawType) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}
function getTargetType(value) {
  return value[
    "__v_skip"
    /* SKIP */
  ] || !Object.isExtensible(value) ? 0 : targetTypeMap(toRawTypeString(value));
}
function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}
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
  return !!(value && value[
    "__v_isReadonly"
    /* IS_READONLY */
  ]);
}
function isProxy(value) {
  return isReactive(value) || isReadonly(value);
}
function isReactive(value) {
  return !!(value && value[
    "__v_isReactive"
    /* IS_REACTIVE */
  ]);
}
function toRaw(observed) {
  const raw = observed && observed[
    "__v_raw"
    /* RAW */
  ];
  return raw ? toRaw(raw) : observed;
}
function createReactiveObject(target, isReadonly2, baseHandler, collectionHandler2, proxyMap) {
  if (!isObject(target)) {
    console.warn("target must be a object");
    return target;
  }
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  const targetType = getTargetType(target);
  if (targetType === 0) {
    return target;
  }
  const proxy = new Proxy(
    target,
    // 代理使用的 handler
    // 公共 COMMON 类型使用 baseHandlers（处理 obj、array）
    // 集合 COLLECTION 类型 使用 collectionHandlers（处理 set、map）
    targetType === 2 ? collectionHandler2 : baseHandler
  );
  proxyMap.set(target, proxy);
  return proxy;
}
function markRaw(value) {
  Object.defineProperty(value, "__v_skip", {
    configurable: true,
    enumerable: false,
    value
  });
  return value;
}
function ref(value) {
  return createRef(value);
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
  const ret = isArray(object) ? new Array(object.length) : {};
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
var genAppConfig = () => {
  return {
    globalProperties: {}
  };
};
var createAppConfigHandler = (context) => {
  const AppConfigHandler = {
    get config() {
      return context.config;
    },
    set config(v) {
      console.warn(`app.config is readonly`);
    }
  };
  return AppConfigHandler;
};
var blockStack = [];
var currentBlock = null;
function openBlock(disableTracking = false) {
  blockStack.push(currentBlock = disableTracking ? null : []);
}
function closeBlock() {
  blockStack.pop();
  currentBlock = blockStack[blockStack.length - 1] || null;
}
function createTextVNode(text = "", flag = 0) {
  return createVNode(Text, null, text, flag);
}
function createElementBlock(type, props = null, children = null, patchFlag, dynamicProps, shapeFlag) {
  const vnode = createBaseVNode(type, props, children, patchFlag, shapeFlag);
  vnode.dynamicChildren = currentBlock;
  closeBlock();
  currentBlock && currentBlock.push(vnode);
  return vnode;
}
function createElementVNode(type, props = null, children = null, patchFlag = 0, shapeFlag = 0) {
  return createBaseVNode(type, props, children, patchFlag, shapeFlag);
}
var toDisplayString = (val) => {
  return isString(val) ? val : val == null ? "" : isArray(val) || isObject(val) && (val.toString === Object.prototype.toString || !isFunction(val.toString)) ? JSON.stringify(val, replacer, 2) : String(val);
};
var replacer = (_key, val) => {
  if (val && val.__v_isRef) {
    return replacer(_key, val.value);
  } else if (isMap(val)) {
    return {
      [`Map(${val.size})`]: [...val.entries()].reduce((entries, [key, val2]) => {
        entries[`${key} =>`] = val2;
        return entries;
      }, {})
    };
  } else if (isSet(val)) {
    return {
      [`Set(${val.size})`]: [...val.values()]
    };
  } else if (isObject(val) && !isArray(val) && !isPlainObject(val)) {
    return String(val);
  }
  return val;
};
var Text2 = Symbol("Text");
var createVNode = (type, props = null, children = null, patchFlag = 0) => {
  const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : isObject(type) ? ShapeFlags.STATEFUL_COMPONENT : isFunction(type) ? ShapeFlags.FUNCTIONAL_COMPONENT : 0;
  return createBaseVNode(type, props, children, patchFlag, shapeFlag);
};
function createBaseVNode(type, props = null, children = null, patchFlag = 0, shapeFlag = 0) {
  const vnode = {
    __v_isVNode: true,
    // 标志是一个虚拟节点
    __v_skip: true,
    // 跳过响应式代理
    el: null,
    // 和真实 DOM 对应起来
    type,
    props,
    children,
    component: null,
    // 虚拟节点
    key: props && props.key,
    shapeFlag,
    patchFlag,
    appContext: null,
    // app 上下文对象
    dynamicChildren: null
  };
  if (shapeFlag === 0) {
    const shapeFlag2 = isString(type) ? ShapeFlags.ELEMENT : isObject(type) ? ShapeFlags.STATEFUL_COMPONENT : isFunction(type) ? ShapeFlags.FUNCTIONAL_COMPONENT : 0;
    vnode.shapeFlag = shapeFlag2;
  }
  normalizeChildren(vnode, children);
  if (currentBlock && vnode.patchFlag > 0) {
    currentBlock.push(vnode);
  }
  return vnode;
}
function normalizeChildren(vnode, children) {
  let type = 0;
  if (!children) {
    children = null;
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN;
  } else {
    type = ShapeFlags.TEXT_CHILDREN;
    console.log("1111");
  }
  vnode.shapeFlag |= type;
  vnode.children = children;
}
function normalizeVNode(child) {
  if (isString(child)) {
    return createVNode(Text2, null, String(child));
  }
  return child;
}
var uid = 0;
function createAppAPI(render) {
  return function createApp2(hostComponent, rootProps = null) {
    const context = createAppContext();
    const isMounted = false;
    const app = context.app = {
      _context: context,
      _uid: uid++,
      _container: null,
      _props: rootProps,
      ...createAppConfigHandler(context),
      // app.config
      /**
       * 将 App 挂载到 rootContainer 内
       * @param rootContainer
       */
      mount(rootContainer) {
        if (!isMounted) {
          const vnode = createVNode(hostComponent, rootProps);
          vnode.appContext = context;
          render(vnode, rootContainer);
          app._container = rootContainer;
        } else {
          console.warn("app has mounted");
        }
      },
      /**
       * 卸载 App 实例
       */
      unmount() {
        if (isMounted) {
          render(null, app._container);
          app._container = null;
        } else {
          console.warn("The app is not mounted yet");
        }
      }
    };
    return app;
  };
}
function createAppContext() {
  return {
    app: {},
    config: genAppConfig()
  };
}
function normalizeEmitsOptions(type) {
  const rawEmits = type.emits;
  const normalized = {};
  if (isArray(rawEmits)) {
    rawEmits.forEach((key) => normalized[key] = null);
  }
  return normalized;
}
function emit(instance, event, ...rawArgs) {
  console.log("emit", instance, event, rawArgs);
}
function initProps(instance, isStateful, vnodeProps = null) {
  const props = {};
  const attrs = {};
  parseProps(instance, vnodeProps || {}, props, attrs);
  if (isStateful) {
    instance.props = shallowReactive(props);
  } else {
    if (!instance.type.props) {
      instance.props = attrs;
    } else {
      instance.props = props;
    }
  }
  instance.attrs = attrs;
}
function parseProps(instance, vnodeProps, props, attrs) {
  const [options, needCaseDefaultKeys] = instance.propsOptions;
  const hasValueProps = [];
  for (const key in vnodeProps) {
    const value = vnodeProps[key];
    const camelKey = camelize(key);
    if (isReservedProp(key)) {
      continue;
    }
    if (options && hasOwn(options, camelKey)) {
      hasValueProps.push(camelKey);
      props[camelKey] = value;
    } else {
      attrs[camelKey] = value;
    }
  }
  if (needCaseDefaultKeys && options) {
    let opt;
    needCaseDefaultKeys.forEach((key) => {
      if (!hasValueProps.includes(key)) {
        opt = options[key];
        if (isFunction(opt.default)) {
          props[key] = opt.default();
        } else {
          props[key] = opt.default;
        }
      }
    });
  }
}
function normalizePropsOptions(type) {
  const normalized = {};
  const needCaseDefaultKeys = [];
  const rawPropsOptions = type.props;
  if (isObject(rawPropsOptions)) {
    for (const key in rawPropsOptions) {
      const normalizedKey = camelize(key);
      if (normalizedKey) {
        const opt = rawPropsOptions[key];
        normalized[normalizedKey] = opt;
        if (hasOwn(opt, "default")) {
          needCaseDefaultKeys.push(normalizedKey);
        }
      }
    }
  }
  return [normalized, needCaseDefaultKeys];
}
function isReservedProp(propsKey) {
  return ["key", "ref"].includes(propsKey);
}
var PublicCtxProxyHandler = {
  get({ _: instance }, key) {
    const { ctx, setupState, data, props, type, appContext } = instance;
    if (!isInnerKey(key)) {
      if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
        return setupState[key];
      } else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
        return data[key];
      } else if (props && hasOwn(instance.propsOptions[0], key)) {
        return props[key];
      } else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
        return ctx[key];
      } else {
        console.warn("unknown key");
      }
    }
    if (isPublicProperties(key)) {
    } else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
      return ctx[key];
    } else if (hasOwn(appContext.config.globalProperties, key)) {
      return appContext.config.globalProperties[key];
    } else {
      console.warn("unknown key");
    }
  },
  set({ _: instance }, key, value) {
    const { data, setupState, ctx } = instance;
    if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
      setupState[key] = value;
      return true;
    } else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
      data[key] = value;
      return true;
    } else if (hasOwn(instance.props, key)) {
      console.warn("Props are readonly.");
      return false;
    } else if (key[0] === "$") {
      console.warn("Properties starting with $ are reserved and readonly.");
      return false;
    } else {
      Object.defineProperty(ctx, key, {
        enumerable: true,
        configurable: true,
        value
      });
    }
    return true;
  }
};
function isInnerKey(key) {
  return key[0] === "$";
}
function isPublicProperties(key) {
  return [
    "$",
    "$el",
    "data",
    "$props",
    "$refs",
    "$parent",
    "$root",
    "$options",
    "$watch"
    // ...
  ].includes(key);
}
var uid2 = 0;
var defaultAppContext = createAppContext();
var currentInstance = null;
var setCurrentInstance = (instance) => {
  currentInstance = instance;
};
var unsetCurrentInstance = () => {
  currentInstance = null;
};
function createComponentInstance(vnode, parent) {
  const type = vnode.type;
  const appContext = (parent ? parent.appContext : vnode.appContext) || defaultAppContext;
  const instance = {
    uid: uid2++,
    type,
    vnode,
    parent,
    appContext,
    root: null,
    propsOptions: normalizePropsOptions(type),
    emitsOptions: normalizeEmitsOptions(type),
    setupState: EMPTY_OBJ,
    props: EMPTY_OBJ,
    attrs: EMPTY_OBJ,
    data: EMPTY_OBJ,
    refs: EMPTY_OBJ,
    ctx: EMPTY_OBJ,
    proxy: null,
    accessCache: {},
    exposed: {},
    emit: null,
    render: null,
    effect: null,
    update: null,
    isMounted: false,
    isUnmounted: false,
    isDeactivated: false,
    subTree: null
  };
  instance.ctx = { _: instance };
  instance.root = parent ? parent.root : instance;
  instance.emit = emit.bind(null, instance);
  return instance;
}
function setupComponent(instance) {
  const { vnode, type } = instance;
  const { props } = vnode;
  const isStateful = isStatefulComponent(instance);
  initProps(instance, !!isStateful, props);
  if (isStateful) {
    if (true) {
    }
    instance.accessCache = {};
    instance.proxy = new Proxy(instance.ctx, PublicCtxProxyHandler);
    const { setup } = type;
    if (setup) {
      const setupContext = createSetupContext(instance);
      setCurrentInstance(instance);
      pauseTracking();
      const setupResult = setup(instance, setupContext);
      resetTracking();
      unsetCurrentInstance();
      if (isFunction(setupResult)) {
        instance.render = setupResult;
      } else if (isObject(setupResult)) {
        instance.setupState = proxyRefs(setupResult);
      } else {
        console.log(
          "The execution result only supports object and function types"
        );
      }
    }
    if (!instance.render) {
      if (compile && !type.render) {
        if (type.template) {
          const template = type.template;
          type.render = compile(template);
        }
      }
      instance.render = type.render;
    }
    console.log("\u3010 debug: \u7EC4\u4EF6\u521D\u59CB\u5316\u5B8C\u6BD5 \u3011", instance);
  }
}
function isStatefulComponent(instance) {
  return instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT;
}
function createSetupContext(instance) {
  const expose = (exposed) => {
    instance.exposed = exposed || {};
  };
  let _attrs;
  return {
    // 只读
    get attrs() {
      if (_attrs) {
        return _attrs;
      }
      _attrs = createAttrsProxy(instance);
      return _attrs;
    },
    emit: instance.emit,
    expose
  };
}
function createAttrsProxy(instance) {
  return new Proxy(instance.attrs, {
    get(target, key) {
      track(instance, TrackOpTypes.GET, "$attrs");
      return target[key];
    },
    set() {
      console.warn(`setupContext.attrs is readonly.`);
      return false;
    },
    deleteProperty() {
      console.warn(`setupContext.attrs is readonly.`);
      return false;
    }
  });
}
var compile;
function registerRuntimeCompiler(_compile) {
  compile = _compile;
}
var currentRenderingInstance = null;
function setCurrentRenderingInstance(instance) {
  const prev = currentRenderingInstance;
  currentRenderingInstance = instance;
  return prev;
}
function renderComponent(instance) {
  const { vnode, render, proxy } = instance;
  const prev = setCurrentRenderingInstance(instance);
  let subTree;
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    subTree = render.call(proxy, proxy);
  } else {
    subTree = {};
  }
  setCurrentRenderingInstance(prev);
  return subTree;
}
function createRenderer(options) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    setScopeId: hostSetScopeId,
    cloneNode: hostCloneNode,
    insertStaticContent: hostInsertStaticContent
  } = options;
  const setupRenderEffect = (instance, initialVNode, container, anchor = null) => {
    const renderFn = () => {
      if (!instance.isMounted) {
        const subTree = instance.subTree = renderComponent(instance);
        console.log(" \u3010 debug\uFF1A render subTree \u3011 ", subTree);
        patch(null, subTree, container, null, instance);
        instance.isMounted = true;
      } else {
      }
    };
    instance.effect = new ReactiveEffect(renderFn, () => {
      update();
    });
    const update = instance.update = () => instance.effect?.run();
    instance.update();
  };
  const mountComponent = (initialVNode, container, anchor = null, parentComponent = null) => {
    const instance = createComponentInstance(initialVNode, parentComponent);
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container, anchor);
  };
  const processComponent = (n1, n2, container, anchor = null, parentComponent = null) => {
    if (n1 == null) {
      mountComponent(n2, container, anchor, parentComponent);
    } else {
    }
  };
  const mountChildren = (children, container, anchor, parentComponent) => {
    debugger;
    for (let i = 0; i < children.length; i++) {
      const child = normalizeVNode(children[i]);
      patch(null, child, container, anchor, parentComponent);
    }
  };
  const mountElement = (vnode, container, anchor = null, parentComponent = null) => {
    const { shapeFlag, props, type } = vnode;
    const el = vnode.el = hostCreateElement(type);
    if (props) {
      for (const key in props) {
        if (!isReservedProp(key)) {
          hostPatchProp(el, key, null, props[key]);
        }
      }
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, vnode.children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el, null, parentComponent);
    }
    hostInsert(el, container, anchor);
  };
  const processElement = (n1, n2, container, anchor = null, parentComponent = null) => {
    if (n1 == null) {
      mountElement(n2, container, anchor, parentComponent);
    } else {
    }
  };
  const processText = (n1, n2, container, anchor = null) => {
    if (n1 == null) {
      n2.el = hostCreateText(n2.children);
      n2.el && hostInsert(n2.el, container, anchor);
    } else {
      if (n2.children !== n1.children) {
        hostSetText(n2.el, n2.children);
      }
    }
  };
  const patch = (n1, n2, container, anchor = null, parentComponent = null) => {
    console.info("\u3010 debug: exec patch \u3011", n1, n2, container);
    if (n1 === n2) {
      return;
    }
    const { type, shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container, anchor);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor, parentComponent);
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(n1, n2, container, anchor, parentComponent);
        } else {
          console.warn("Unimplemented type");
        }
    }
  };
  const render = (vnode, container, anchor = null, parentComponent = null) => {
    if (!vnode) {
      if (container?._vnode) {
      }
    } else {
      patch(
        container?._vnode || null,
        vnode,
        container,
        anchor,
        parentComponent
      );
    }
    if (container)
      container._vnode = vnode;
  };
  return {
    createApp: createAppAPI(render)
  };
}
function h(type, propsOrChildren, children) {
  return createVNode(type, propsOrChildren, children);
}
var isString2 = (val) => typeof val === "string";
var isArray2 = Array.isArray;
var isOnEventName = (key) => /^on[A-Z]/.test(key);
var cacheStringFunction2 = (fn) => {
  const cache = /* @__PURE__ */ Object.create(null);
  return (str) => {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  };
};
var camelizeRE2 = /-(\w)/g;
var camelize2 = cacheStringFunction2((str) => {
  return str.replace(camelizeRE2, (_, c) => c ? c.toUpperCase() : "");
});
var nodeOps = {
  // 创建元素
  createElement(tag, is) {
    return document.createElement(tag, is ? { is } : void 0);
  },
  // 创建文本节点
  createText: (text) => document.createTextNode(text),
  // 创建注释
  createComment: (text) => document.createComment(text),
  // 插入节点
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null);
  },
  // 移除节点
  remove: (child) => {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },
  // 设置文本节点
  setText: (node, text) => {
    node.nodeValue = text;
  },
  // 设置元素中的文本内容
  setElementText: (el, text) => {
    el.textContent = text;
  },
  // 获取父节点
  parentNode: (node) => node.parentNode,
  // 获取兄弟节点
  nextSibling: (node) => node.nextSibling,
  // 传入选择器，获取对应的节点
  querySelector: (selector) => document.querySelector(selector),
  // 设置元素的作用域
  setScopeId(el, id) {
    el.setAttribute(id, "");
  },
  // 克隆节点
  cloneNode(el) {
    const cloned = el.cloneNode(true);
    return cloned;
  }
};
function patchAttr(el, key, value) {
  if (value === null || value === "") {
    el.removeAttribute(key);
  } else {
    el.setAttribute(key, value);
  }
}
function patchClass(el, value) {
  if (value == null) {
    el.removeAttribute("class");
  } else {
    el.className = value;
  }
}
function patchEvent(el, key, oldValue, value) {
  const cache = el._evCache || (el._evCache = {});
  const existingCache = cache[key];
  if (!!value && !!existingCache) {
    existingCache.value = value;
  } else {
    const rawEventName = key.slice(2).toLowerCase();
    if (value) {
      const listener = cache[key] = createEventInvoker(value);
      el.addEventListener(rawEventName, listener);
    } else {
      el.removeEventListener(rawEventName, existingCache);
      cache[key] = void 0;
    }
  }
}
function createEventInvoker(value) {
  const fn = (e) => {
    fn.value(e);
  };
  fn.value = value;
  return fn;
}
var importantStyle = /\s*!important$/;
function patchStyle(el, oldValue, value) {
  const currentStyle = el.style;
  const stringCSS = isString2(value);
  if (value && !stringCSS) {
    for (const key in value) {
      updateStyle(currentStyle, key, value[key]);
    }
    if (oldValue && !isString2(oldValue)) {
      for (const key in oldValue) {
        if (!value[key]) {
          updateStyle(currentStyle, key, "");
        }
      }
    }
  } else {
    if (stringCSS) {
      if (oldValue !== value) {
        currentStyle.cssText = value;
      }
    } else {
      if (oldValue) {
        el.removeAttribute("style");
      }
    }
  }
}
function updateStyle(style, name, val) {
  if (val == null)
    val = "";
  if (importantStyle.test(val)) {
    style.setProperty(name, val.replace(importantStyle, ""), "important");
  } else {
    style.setProperty(name, val);
  }
}
var patchProp = (el, key, prevValue, nextValue) => {
  if (key === "class") {
    patchClass(el, nextValue);
  } else if (key === "style") {
    patchStyle(el, prevValue, nextValue);
  } else if (isOnEventName(key)) {
    patchEvent(el, key, prevValue, nextValue);
  } else {
    patchAttr(el, key, nextValue);
  }
};
var renderer;
var rendererOptions = Object.assign({}, nodeOps, { patchProp });
function ensureRenderer() {
  return renderer || (renderer = createRenderer(rendererOptions));
}
var createApp = (rootComponent, rootProps = null) => {
  const app = ensureRenderer().createApp(rootComponent, rootProps);
  const { mount } = app;
  app.mount = (containerOrSelector) => {
    let container = null;
    if (isString2(containerOrSelector)) {
      container = document.querySelector(containerOrSelector);
    } else {
      container = containerOrSelector;
    }
    if (!container)
      return;
    container.innerHTML = "";
    mount(container);
  };
  return app;
};

// node_modules/.pnpm/@vue+shared@3.2.45/node_modules/@vue/shared/dist/shared.esm-bundler.js
function makeMap(str, expectsLowerCase) {
  const map = /* @__PURE__ */ Object.create(null);
  const list = str.split(",");
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return expectsLowerCase ? (val) => !!map[val.toLowerCase()] : (val) => !!map[val];
}
var PatchFlagNames = {
  [
    1
    /* PatchFlags.TEXT */
  ]: `TEXT`,
  [
    2
    /* PatchFlags.CLASS */
  ]: `CLASS`,
  [
    4
    /* PatchFlags.STYLE */
  ]: `STYLE`,
  [
    8
    /* PatchFlags.PROPS */
  ]: `PROPS`,
  [
    16
    /* PatchFlags.FULL_PROPS */
  ]: `FULL_PROPS`,
  [
    32
    /* PatchFlags.HYDRATE_EVENTS */
  ]: `HYDRATE_EVENTS`,
  [
    64
    /* PatchFlags.STABLE_FRAGMENT */
  ]: `STABLE_FRAGMENT`,
  [
    128
    /* PatchFlags.KEYED_FRAGMENT */
  ]: `KEYED_FRAGMENT`,
  [
    256
    /* PatchFlags.UNKEYED_FRAGMENT */
  ]: `UNKEYED_FRAGMENT`,
  [
    512
    /* PatchFlags.NEED_PATCH */
  ]: `NEED_PATCH`,
  [
    1024
    /* PatchFlags.DYNAMIC_SLOTS */
  ]: `DYNAMIC_SLOTS`,
  [
    2048
    /* PatchFlags.DEV_ROOT_FRAGMENT */
  ]: `DEV_ROOT_FRAGMENT`,
  [
    -1
    /* PatchFlags.HOISTED */
  ]: `HOISTED`,
  [
    -2
    /* PatchFlags.BAIL */
  ]: `BAIL`
};
var slotFlagsText = {
  [
    1
    /* SlotFlags.STABLE */
  ]: "STABLE",
  [
    2
    /* SlotFlags.DYNAMIC */
  ]: "DYNAMIC",
  [
    3
    /* SlotFlags.FORWARDED */
  ]: "FORWARDED"
};
var specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`;
var isBooleanAttr = /* @__PURE__ */ makeMap(specialBooleanAttrs + `,async,autofocus,autoplay,controls,default,defer,disabled,hidden,loop,open,required,reversed,scoped,seamless,checked,muted,multiple,selected`);
var EMPTY_OBJ2 = true ? Object.freeze({}) : {};
var EMPTY_ARR = true ? Object.freeze([]) : [];
var NOOP2 = () => {
};
var NO = () => false;
var onRE = /^on[^a-z]/;
var isOn = (key) => onRE.test(key);
var extend = Object.assign;
var isArray3 = Array.isArray;
var isString3 = (val) => typeof val === "string";
var isSymbol = (val) => typeof val === "symbol";
var isObject2 = (val) => val !== null && typeof val === "object";
var isReservedProp2 = /* @__PURE__ */ makeMap(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
);
var isBuiltInDirective = /* @__PURE__ */ makeMap("bind,cloak,else-if,else,for,html,if,model,on,once,pre,show,slot,text,memo");
var cacheStringFunction3 = (fn) => {
  const cache = /* @__PURE__ */ Object.create(null);
  return (str) => {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  };
};
var camelizeRE3 = /-(\w)/g;
var camelize3 = cacheStringFunction3((str) => {
  return str.replace(camelizeRE3, (_, c) => c ? c.toUpperCase() : "");
});
var hyphenateRE = /\B([A-Z])/g;
var hyphenate = cacheStringFunction3((str) => str.replace(hyphenateRE, "-$1").toLowerCase());
var capitalize = cacheStringFunction3((str) => str.charAt(0).toUpperCase() + str.slice(1));
var toHandlerKey = cacheStringFunction3((str) => str ? `on${capitalize(str)}` : ``);

// node_modules/.pnpm/@vue+compiler-core@3.2.45/node_modules/@vue/compiler-core/dist/compiler-core.esm-bundler.js
function defaultOnError(error) {
  throw error;
}
function defaultOnWarn(msg) {
  console.warn(`[Vue warn] ${msg.message}`);
}
function createCompilerError(code, loc, messages, additionalMessage) {
  const msg = true ? (messages || errorMessages)[code] + (additionalMessage || ``) : code;
  const error = new SyntaxError(String(msg));
  error.code = code;
  error.loc = loc;
  return error;
}
var errorMessages = {
  // parse errors
  [
    0
    /* ErrorCodes.ABRUPT_CLOSING_OF_EMPTY_COMMENT */
  ]: "Illegal comment.",
  [
    1
    /* ErrorCodes.CDATA_IN_HTML_CONTENT */
  ]: "CDATA section is allowed only in XML context.",
  [
    2
    /* ErrorCodes.DUPLICATE_ATTRIBUTE */
  ]: "Duplicate attribute.",
  [
    3
    /* ErrorCodes.END_TAG_WITH_ATTRIBUTES */
  ]: "End tag cannot have attributes.",
  [
    4
    /* ErrorCodes.END_TAG_WITH_TRAILING_SOLIDUS */
  ]: "Illegal '/' in tags.",
  [
    5
    /* ErrorCodes.EOF_BEFORE_TAG_NAME */
  ]: "Unexpected EOF in tag.",
  [
    6
    /* ErrorCodes.EOF_IN_CDATA */
  ]: "Unexpected EOF in CDATA section.",
  [
    7
    /* ErrorCodes.EOF_IN_COMMENT */
  ]: "Unexpected EOF in comment.",
  [
    8
    /* ErrorCodes.EOF_IN_SCRIPT_HTML_COMMENT_LIKE_TEXT */
  ]: "Unexpected EOF in script.",
  [
    9
    /* ErrorCodes.EOF_IN_TAG */
  ]: "Unexpected EOF in tag.",
  [
    10
    /* ErrorCodes.INCORRECTLY_CLOSED_COMMENT */
  ]: "Incorrectly closed comment.",
  [
    11
    /* ErrorCodes.INCORRECTLY_OPENED_COMMENT */
  ]: "Incorrectly opened comment.",
  [
    12
    /* ErrorCodes.INVALID_FIRST_CHARACTER_OF_TAG_NAME */
  ]: "Illegal tag name. Use '&lt;' to print '<'.",
  [
    13
    /* ErrorCodes.MISSING_ATTRIBUTE_VALUE */
  ]: "Attribute value was expected.",
  [
    14
    /* ErrorCodes.MISSING_END_TAG_NAME */
  ]: "End tag name was expected.",
  [
    15
    /* ErrorCodes.MISSING_WHITESPACE_BETWEEN_ATTRIBUTES */
  ]: "Whitespace was expected.",
  [
    16
    /* ErrorCodes.NESTED_COMMENT */
  ]: "Unexpected '<!--' in comment.",
  [
    17
    /* ErrorCodes.UNEXPECTED_CHARACTER_IN_ATTRIBUTE_NAME */
  ]: `Attribute name cannot contain U+0022 ("), U+0027 ('), and U+003C (<).`,
  [
    18
    /* ErrorCodes.UNEXPECTED_CHARACTER_IN_UNQUOTED_ATTRIBUTE_VALUE */
  ]: "Unquoted attribute value cannot contain U+0022 (\"), U+0027 ('), U+003C (<), U+003D (=), and U+0060 (`).",
  [
    19
    /* ErrorCodes.UNEXPECTED_EQUALS_SIGN_BEFORE_ATTRIBUTE_NAME */
  ]: "Attribute name cannot start with '='.",
  [
    21
    /* ErrorCodes.UNEXPECTED_QUESTION_MARK_INSTEAD_OF_TAG_NAME */
  ]: "'<?' is allowed only in XML context.",
  [
    20
    /* ErrorCodes.UNEXPECTED_NULL_CHARACTER */
  ]: `Unexpected null character.`,
  [
    22
    /* ErrorCodes.UNEXPECTED_SOLIDUS_IN_TAG */
  ]: "Illegal '/' in tags.",
  // Vue-specific parse errors
  [
    23
    /* ErrorCodes.X_INVALID_END_TAG */
  ]: "Invalid end tag.",
  [
    24
    /* ErrorCodes.X_MISSING_END_TAG */
  ]: "Element is missing end tag.",
  [
    25
    /* ErrorCodes.X_MISSING_INTERPOLATION_END */
  ]: "Interpolation end sign was not found.",
  [
    27
    /* ErrorCodes.X_MISSING_DYNAMIC_DIRECTIVE_ARGUMENT_END */
  ]: "End bracket for dynamic directive argument was not found. Note that dynamic directive argument cannot contain spaces.",
  [
    26
    /* ErrorCodes.X_MISSING_DIRECTIVE_NAME */
  ]: "Legal directive name was expected.",
  // transform errors
  [
    28
    /* ErrorCodes.X_V_IF_NO_EXPRESSION */
  ]: `v-if/v-else-if is missing expression.`,
  [
    29
    /* ErrorCodes.X_V_IF_SAME_KEY */
  ]: `v-if/else branches must use unique keys.`,
  [
    30
    /* ErrorCodes.X_V_ELSE_NO_ADJACENT_IF */
  ]: `v-else/v-else-if has no adjacent v-if or v-else-if.`,
  [
    31
    /* ErrorCodes.X_V_FOR_NO_EXPRESSION */
  ]: `v-for is missing expression.`,
  [
    32
    /* ErrorCodes.X_V_FOR_MALFORMED_EXPRESSION */
  ]: `v-for has invalid expression.`,
  [
    33
    /* ErrorCodes.X_V_FOR_TEMPLATE_KEY_PLACEMENT */
  ]: `<template v-for> key should be placed on the <template> tag.`,
  [
    34
    /* ErrorCodes.X_V_BIND_NO_EXPRESSION */
  ]: `v-bind is missing expression.`,
  [
    35
    /* ErrorCodes.X_V_ON_NO_EXPRESSION */
  ]: `v-on is missing expression.`,
  [
    36
    /* ErrorCodes.X_V_SLOT_UNEXPECTED_DIRECTIVE_ON_SLOT_OUTLET */
  ]: `Unexpected custom directive on <slot> outlet.`,
  [
    37
    /* ErrorCodes.X_V_SLOT_MIXED_SLOT_USAGE */
  ]: `Mixed v-slot usage on both the component and nested <template>.When there are multiple named slots, all slots should use <template> syntax to avoid scope ambiguity.`,
  [
    38
    /* ErrorCodes.X_V_SLOT_DUPLICATE_SLOT_NAMES */
  ]: `Duplicate slot names found. `,
  [
    39
    /* ErrorCodes.X_V_SLOT_EXTRANEOUS_DEFAULT_SLOT_CHILDREN */
  ]: `Extraneous children found when component already has explicitly named default slot. These children will be ignored.`,
  [
    40
    /* ErrorCodes.X_V_SLOT_MISPLACED */
  ]: `v-slot can only be used on components or <template> tags.`,
  [
    41
    /* ErrorCodes.X_V_MODEL_NO_EXPRESSION */
  ]: `v-model is missing expression.`,
  [
    42
    /* ErrorCodes.X_V_MODEL_MALFORMED_EXPRESSION */
  ]: `v-model value must be a valid JavaScript member expression.`,
  [
    43
    /* ErrorCodes.X_V_MODEL_ON_SCOPE_VARIABLE */
  ]: `v-model cannot be used on v-for or v-slot scope variables because they are not writable.`,
  [
    44
    /* ErrorCodes.X_V_MODEL_ON_PROPS */
  ]: `v-model cannot be used on a prop, because local prop bindings are not writable.
Use a v-bind binding combined with a v-on listener that emits update:x event instead.`,
  [
    45
    /* ErrorCodes.X_INVALID_EXPRESSION */
  ]: `Error parsing JavaScript expression: `,
  [
    46
    /* ErrorCodes.X_KEEP_ALIVE_INVALID_CHILDREN */
  ]: `<KeepAlive> expects exactly one child component.`,
  // generic errors
  [
    47
    /* ErrorCodes.X_PREFIX_ID_NOT_SUPPORTED */
  ]: `"prefixIdentifiers" option is not supported in this build of compiler.`,
  [
    48
    /* ErrorCodes.X_MODULE_MODE_NOT_SUPPORTED */
  ]: `ES module mode is not supported in this build of compiler.`,
  [
    49
    /* ErrorCodes.X_CACHE_HANDLER_NOT_SUPPORTED */
  ]: `"cacheHandlers" option is only supported when the "prefixIdentifiers" option is enabled.`,
  [
    50
    /* ErrorCodes.X_SCOPE_ID_NOT_SUPPORTED */
  ]: `"scopeId" option is only supported in module mode.`,
  // just to fulfill types
  [
    51
    /* ErrorCodes.__EXTEND_POINT__ */
  ]: ``
};
var FRAGMENT = Symbol(true ? `Fragment` : ``);
var TELEPORT = Symbol(true ? `Teleport` : ``);
var SUSPENSE = Symbol(true ? `Suspense` : ``);
var KEEP_ALIVE = Symbol(true ? `KeepAlive` : ``);
var BASE_TRANSITION = Symbol(true ? `BaseTransition` : ``);
var OPEN_BLOCK = Symbol(true ? `openBlock` : ``);
var CREATE_BLOCK = Symbol(true ? `createBlock` : ``);
var CREATE_ELEMENT_BLOCK = Symbol(true ? `createElementBlock` : ``);
var CREATE_VNODE = Symbol(true ? `createVNode` : ``);
var CREATE_ELEMENT_VNODE = Symbol(true ? `createElementVNode` : ``);
var CREATE_COMMENT = Symbol(true ? `createCommentVNode` : ``);
var CREATE_TEXT = Symbol(true ? `createTextVNode` : ``);
var CREATE_STATIC = Symbol(true ? `createStaticVNode` : ``);
var RESOLVE_COMPONENT = Symbol(true ? `resolveComponent` : ``);
var RESOLVE_DYNAMIC_COMPONENT = Symbol(true ? `resolveDynamicComponent` : ``);
var RESOLVE_DIRECTIVE = Symbol(true ? `resolveDirective` : ``);
var RESOLVE_FILTER = Symbol(true ? `resolveFilter` : ``);
var WITH_DIRECTIVES = Symbol(true ? `withDirectives` : ``);
var RENDER_LIST = Symbol(true ? `renderList` : ``);
var RENDER_SLOT = Symbol(true ? `renderSlot` : ``);
var CREATE_SLOTS = Symbol(true ? `createSlots` : ``);
var TO_DISPLAY_STRING = Symbol(true ? `toDisplayString` : ``);
var MERGE_PROPS = Symbol(true ? `mergeProps` : ``);
var NORMALIZE_CLASS = Symbol(true ? `normalizeClass` : ``);
var NORMALIZE_STYLE = Symbol(true ? `normalizeStyle` : ``);
var NORMALIZE_PROPS = Symbol(true ? `normalizeProps` : ``);
var GUARD_REACTIVE_PROPS = Symbol(true ? `guardReactiveProps` : ``);
var TO_HANDLERS = Symbol(true ? `toHandlers` : ``);
var CAMELIZE = Symbol(true ? `camelize` : ``);
var CAPITALIZE = Symbol(true ? `capitalize` : ``);
var TO_HANDLER_KEY = Symbol(true ? `toHandlerKey` : ``);
var SET_BLOCK_TRACKING = Symbol(true ? `setBlockTracking` : ``);
var PUSH_SCOPE_ID = Symbol(true ? `pushScopeId` : ``);
var POP_SCOPE_ID = Symbol(true ? `popScopeId` : ``);
var WITH_CTX = Symbol(true ? `withCtx` : ``);
var UNREF = Symbol(true ? `unref` : ``);
var IS_REF = Symbol(true ? `isRef` : ``);
var WITH_MEMO = Symbol(true ? `withMemo` : ``);
var IS_MEMO_SAME = Symbol(true ? `isMemoSame` : ``);
var helperNameMap = {
  [FRAGMENT]: `Fragment`,
  [TELEPORT]: `Teleport`,
  [SUSPENSE]: `Suspense`,
  [KEEP_ALIVE]: `KeepAlive`,
  [BASE_TRANSITION]: `BaseTransition`,
  [OPEN_BLOCK]: `openBlock`,
  [CREATE_BLOCK]: `createBlock`,
  [CREATE_ELEMENT_BLOCK]: `createElementBlock`,
  [CREATE_VNODE]: `createVNode`,
  [CREATE_ELEMENT_VNODE]: `createElementVNode`,
  [CREATE_COMMENT]: `createCommentVNode`,
  [CREATE_TEXT]: `createTextVNode`,
  [CREATE_STATIC]: `createStaticVNode`,
  [RESOLVE_COMPONENT]: `resolveComponent`,
  [RESOLVE_DYNAMIC_COMPONENT]: `resolveDynamicComponent`,
  [RESOLVE_DIRECTIVE]: `resolveDirective`,
  [RESOLVE_FILTER]: `resolveFilter`,
  [WITH_DIRECTIVES]: `withDirectives`,
  [RENDER_LIST]: `renderList`,
  [RENDER_SLOT]: `renderSlot`,
  [CREATE_SLOTS]: `createSlots`,
  [TO_DISPLAY_STRING]: `toDisplayString`,
  [MERGE_PROPS]: `mergeProps`,
  [NORMALIZE_CLASS]: `normalizeClass`,
  [NORMALIZE_STYLE]: `normalizeStyle`,
  [NORMALIZE_PROPS]: `normalizeProps`,
  [GUARD_REACTIVE_PROPS]: `guardReactiveProps`,
  [TO_HANDLERS]: `toHandlers`,
  [CAMELIZE]: `camelize`,
  [CAPITALIZE]: `capitalize`,
  [TO_HANDLER_KEY]: `toHandlerKey`,
  [SET_BLOCK_TRACKING]: `setBlockTracking`,
  [PUSH_SCOPE_ID]: `pushScopeId`,
  [POP_SCOPE_ID]: `popScopeId`,
  [WITH_CTX]: `withCtx`,
  [UNREF]: `unref`,
  [IS_REF]: `isRef`,
  [WITH_MEMO]: `withMemo`,
  [IS_MEMO_SAME]: `isMemoSame`
};
var locStub = {
  source: "",
  start: { line: 1, column: 1, offset: 0 },
  end: { line: 1, column: 1, offset: 0 }
};
function createRoot(children, loc = locStub) {
  return {
    type: 0,
    children,
    helpers: [],
    components: [],
    directives: [],
    hoists: [],
    imports: [],
    cached: 0,
    temps: 0,
    codegenNode: void 0,
    loc
  };
}
function createVNodeCall(context, tag, props, children, patchFlag, dynamicProps, directives, isBlock = false, disableTracking = false, isComponent2 = false, loc = locStub) {
  if (context) {
    if (isBlock) {
      context.helper(OPEN_BLOCK);
      context.helper(getVNodeBlockHelper(context.inSSR, isComponent2));
    } else {
      context.helper(getVNodeHelper(context.inSSR, isComponent2));
    }
    if (directives) {
      context.helper(WITH_DIRECTIVES);
    }
  }
  return {
    type: 13,
    tag,
    props,
    children,
    patchFlag,
    dynamicProps,
    directives,
    isBlock,
    disableTracking,
    isComponent: isComponent2,
    loc
  };
}
function createArrayExpression(elements, loc = locStub) {
  return {
    type: 17,
    loc,
    elements
  };
}
function createObjectExpression(properties, loc = locStub) {
  return {
    type: 15,
    loc,
    properties
  };
}
function createObjectProperty(key, value) {
  return {
    type: 16,
    loc: locStub,
    key: isString3(key) ? createSimpleExpression(key, true) : key,
    value
  };
}
function createSimpleExpression(content, isStatic = false, loc = locStub, constType = 0) {
  return {
    type: 4,
    loc,
    content,
    isStatic,
    constType: isStatic ? 3 : constType
  };
}
function createCompoundExpression(children, loc = locStub) {
  return {
    type: 8,
    loc,
    children
  };
}
function createCallExpression(callee, args = [], loc = locStub) {
  return {
    type: 14,
    loc,
    callee,
    arguments: args
  };
}
function createFunctionExpression(params, returns = void 0, newline = false, isSlot = false, loc = locStub) {
  return {
    type: 18,
    params,
    returns,
    newline,
    isSlot,
    loc
  };
}
function createConditionalExpression(test, consequent, alternate, newline = true) {
  return {
    type: 19,
    test,
    consequent,
    alternate,
    newline,
    loc: locStub
  };
}
function createCacheExpression(index, value, isVNode = false) {
  return {
    type: 20,
    index,
    value,
    isVNode,
    loc: locStub
  };
}
function createBlockStatement(body) {
  return {
    type: 21,
    body,
    loc: locStub
  };
}
var isStaticExp = (p) => p.type === 4 && p.isStatic;
var isBuiltInType = (tag, expected) => tag === expected || tag === hyphenate(expected);
function isCoreComponent(tag) {
  if (isBuiltInType(tag, "Teleport")) {
    return TELEPORT;
  } else if (isBuiltInType(tag, "Suspense")) {
    return SUSPENSE;
  } else if (isBuiltInType(tag, "KeepAlive")) {
    return KEEP_ALIVE;
  } else if (isBuiltInType(tag, "BaseTransition")) {
    return BASE_TRANSITION;
  }
}
var nonIdentifierRE = /^\d|[^\$\w]/;
var isSimpleIdentifier = (name) => !nonIdentifierRE.test(name);
var validFirstIdentCharRE = /[A-Za-z_$\xA0-\uFFFF]/;
var validIdentCharRE = /[\.\?\w$\xA0-\uFFFF]/;
var whitespaceRE = /\s+[.[]\s*|\s*[.[]\s+/g;
var isMemberExpressionBrowser = (path) => {
  path = path.trim().replace(whitespaceRE, (s) => s.trim());
  let state = 0;
  let stateStack = [];
  let currentOpenBracketCount = 0;
  let currentOpenParensCount = 0;
  let currentStringType = null;
  for (let i = 0; i < path.length; i++) {
    const char = path.charAt(i);
    switch (state) {
      case 0:
        if (char === "[") {
          stateStack.push(state);
          state = 1;
          currentOpenBracketCount++;
        } else if (char === "(") {
          stateStack.push(state);
          state = 2;
          currentOpenParensCount++;
        } else if (!(i === 0 ? validFirstIdentCharRE : validIdentCharRE).test(char)) {
          return false;
        }
        break;
      case 1:
        if (char === `'` || char === `"` || char === "`") {
          stateStack.push(state);
          state = 3;
          currentStringType = char;
        } else if (char === `[`) {
          currentOpenBracketCount++;
        } else if (char === `]`) {
          if (!--currentOpenBracketCount) {
            state = stateStack.pop();
          }
        }
        break;
      case 2:
        if (char === `'` || char === `"` || char === "`") {
          stateStack.push(state);
          state = 3;
          currentStringType = char;
        } else if (char === `(`) {
          currentOpenParensCount++;
        } else if (char === `)`) {
          if (i === path.length - 1) {
            return false;
          }
          if (!--currentOpenParensCount) {
            state = stateStack.pop();
          }
        }
        break;
      case 3:
        if (char === currentStringType) {
          state = stateStack.pop();
          currentStringType = null;
        }
        break;
    }
  }
  return !currentOpenBracketCount && !currentOpenParensCount;
};
var isMemberExpression = isMemberExpressionBrowser;
function getInnerRange(loc, offset, length) {
  const source = loc.source.slice(offset, offset + length);
  const newLoc = {
    source,
    start: advancePositionWithClone(loc.start, loc.source, offset),
    end: loc.end
  };
  if (length != null) {
    newLoc.end = advancePositionWithClone(loc.start, loc.source, offset + length);
  }
  return newLoc;
}
function advancePositionWithClone(pos, source, numberOfCharacters = source.length) {
  return advancePositionWithMutation(extend({}, pos), source, numberOfCharacters);
}
function advancePositionWithMutation(pos, source, numberOfCharacters = source.length) {
  let linesCount = 0;
  let lastNewLinePos = -1;
  for (let i = 0; i < numberOfCharacters; i++) {
    if (source.charCodeAt(i) === 10) {
      linesCount++;
      lastNewLinePos = i;
    }
  }
  pos.offset += numberOfCharacters;
  pos.line += linesCount;
  pos.column = lastNewLinePos === -1 ? pos.column + numberOfCharacters : numberOfCharacters - lastNewLinePos;
  return pos;
}
function assert(condition, msg) {
  if (!condition) {
    throw new Error(msg || `unexpected compiler condition`);
  }
}
function findDir(node, name, allowEmpty = false) {
  for (let i = 0; i < node.props.length; i++) {
    const p = node.props[i];
    if (p.type === 7 && (allowEmpty || p.exp) && (isString3(name) ? p.name === name : name.test(p.name))) {
      return p;
    }
  }
}
function findProp(node, name, dynamicOnly = false, allowEmpty = false) {
  for (let i = 0; i < node.props.length; i++) {
    const p = node.props[i];
    if (p.type === 6) {
      if (dynamicOnly)
        continue;
      if (p.name === name && (p.value || allowEmpty)) {
        return p;
      }
    } else if (p.name === "bind" && (p.exp || allowEmpty) && isStaticArgOf(p.arg, name)) {
      return p;
    }
  }
}
function isStaticArgOf(arg, name) {
  return !!(arg && isStaticExp(arg) && arg.content === name);
}
function isText(node) {
  return node.type === 5 || node.type === 2;
}
function isVSlot(p) {
  return p.type === 7 && p.name === "slot";
}
function isTemplateNode(node) {
  return node.type === 1 && node.tagType === 3;
}
function isSlotOutlet(node) {
  return node.type === 1 && node.tagType === 2;
}
function getVNodeHelper(ssr, isComponent2) {
  return ssr || isComponent2 ? CREATE_VNODE : CREATE_ELEMENT_VNODE;
}
function getVNodeBlockHelper(ssr, isComponent2) {
  return ssr || isComponent2 ? CREATE_BLOCK : CREATE_ELEMENT_BLOCK;
}
var propsHelperSet = /* @__PURE__ */ new Set([NORMALIZE_PROPS, GUARD_REACTIVE_PROPS]);
function getUnnormalizedProps(props, callPath = []) {
  if (props && !isString3(props) && props.type === 14) {
    const callee = props.callee;
    if (!isString3(callee) && propsHelperSet.has(callee)) {
      return getUnnormalizedProps(props.arguments[0], callPath.concat(props));
    }
  }
  return [props, callPath];
}
function injectProp(node, prop, context) {
  let propsWithInjection;
  let props = node.type === 13 ? node.props : node.arguments[2];
  let callPath = [];
  let parentCall;
  if (props && !isString3(props) && props.type === 14) {
    const ret = getUnnormalizedProps(props);
    props = ret[0];
    callPath = ret[1];
    parentCall = callPath[callPath.length - 1];
  }
  if (props == null || isString3(props)) {
    propsWithInjection = createObjectExpression([prop]);
  } else if (props.type === 14) {
    const first = props.arguments[0];
    if (!isString3(first) && first.type === 15) {
      if (!hasProp(prop, first)) {
        first.properties.unshift(prop);
      }
    } else {
      if (props.callee === TO_HANDLERS) {
        propsWithInjection = createCallExpression(context.helper(MERGE_PROPS), [
          createObjectExpression([prop]),
          props
        ]);
      } else {
        props.arguments.unshift(createObjectExpression([prop]));
      }
    }
    !propsWithInjection && (propsWithInjection = props);
  } else if (props.type === 15) {
    if (!hasProp(prop, props)) {
      props.properties.unshift(prop);
    }
    propsWithInjection = props;
  } else {
    propsWithInjection = createCallExpression(context.helper(MERGE_PROPS), [
      createObjectExpression([prop]),
      props
    ]);
    if (parentCall && parentCall.callee === GUARD_REACTIVE_PROPS) {
      parentCall = callPath[callPath.length - 2];
    }
  }
  if (node.type === 13) {
    if (parentCall) {
      parentCall.arguments[0] = propsWithInjection;
    } else {
      node.props = propsWithInjection;
    }
  } else {
    if (parentCall) {
      parentCall.arguments[0] = propsWithInjection;
    } else {
      node.arguments[2] = propsWithInjection;
    }
  }
}
function hasProp(prop, props) {
  let result = false;
  if (prop.key.type === 4) {
    const propKeyName = prop.key.content;
    result = props.properties.some((p) => p.key.type === 4 && p.key.content === propKeyName);
  }
  return result;
}
function toValidAssetId(name, type) {
  return `_${type}_${name.replace(/[^\w]/g, (searchValue, replaceValue) => {
    return searchValue === "-" ? "_" : name.charCodeAt(replaceValue).toString();
  })}`;
}
function getMemoedVNodeCall(node) {
  if (node.type === 14 && node.callee === WITH_MEMO) {
    return node.arguments[1].returns;
  } else {
    return node;
  }
}
function makeBlock(node, { helper, removeHelper, inSSR }) {
  if (!node.isBlock) {
    node.isBlock = true;
    removeHelper(getVNodeHelper(inSSR, node.isComponent));
    helper(OPEN_BLOCK);
    helper(getVNodeBlockHelper(inSSR, node.isComponent));
  }
}
var deprecationData = {
  [
    "COMPILER_IS_ON_ELEMENT"
    /* CompilerDeprecationTypes.COMPILER_IS_ON_ELEMENT */
  ]: {
    message: `Platform-native elements with "is" prop will no longer be treated as components in Vue 3 unless the "is" value is explicitly prefixed with "vue:".`,
    link: `https://v3-migration.vuejs.org/breaking-changes/custom-elements-interop.html`
  },
  [
    "COMPILER_V_BIND_SYNC"
    /* CompilerDeprecationTypes.COMPILER_V_BIND_SYNC */
  ]: {
    message: (key) => `.sync modifier for v-bind has been removed. Use v-model with argument instead. \`v-bind:${key}.sync\` should be changed to \`v-model:${key}\`.`,
    link: `https://v3-migration.vuejs.org/breaking-changes/v-model.html`
  },
  [
    "COMPILER_V_BIND_PROP"
    /* CompilerDeprecationTypes.COMPILER_V_BIND_PROP */
  ]: {
    message: `.prop modifier for v-bind has been removed and no longer necessary. Vue 3 will automatically set a binding as DOM property when appropriate.`
  },
  [
    "COMPILER_V_BIND_OBJECT_ORDER"
    /* CompilerDeprecationTypes.COMPILER_V_BIND_OBJECT_ORDER */
  ]: {
    message: `v-bind="obj" usage is now order sensitive and behaves like JavaScript object spread: it will now overwrite an existing non-mergeable attribute that appears before v-bind in the case of conflict. To retain 2.x behavior, move v-bind to make it the first attribute. You can also suppress this warning if the usage is intended.`,
    link: `https://v3-migration.vuejs.org/breaking-changes/v-bind.html`
  },
  [
    "COMPILER_V_ON_NATIVE"
    /* CompilerDeprecationTypes.COMPILER_V_ON_NATIVE */
  ]: {
    message: `.native modifier for v-on has been removed as is no longer necessary.`,
    link: `https://v3-migration.vuejs.org/breaking-changes/v-on-native-modifier-removed.html`
  },
  [
    "COMPILER_V_IF_V_FOR_PRECEDENCE"
    /* CompilerDeprecationTypes.COMPILER_V_IF_V_FOR_PRECEDENCE */
  ]: {
    message: `v-if / v-for precedence when used on the same element has changed in Vue 3: v-if now takes higher precedence and will no longer have access to v-for scope variables. It is best to avoid the ambiguity with <template> tags or use a computed property that filters v-for data source.`,
    link: `https://v3-migration.vuejs.org/breaking-changes/v-if-v-for.html`
  },
  [
    "COMPILER_NATIVE_TEMPLATE"
    /* CompilerDeprecationTypes.COMPILER_NATIVE_TEMPLATE */
  ]: {
    message: `<template> with no special directives will render as a native template element instead of its inner content in Vue 3.`
  },
  [
    "COMPILER_INLINE_TEMPLATE"
    /* CompilerDeprecationTypes.COMPILER_INLINE_TEMPLATE */
  ]: {
    message: `"inline-template" has been removed in Vue 3.`,
    link: `https://v3-migration.vuejs.org/breaking-changes/inline-template-attribute.html`
  },
  [
    "COMPILER_FILTER"
    /* CompilerDeprecationTypes.COMPILER_FILTERS */
  ]: {
    message: `filters have been removed in Vue 3. The "|" symbol will be treated as native JavaScript bitwise OR operator. Use method calls or computed properties instead.`,
    link: `https://v3-migration.vuejs.org/breaking-changes/filters.html`
  }
};
function getCompatValue(key, context) {
  const config = context.options ? context.options.compatConfig : context.compatConfig;
  const value = config && config[key];
  if (key === "MODE") {
    return value || 3;
  } else {
    return value;
  }
}
function isCompatEnabled(key, context) {
  const mode = getCompatValue("MODE", context);
  const value = getCompatValue(key, context);
  return mode === 3 ? value === true : value !== false;
}
function checkCompatEnabled(key, context, loc, ...args) {
  const enabled = isCompatEnabled(key, context);
  if (enabled) {
    warnDeprecation(key, context, loc, ...args);
  }
  return enabled;
}
function warnDeprecation(key, context, loc, ...args) {
  const val = getCompatValue(key, context);
  if (val === "suppress-warning") {
    return;
  }
  const { message, link } = deprecationData[key];
  const msg = `(deprecation ${key}) ${typeof message === "function" ? message(...args) : message}${link ? `
  Details: ${link}` : ``}`;
  const err = new SyntaxError(msg);
  err.code = key;
  if (loc)
    err.loc = loc;
  context.onWarn(err);
}
var decodeRE = /&(gt|lt|amp|apos|quot);/g;
var decodeMap = {
  gt: ">",
  lt: "<",
  amp: "&",
  apos: "'",
  quot: '"'
};
var defaultParserOptions = {
  delimiters: [`{{`, `}}`],
  getNamespace: () => 0,
  getTextMode: () => 0,
  isVoidTag: NO,
  isPreTag: NO,
  isCustomElement: NO,
  decodeEntities: (rawText) => rawText.replace(decodeRE, (_, p1) => decodeMap[p1]),
  onError: defaultOnError,
  onWarn: defaultOnWarn,
  comments: true
};
function baseParse(content, options = {}) {
  const context = createParserContext(content, options);
  const start = getCursor(context);
  return createRoot(parseChildren(context, 0, []), getSelection(context, start));
}
function createParserContext(content, rawOptions) {
  const options = extend({}, defaultParserOptions);
  let key;
  for (key in rawOptions) {
    options[key] = rawOptions[key] === void 0 ? defaultParserOptions[key] : rawOptions[key];
  }
  return {
    options,
    column: 1,
    line: 1,
    offset: 0,
    originalSource: content,
    source: content,
    inPre: false,
    inVPre: false,
    onWarn: options.onWarn
  };
}
function parseChildren(context, mode, ancestors) {
  const parent = last(ancestors);
  const ns = parent ? parent.ns : 0;
  const nodes = [];
  while (!isEnd(context, mode, ancestors)) {
    const s = context.source;
    let node = void 0;
    if (mode === 0 || mode === 1) {
      if (!context.inVPre && startsWith(s, context.options.delimiters[0])) {
        node = parseInterpolation(context, mode);
      } else if (mode === 0 && s[0] === "<") {
        if (s.length === 1) {
          emitError(context, 5, 1);
        } else if (s[1] === "!") {
          if (startsWith(s, "<!--")) {
            node = parseComment(context);
          } else if (startsWith(s, "<!DOCTYPE")) {
            node = parseBogusComment(context);
          } else if (startsWith(s, "<![CDATA[")) {
            if (ns !== 0) {
              node = parseCDATA(context, ancestors);
            } else {
              emitError(
                context,
                1
                /* ErrorCodes.CDATA_IN_HTML_CONTENT */
              );
              node = parseBogusComment(context);
            }
          } else {
            emitError(
              context,
              11
              /* ErrorCodes.INCORRECTLY_OPENED_COMMENT */
            );
            node = parseBogusComment(context);
          }
        } else if (s[1] === "/") {
          if (s.length === 2) {
            emitError(context, 5, 2);
          } else if (s[2] === ">") {
            emitError(context, 14, 2);
            advanceBy(context, 3);
            continue;
          } else if (/[a-z]/i.test(s[2])) {
            emitError(
              context,
              23
              /* ErrorCodes.X_INVALID_END_TAG */
            );
            parseTag(context, 1, parent);
            continue;
          } else {
            emitError(context, 12, 2);
            node = parseBogusComment(context);
          }
        } else if (/[a-z]/i.test(s[1])) {
          node = parseElement(context, ancestors);
          if (isCompatEnabled("COMPILER_NATIVE_TEMPLATE", context) && node && node.tag === "template" && !node.props.some((p) => p.type === 7 && isSpecialTemplateDirective(p.name))) {
            warnDeprecation("COMPILER_NATIVE_TEMPLATE", context, node.loc);
            node = node.children;
          }
        } else if (s[1] === "?") {
          emitError(context, 21, 1);
          node = parseBogusComment(context);
        } else {
          emitError(context, 12, 1);
        }
      }
    }
    if (!node) {
      node = parseText(context, mode);
    }
    if (isArray3(node)) {
      for (let i = 0; i < node.length; i++) {
        pushNode(nodes, node[i]);
      }
    } else {
      pushNode(nodes, node);
    }
  }
  let removedWhitespace = false;
  if (mode !== 2 && mode !== 1) {
    const shouldCondense = context.options.whitespace !== "preserve";
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.type === 2) {
        if (!context.inPre) {
          if (!/[^\t\r\n\f ]/.test(node.content)) {
            const prev = nodes[i - 1];
            const next = nodes[i + 1];
            if (!prev || !next || shouldCondense && (prev.type === 3 && next.type === 3 || prev.type === 3 && next.type === 1 || prev.type === 1 && next.type === 3 || prev.type === 1 && next.type === 1 && /[\r\n]/.test(node.content))) {
              removedWhitespace = true;
              nodes[i] = null;
            } else {
              node.content = " ";
            }
          } else if (shouldCondense) {
            node.content = node.content.replace(/[\t\r\n\f ]+/g, " ");
          }
        } else {
          node.content = node.content.replace(/\r\n/g, "\n");
        }
      } else if (node.type === 3 && !context.options.comments) {
        removedWhitespace = true;
        nodes[i] = null;
      }
    }
    if (context.inPre && parent && context.options.isPreTag(parent.tag)) {
      const first = nodes[0];
      if (first && first.type === 2) {
        first.content = first.content.replace(/^\r?\n/, "");
      }
    }
  }
  return removedWhitespace ? nodes.filter(Boolean) : nodes;
}
function pushNode(nodes, node) {
  if (node.type === 2) {
    const prev = last(nodes);
    if (prev && prev.type === 2 && prev.loc.end.offset === node.loc.start.offset) {
      prev.content += node.content;
      prev.loc.end = node.loc.end;
      prev.loc.source += node.loc.source;
      return;
    }
  }
  nodes.push(node);
}
function parseCDATA(context, ancestors) {
  advanceBy(context, 9);
  const nodes = parseChildren(context, 3, ancestors);
  if (context.source.length === 0) {
    emitError(
      context,
      6
      /* ErrorCodes.EOF_IN_CDATA */
    );
  } else {
    advanceBy(context, 3);
  }
  return nodes;
}
function parseComment(context) {
  const start = getCursor(context);
  let content;
  const match = /--(\!)?>/.exec(context.source);
  if (!match) {
    content = context.source.slice(4);
    advanceBy(context, context.source.length);
    emitError(
      context,
      7
      /* ErrorCodes.EOF_IN_COMMENT */
    );
  } else {
    if (match.index <= 3) {
      emitError(
        context,
        0
        /* ErrorCodes.ABRUPT_CLOSING_OF_EMPTY_COMMENT */
      );
    }
    if (match[1]) {
      emitError(
        context,
        10
        /* ErrorCodes.INCORRECTLY_CLOSED_COMMENT */
      );
    }
    content = context.source.slice(4, match.index);
    const s = context.source.slice(0, match.index);
    let prevIndex = 1, nestedIndex = 0;
    while ((nestedIndex = s.indexOf("<!--", prevIndex)) !== -1) {
      advanceBy(context, nestedIndex - prevIndex + 1);
      if (nestedIndex + 4 < s.length) {
        emitError(
          context,
          16
          /* ErrorCodes.NESTED_COMMENT */
        );
      }
      prevIndex = nestedIndex + 1;
    }
    advanceBy(context, match.index + match[0].length - prevIndex + 1);
  }
  return {
    type: 3,
    content,
    loc: getSelection(context, start)
  };
}
function parseBogusComment(context) {
  const start = getCursor(context);
  const contentStart = context.source[1] === "?" ? 1 : 2;
  let content;
  const closeIndex = context.source.indexOf(">");
  if (closeIndex === -1) {
    content = context.source.slice(contentStart);
    advanceBy(context, context.source.length);
  } else {
    content = context.source.slice(contentStart, closeIndex);
    advanceBy(context, closeIndex + 1);
  }
  return {
    type: 3,
    content,
    loc: getSelection(context, start)
  };
}
function parseElement(context, ancestors) {
  const wasInPre = context.inPre;
  const wasInVPre = context.inVPre;
  const parent = last(ancestors);
  const element = parseTag(context, 0, parent);
  const isPreBoundary = context.inPre && !wasInPre;
  const isVPreBoundary = context.inVPre && !wasInVPre;
  if (element.isSelfClosing || context.options.isVoidTag(element.tag)) {
    if (isPreBoundary) {
      context.inPre = false;
    }
    if (isVPreBoundary) {
      context.inVPre = false;
    }
    return element;
  }
  ancestors.push(element);
  const mode = context.options.getTextMode(element, parent);
  const children = parseChildren(context, mode, ancestors);
  ancestors.pop();
  {
    const inlineTemplateProp = element.props.find((p) => p.type === 6 && p.name === "inline-template");
    if (inlineTemplateProp && checkCompatEnabled("COMPILER_INLINE_TEMPLATE", context, inlineTemplateProp.loc)) {
      const loc = getSelection(context, element.loc.end);
      inlineTemplateProp.value = {
        type: 2,
        content: loc.source,
        loc
      };
    }
  }
  element.children = children;
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, 1, parent);
  } else {
    emitError(context, 24, 0, element.loc.start);
    if (context.source.length === 0 && element.tag.toLowerCase() === "script") {
      const first = children[0];
      if (first && startsWith(first.loc.source, "<!--")) {
        emitError(
          context,
          8
          /* ErrorCodes.EOF_IN_SCRIPT_HTML_COMMENT_LIKE_TEXT */
        );
      }
    }
  }
  element.loc = getSelection(context, element.loc.start);
  if (isPreBoundary) {
    context.inPre = false;
  }
  if (isVPreBoundary) {
    context.inVPre = false;
  }
  return element;
}
var isSpecialTemplateDirective = /* @__PURE__ */ makeMap(`if,else,else-if,for,slot`);
function parseTag(context, type, parent) {
  const start = getCursor(context);
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source);
  const tag = match[1];
  const ns = context.options.getNamespace(tag, parent);
  advanceBy(context, match[0].length);
  advanceSpaces(context);
  const cursor = getCursor(context);
  const currentSource = context.source;
  if (context.options.isPreTag(tag)) {
    context.inPre = true;
  }
  let props = parseAttributes(context, type);
  if (type === 0 && !context.inVPre && props.some((p) => p.type === 7 && p.name === "pre")) {
    context.inVPre = true;
    extend(context, cursor);
    context.source = currentSource;
    props = parseAttributes(context, type).filter((p) => p.name !== "v-pre");
  }
  let isSelfClosing = false;
  if (context.source.length === 0) {
    emitError(
      context,
      9
      /* ErrorCodes.EOF_IN_TAG */
    );
  } else {
    isSelfClosing = startsWith(context.source, "/>");
    if (type === 1 && isSelfClosing) {
      emitError(
        context,
        4
        /* ErrorCodes.END_TAG_WITH_TRAILING_SOLIDUS */
      );
    }
    advanceBy(context, isSelfClosing ? 2 : 1);
  }
  if (type === 1) {
    return;
  }
  if (isCompatEnabled("COMPILER_V_IF_V_FOR_PRECEDENCE", context)) {
    let hasIf = false;
    let hasFor = false;
    for (let i = 0; i < props.length; i++) {
      const p = props[i];
      if (p.type === 7) {
        if (p.name === "if") {
          hasIf = true;
        } else if (p.name === "for") {
          hasFor = true;
        }
      }
      if (hasIf && hasFor) {
        warnDeprecation("COMPILER_V_IF_V_FOR_PRECEDENCE", context, getSelection(context, start));
        break;
      }
    }
  }
  let tagType = 0;
  if (!context.inVPre) {
    if (tag === "slot") {
      tagType = 2;
    } else if (tag === "template") {
      if (props.some((p) => p.type === 7 && isSpecialTemplateDirective(p.name))) {
        tagType = 3;
      }
    } else if (isComponent(tag, props, context)) {
      tagType = 1;
    }
  }
  return {
    type: 1,
    ns,
    tag,
    tagType,
    props,
    isSelfClosing,
    children: [],
    loc: getSelection(context, start),
    codegenNode: void 0
    // to be created during transform phase
  };
}
function isComponent(tag, props, context) {
  const options = context.options;
  if (options.isCustomElement(tag)) {
    return false;
  }
  if (tag === "component" || /^[A-Z]/.test(tag) || isCoreComponent(tag) || options.isBuiltInComponent && options.isBuiltInComponent(tag) || options.isNativeTag && !options.isNativeTag(tag)) {
    return true;
  }
  for (let i = 0; i < props.length; i++) {
    const p = props[i];
    if (p.type === 6) {
      if (p.name === "is" && p.value) {
        if (p.value.content.startsWith("vue:")) {
          return true;
        } else if (checkCompatEnabled("COMPILER_IS_ON_ELEMENT", context, p.loc)) {
          return true;
        }
      }
    } else {
      if (p.name === "is") {
        return true;
      } else if (// :is on plain element - only treat as component in compat mode
      p.name === "bind" && isStaticArgOf(p.arg, "is") && true && checkCompatEnabled("COMPILER_IS_ON_ELEMENT", context, p.loc)) {
        return true;
      }
    }
  }
}
function parseAttributes(context, type) {
  const props = [];
  const attributeNames = /* @__PURE__ */ new Set();
  while (context.source.length > 0 && !startsWith(context.source, ">") && !startsWith(context.source, "/>")) {
    if (startsWith(context.source, "/")) {
      emitError(
        context,
        22
        /* ErrorCodes.UNEXPECTED_SOLIDUS_IN_TAG */
      );
      advanceBy(context, 1);
      advanceSpaces(context);
      continue;
    }
    if (type === 1) {
      emitError(
        context,
        3
        /* ErrorCodes.END_TAG_WITH_ATTRIBUTES */
      );
    }
    const attr = parseAttribute(context, attributeNames);
    if (attr.type === 6 && attr.value && attr.name === "class") {
      attr.value.content = attr.value.content.replace(/\s+/g, " ").trim();
    }
    if (type === 0) {
      props.push(attr);
    }
    if (/^[^\t\r\n\f />]/.test(context.source)) {
      emitError(
        context,
        15
        /* ErrorCodes.MISSING_WHITESPACE_BETWEEN_ATTRIBUTES */
      );
    }
    advanceSpaces(context);
  }
  return props;
}
function parseAttribute(context, nameSet) {
  const start = getCursor(context);
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
  const name = match[0];
  if (nameSet.has(name)) {
    emitError(
      context,
      2
      /* ErrorCodes.DUPLICATE_ATTRIBUTE */
    );
  }
  nameSet.add(name);
  if (name[0] === "=") {
    emitError(
      context,
      19
      /* ErrorCodes.UNEXPECTED_EQUALS_SIGN_BEFORE_ATTRIBUTE_NAME */
    );
  }
  {
    const pattern = /["'<]/g;
    let m;
    while (m = pattern.exec(name)) {
      emitError(context, 17, m.index);
    }
  }
  advanceBy(context, name.length);
  let value = void 0;
  if (/^[\t\r\n\f ]*=/.test(context.source)) {
    advanceSpaces(context);
    advanceBy(context, 1);
    advanceSpaces(context);
    value = parseAttributeValue(context);
    if (!value) {
      emitError(
        context,
        13
        /* ErrorCodes.MISSING_ATTRIBUTE_VALUE */
      );
    }
  }
  const loc = getSelection(context, start);
  if (!context.inVPre && /^(v-[A-Za-z0-9-]|:|\.|@|#)/.test(name)) {
    const match2 = /(?:^v-([a-z0-9-]+))?(?:(?::|^\.|^@|^#)(\[[^\]]+\]|[^\.]+))?(.+)?$/i.exec(name);
    let isPropShorthand = startsWith(name, ".");
    let dirName = match2[1] || (isPropShorthand || startsWith(name, ":") ? "bind" : startsWith(name, "@") ? "on" : "slot");
    let arg;
    if (match2[2]) {
      const isSlot = dirName === "slot";
      const startOffset = name.lastIndexOf(match2[2]);
      const loc2 = getSelection(context, getNewPosition(context, start, startOffset), getNewPosition(context, start, startOffset + match2[2].length + (isSlot && match2[3] || "").length));
      let content = match2[2];
      let isStatic = true;
      if (content.startsWith("[")) {
        isStatic = false;
        if (!content.endsWith("]")) {
          emitError(
            context,
            27
            /* ErrorCodes.X_MISSING_DYNAMIC_DIRECTIVE_ARGUMENT_END */
          );
          content = content.slice(1);
        } else {
          content = content.slice(1, content.length - 1);
        }
      } else if (isSlot) {
        content += match2[3] || "";
      }
      arg = {
        type: 4,
        content,
        isStatic,
        constType: isStatic ? 3 : 0,
        loc: loc2
      };
    }
    if (value && value.isQuoted) {
      const valueLoc = value.loc;
      valueLoc.start.offset++;
      valueLoc.start.column++;
      valueLoc.end = advancePositionWithClone(valueLoc.start, value.content);
      valueLoc.source = valueLoc.source.slice(1, -1);
    }
    const modifiers = match2[3] ? match2[3].slice(1).split(".") : [];
    if (isPropShorthand)
      modifiers.push("prop");
    if (dirName === "bind" && arg) {
      if (modifiers.includes("sync") && checkCompatEnabled("COMPILER_V_BIND_SYNC", context, loc, arg.loc.source)) {
        dirName = "model";
        modifiers.splice(modifiers.indexOf("sync"), 1);
      }
      if (modifiers.includes("prop")) {
        checkCompatEnabled("COMPILER_V_BIND_PROP", context, loc);
      }
    }
    return {
      type: 7,
      name: dirName,
      exp: value && {
        type: 4,
        content: value.content,
        isStatic: false,
        // Treat as non-constant by default. This can be potentially set to
        // other values by `transformExpression` to make it eligible for hoisting.
        constType: 0,
        loc: value.loc
      },
      arg,
      modifiers,
      loc
    };
  }
  if (!context.inVPre && startsWith(name, "v-")) {
    emitError(
      context,
      26
      /* ErrorCodes.X_MISSING_DIRECTIVE_NAME */
    );
  }
  return {
    type: 6,
    name,
    value: value && {
      type: 2,
      content: value.content,
      loc: value.loc
    },
    loc
  };
}
function parseAttributeValue(context) {
  const start = getCursor(context);
  let content;
  const quote = context.source[0];
  const isQuoted = quote === `"` || quote === `'`;
  if (isQuoted) {
    advanceBy(context, 1);
    const endIndex = context.source.indexOf(quote);
    if (endIndex === -1) {
      content = parseTextData(
        context,
        context.source.length,
        4
        /* TextModes.ATTRIBUTE_VALUE */
      );
    } else {
      content = parseTextData(
        context,
        endIndex,
        4
        /* TextModes.ATTRIBUTE_VALUE */
      );
      advanceBy(context, 1);
    }
  } else {
    const match = /^[^\t\r\n\f >]+/.exec(context.source);
    if (!match) {
      return void 0;
    }
    const unexpectedChars = /["'<=`]/g;
    let m;
    while (m = unexpectedChars.exec(match[0])) {
      emitError(context, 18, m.index);
    }
    content = parseTextData(
      context,
      match[0].length,
      4
      /* TextModes.ATTRIBUTE_VALUE */
    );
  }
  return { content, isQuoted, loc: getSelection(context, start) };
}
function parseInterpolation(context, mode) {
  const [open, close] = context.options.delimiters;
  const closeIndex = context.source.indexOf(close, open.length);
  if (closeIndex === -1) {
    emitError(
      context,
      25
      /* ErrorCodes.X_MISSING_INTERPOLATION_END */
    );
    return void 0;
  }
  const start = getCursor(context);
  advanceBy(context, open.length);
  const innerStart = getCursor(context);
  const innerEnd = getCursor(context);
  const rawContentLength = closeIndex - open.length;
  const rawContent = context.source.slice(0, rawContentLength);
  const preTrimContent = parseTextData(context, rawContentLength, mode);
  const content = preTrimContent.trim();
  const startOffset = preTrimContent.indexOf(content);
  if (startOffset > 0) {
    advancePositionWithMutation(innerStart, rawContent, startOffset);
  }
  const endOffset = rawContentLength - (preTrimContent.length - content.length - startOffset);
  advancePositionWithMutation(innerEnd, rawContent, endOffset);
  advanceBy(context, close.length);
  return {
    type: 5,
    content: {
      type: 4,
      isStatic: false,
      // Set `isConstant` to false by default and will decide in transformExpression
      constType: 0,
      content,
      loc: getSelection(context, innerStart, innerEnd)
    },
    loc: getSelection(context, start)
  };
}
function parseText(context, mode) {
  const endTokens = mode === 3 ? ["]]>"] : ["<", context.options.delimiters[0]];
  let endIndex = context.source.length;
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }
  const start = getCursor(context);
  const content = parseTextData(context, endIndex, mode);
  return {
    type: 2,
    content,
    loc: getSelection(context, start)
  };
}
function parseTextData(context, length, mode) {
  const rawText = context.source.slice(0, length);
  advanceBy(context, length);
  if (mode === 2 || mode === 3 || !rawText.includes("&")) {
    return rawText;
  } else {
    return context.options.decodeEntities(
      rawText,
      mode === 4
      /* TextModes.ATTRIBUTE_VALUE */
    );
  }
}
function getCursor(context) {
  const { column, line, offset } = context;
  return { column, line, offset };
}
function getSelection(context, start, end) {
  end = end || getCursor(context);
  return {
    start,
    end,
    source: context.originalSource.slice(start.offset, end.offset)
  };
}
function last(xs) {
  return xs[xs.length - 1];
}
function startsWith(source, searchString) {
  return source.startsWith(searchString);
}
function advanceBy(context, numberOfCharacters) {
  const { source } = context;
  advancePositionWithMutation(context, source, numberOfCharacters);
  context.source = source.slice(numberOfCharacters);
}
function advanceSpaces(context) {
  const match = /^[\t\r\n\f ]+/.exec(context.source);
  if (match) {
    advanceBy(context, match[0].length);
  }
}
function getNewPosition(context, start, numberOfCharacters) {
  return advancePositionWithClone(start, context.originalSource.slice(start.offset, numberOfCharacters), numberOfCharacters);
}
function emitError(context, code, offset, loc = getCursor(context)) {
  if (offset) {
    loc.offset += offset;
    loc.column += offset;
  }
  context.options.onError(createCompilerError(code, {
    start: loc,
    end: loc,
    source: ""
  }));
}
function isEnd(context, mode, ancestors) {
  const s = context.source;
  switch (mode) {
    case 0:
      if (startsWith(s, "</")) {
        for (let i = ancestors.length - 1; i >= 0; --i) {
          if (startsWithEndTagOpen(s, ancestors[i].tag)) {
            return true;
          }
        }
      }
      break;
    case 1:
    case 2: {
      const parent = last(ancestors);
      if (parent && startsWithEndTagOpen(s, parent.tag)) {
        return true;
      }
      break;
    }
    case 3:
      if (startsWith(s, "]]>")) {
        return true;
      }
      break;
  }
  return !s;
}
function startsWithEndTagOpen(source, tag) {
  return startsWith(source, "</") && source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase() && /[\t\r\n\f />]/.test(source[2 + tag.length] || ">");
}
function hoistStatic(root, context) {
  walk(
    root,
    context,
    // Root node is unfortunately non-hoistable due to potential parent
    // fallthrough attributes.
    isSingleElementRoot(root, root.children[0])
  );
}
function isSingleElementRoot(root, child) {
  const { children } = root;
  return children.length === 1 && child.type === 1 && !isSlotOutlet(child);
}
function walk(node, context, doNotHoistNode = false) {
  const { children } = node;
  const originalCount = children.length;
  let hoistedCount = 0;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type === 1 && child.tagType === 0) {
      const constantType = doNotHoistNode ? 0 : getConstantType(child, context);
      if (constantType > 0) {
        if (constantType >= 2) {
          child.codegenNode.patchFlag = -1 + (true ? ` /* HOISTED */` : ``);
          child.codegenNode = context.hoist(child.codegenNode);
          hoistedCount++;
          continue;
        }
      } else {
        const codegenNode = child.codegenNode;
        if (codegenNode.type === 13) {
          const flag = getPatchFlag(codegenNode);
          if ((!flag || flag === 512 || flag === 1) && getGeneratedPropsConstantType(child, context) >= 2) {
            const props = getNodeProps(child);
            if (props) {
              codegenNode.props = context.hoist(props);
            }
          }
          if (codegenNode.dynamicProps) {
            codegenNode.dynamicProps = context.hoist(codegenNode.dynamicProps);
          }
        }
      }
    }
    if (child.type === 1) {
      const isComponent2 = child.tagType === 1;
      if (isComponent2) {
        context.scopes.vSlot++;
      }
      walk(child, context);
      if (isComponent2) {
        context.scopes.vSlot--;
      }
    } else if (child.type === 11) {
      walk(child, context, child.children.length === 1);
    } else if (child.type === 9) {
      for (let i2 = 0; i2 < child.branches.length; i2++) {
        walk(child.branches[i2], context, child.branches[i2].children.length === 1);
      }
    }
  }
  if (hoistedCount && context.transformHoist) {
    context.transformHoist(children, context, node);
  }
  if (hoistedCount && hoistedCount === originalCount && node.type === 1 && node.tagType === 0 && node.codegenNode && node.codegenNode.type === 13 && isArray3(node.codegenNode.children)) {
    node.codegenNode.children = context.hoist(createArrayExpression(node.codegenNode.children));
  }
}
function getConstantType(node, context) {
  const { constantCache } = context;
  switch (node.type) {
    case 1:
      if (node.tagType !== 0) {
        return 0;
      }
      const cached = constantCache.get(node);
      if (cached !== void 0) {
        return cached;
      }
      const codegenNode = node.codegenNode;
      if (codegenNode.type !== 13) {
        return 0;
      }
      if (codegenNode.isBlock && node.tag !== "svg" && node.tag !== "foreignObject") {
        return 0;
      }
      const flag = getPatchFlag(codegenNode);
      if (!flag) {
        let returnType2 = 3;
        const generatedPropsType = getGeneratedPropsConstantType(node, context);
        if (generatedPropsType === 0) {
          constantCache.set(
            node,
            0
            /* ConstantTypes.NOT_CONSTANT */
          );
          return 0;
        }
        if (generatedPropsType < returnType2) {
          returnType2 = generatedPropsType;
        }
        for (let i = 0; i < node.children.length; i++) {
          const childType = getConstantType(node.children[i], context);
          if (childType === 0) {
            constantCache.set(
              node,
              0
              /* ConstantTypes.NOT_CONSTANT */
            );
            return 0;
          }
          if (childType < returnType2) {
            returnType2 = childType;
          }
        }
        if (returnType2 > 1) {
          for (let i = 0; i < node.props.length; i++) {
            const p = node.props[i];
            if (p.type === 7 && p.name === "bind" && p.exp) {
              const expType = getConstantType(p.exp, context);
              if (expType === 0) {
                constantCache.set(
                  node,
                  0
                  /* ConstantTypes.NOT_CONSTANT */
                );
                return 0;
              }
              if (expType < returnType2) {
                returnType2 = expType;
              }
            }
          }
        }
        if (codegenNode.isBlock) {
          for (let i = 0; i < node.props.length; i++) {
            const p = node.props[i];
            if (p.type === 7) {
              constantCache.set(
                node,
                0
                /* ConstantTypes.NOT_CONSTANT */
              );
              return 0;
            }
          }
          context.removeHelper(OPEN_BLOCK);
          context.removeHelper(getVNodeBlockHelper(context.inSSR, codegenNode.isComponent));
          codegenNode.isBlock = false;
          context.helper(getVNodeHelper(context.inSSR, codegenNode.isComponent));
        }
        constantCache.set(node, returnType2);
        return returnType2;
      } else {
        constantCache.set(
          node,
          0
          /* ConstantTypes.NOT_CONSTANT */
        );
        return 0;
      }
    case 2:
    case 3:
      return 3;
    case 9:
    case 11:
    case 10:
      return 0;
    case 5:
    case 12:
      return getConstantType(node.content, context);
    case 4:
      return node.constType;
    case 8:
      let returnType = 3;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (isString3(child) || isSymbol(child)) {
          continue;
        }
        const childType = getConstantType(child, context);
        if (childType === 0) {
          return 0;
        } else if (childType < returnType) {
          returnType = childType;
        }
      }
      return returnType;
    default:
      if (true)
        ;
      return 0;
  }
}
var allowHoistedHelperSet = /* @__PURE__ */ new Set([
  NORMALIZE_CLASS,
  NORMALIZE_STYLE,
  NORMALIZE_PROPS,
  GUARD_REACTIVE_PROPS
]);
function getConstantTypeOfHelperCall(value, context) {
  if (value.type === 14 && !isString3(value.callee) && allowHoistedHelperSet.has(value.callee)) {
    const arg = value.arguments[0];
    if (arg.type === 4) {
      return getConstantType(arg, context);
    } else if (arg.type === 14) {
      return getConstantTypeOfHelperCall(arg, context);
    }
  }
  return 0;
}
function getGeneratedPropsConstantType(node, context) {
  let returnType = 3;
  const props = getNodeProps(node);
  if (props && props.type === 15) {
    const { properties } = props;
    for (let i = 0; i < properties.length; i++) {
      const { key, value } = properties[i];
      const keyType = getConstantType(key, context);
      if (keyType === 0) {
        return keyType;
      }
      if (keyType < returnType) {
        returnType = keyType;
      }
      let valueType;
      if (value.type === 4) {
        valueType = getConstantType(value, context);
      } else if (value.type === 14) {
        valueType = getConstantTypeOfHelperCall(value, context);
      } else {
        valueType = 0;
      }
      if (valueType === 0) {
        return valueType;
      }
      if (valueType < returnType) {
        returnType = valueType;
      }
    }
  }
  return returnType;
}
function getNodeProps(node) {
  const codegenNode = node.codegenNode;
  if (codegenNode.type === 13) {
    return codegenNode.props;
  }
}
function getPatchFlag(node) {
  const flag = node.patchFlag;
  return flag ? parseInt(flag, 10) : void 0;
}
function createTransformContext(root, { filename = "", prefixIdentifiers = false, hoistStatic: hoistStatic2 = false, cacheHandlers = false, nodeTransforms = [], directiveTransforms = {}, transformHoist = null, isBuiltInComponent = NOOP2, isCustomElement = NOOP2, expressionPlugins = [], scopeId = null, slotted = true, ssr = false, inSSR = false, ssrCssVars = ``, bindingMetadata = EMPTY_OBJ2, inline = false, isTS = false, onError = defaultOnError, onWarn = defaultOnWarn, compatConfig }) {
  const nameMatch = filename.replace(/\?.*$/, "").match(/([^/\\]+)\.\w+$/);
  const context = {
    // options
    selfName: nameMatch && capitalize(camelize3(nameMatch[1])),
    prefixIdentifiers,
    hoistStatic: hoistStatic2,
    cacheHandlers,
    nodeTransforms,
    directiveTransforms,
    transformHoist,
    isBuiltInComponent,
    isCustomElement,
    expressionPlugins,
    scopeId,
    slotted,
    ssr,
    inSSR,
    ssrCssVars,
    bindingMetadata,
    inline,
    isTS,
    onError,
    onWarn,
    compatConfig,
    // state
    root,
    helpers: /* @__PURE__ */ new Map(),
    components: /* @__PURE__ */ new Set(),
    directives: /* @__PURE__ */ new Set(),
    hoists: [],
    imports: [],
    constantCache: /* @__PURE__ */ new Map(),
    temps: 0,
    cached: 0,
    identifiers: /* @__PURE__ */ Object.create(null),
    scopes: {
      vFor: 0,
      vSlot: 0,
      vPre: 0,
      vOnce: 0
    },
    parent: null,
    currentNode: root,
    childIndex: 0,
    inVOnce: false,
    // methods
    helper(name) {
      const count = context.helpers.get(name) || 0;
      context.helpers.set(name, count + 1);
      return name;
    },
    removeHelper(name) {
      const count = context.helpers.get(name);
      if (count) {
        const currentCount = count - 1;
        if (!currentCount) {
          context.helpers.delete(name);
        } else {
          context.helpers.set(name, currentCount);
        }
      }
    },
    helperString(name) {
      return `_${helperNameMap[context.helper(name)]}`;
    },
    replaceNode(node) {
      if (true) {
        if (!context.currentNode) {
          throw new Error(`Node being replaced is already removed.`);
        }
        if (!context.parent) {
          throw new Error(`Cannot replace root node.`);
        }
      }
      context.parent.children[context.childIndex] = context.currentNode = node;
    },
    removeNode(node) {
      if (!context.parent) {
        throw new Error(`Cannot remove root node.`);
      }
      const list = context.parent.children;
      const removalIndex = node ? list.indexOf(node) : context.currentNode ? context.childIndex : -1;
      if (removalIndex < 0) {
        throw new Error(`node being removed is not a child of current parent`);
      }
      if (!node || node === context.currentNode) {
        context.currentNode = null;
        context.onNodeRemoved();
      } else {
        if (context.childIndex > removalIndex) {
          context.childIndex--;
          context.onNodeRemoved();
        }
      }
      context.parent.children.splice(removalIndex, 1);
    },
    onNodeRemoved: () => {
    },
    addIdentifiers(exp) {
    },
    removeIdentifiers(exp) {
    },
    hoist(exp) {
      if (isString3(exp))
        exp = createSimpleExpression(exp);
      context.hoists.push(exp);
      const identifier = createSimpleExpression(
        `_hoisted_${context.hoists.length}`,
        false,
        exp.loc,
        2
        /* ConstantTypes.CAN_HOIST */
      );
      identifier.hoisted = exp;
      return identifier;
    },
    cache(exp, isVNode = false) {
      return createCacheExpression(context.cached++, exp, isVNode);
    }
  };
  {
    context.filters = /* @__PURE__ */ new Set();
  }
  return context;
}
function transform(root, options) {
  const context = createTransformContext(root, options);
  traverseNode(root, context);
  if (options.hoistStatic) {
    hoistStatic(root, context);
  }
  if (!options.ssr) {
    createRootCodegen(root, context);
  }
  root.helpers = [...context.helpers.keys()];
  root.components = [...context.components];
  root.directives = [...context.directives];
  root.imports = context.imports;
  root.hoists = context.hoists;
  root.temps = context.temps;
  root.cached = context.cached;
  {
    root.filters = [...context.filters];
  }
}
function createRootCodegen(root, context) {
  const { helper } = context;
  const { children } = root;
  if (children.length === 1) {
    const child = children[0];
    if (isSingleElementRoot(root, child) && child.codegenNode) {
      const codegenNode = child.codegenNode;
      if (codegenNode.type === 13) {
        makeBlock(codegenNode, context);
      }
      root.codegenNode = codegenNode;
    } else {
      root.codegenNode = child;
    }
  } else if (children.length > 1) {
    let patchFlag = 64;
    let patchFlagText = PatchFlagNames[
      64
      /* PatchFlags.STABLE_FRAGMENT */
    ];
    if (children.filter(
      (c) => c.type !== 3
      /* NodeTypes.COMMENT */
    ).length === 1) {
      patchFlag |= 2048;
      patchFlagText += `, ${PatchFlagNames[
        2048
        /* PatchFlags.DEV_ROOT_FRAGMENT */
      ]}`;
    }
    root.codegenNode = createVNodeCall(
      context,
      helper(FRAGMENT),
      void 0,
      root.children,
      patchFlag + (true ? ` /* ${patchFlagText} */` : ``),
      void 0,
      void 0,
      true,
      void 0,
      false
      /* isComponent */
    );
  } else
    ;
}
function traverseChildren(parent, context) {
  let i = 0;
  const nodeRemoved = () => {
    i--;
  };
  for (; i < parent.children.length; i++) {
    const child = parent.children[i];
    if (isString3(child))
      continue;
    context.parent = parent;
    context.childIndex = i;
    context.onNodeRemoved = nodeRemoved;
    traverseNode(child, context);
  }
}
function traverseNode(node, context) {
  context.currentNode = node;
  const { nodeTransforms } = context;
  const exitFns = [];
  for (let i2 = 0; i2 < nodeTransforms.length; i2++) {
    const onExit = nodeTransforms[i2](node, context);
    if (onExit) {
      if (isArray3(onExit)) {
        exitFns.push(...onExit);
      } else {
        exitFns.push(onExit);
      }
    }
    if (!context.currentNode) {
      return;
    } else {
      node = context.currentNode;
    }
  }
  switch (node.type) {
    case 3:
      if (!context.ssr) {
        context.helper(CREATE_COMMENT);
      }
      break;
    case 5:
      if (!context.ssr) {
        context.helper(TO_DISPLAY_STRING);
      }
      break;
    case 9:
      for (let i2 = 0; i2 < node.branches.length; i2++) {
        traverseNode(node.branches[i2], context);
      }
      break;
    case 10:
    case 11:
    case 1:
    case 0:
      traverseChildren(node, context);
      break;
  }
  context.currentNode = node;
  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}
function createStructuralDirectiveTransform(name, fn) {
  const matches = isString3(name) ? (n) => n === name : (n) => name.test(n);
  return (node, context) => {
    if (node.type === 1) {
      const { props } = node;
      if (node.tagType === 3 && props.some(isVSlot)) {
        return;
      }
      const exitFns = [];
      for (let i = 0; i < props.length; i++) {
        const prop = props[i];
        if (prop.type === 7 && matches(prop.name)) {
          props.splice(i, 1);
          i--;
          const onExit = fn(node, prop, context);
          if (onExit)
            exitFns.push(onExit);
        }
      }
      return exitFns;
    }
  };
}
var PURE_ANNOTATION = `/*#__PURE__*/`;
var aliasHelper = (s) => `${helperNameMap[s]}: _${helperNameMap[s]}`;
function createCodegenContext(ast, { mode = "function", prefixIdentifiers = mode === "module", sourceMap = false, filename = `template.vue.html`, scopeId = null, optimizeImports = false, runtimeGlobalName = `Vue`, runtimeModuleName = `vue`, ssrRuntimeModuleName = "vue/server-renderer", ssr = false, isTS = false, inSSR = false }) {
  const context = {
    mode,
    prefixIdentifiers,
    sourceMap,
    filename,
    scopeId,
    optimizeImports,
    runtimeGlobalName,
    runtimeModuleName,
    ssrRuntimeModuleName,
    ssr,
    isTS,
    inSSR,
    source: ast.loc.source,
    code: ``,
    column: 1,
    line: 1,
    offset: 0,
    indentLevel: 0,
    pure: false,
    map: void 0,
    helper(key) {
      return `_${helperNameMap[key]}`;
    },
    push(code, node) {
      context.code += code;
    },
    indent() {
      newline(++context.indentLevel);
    },
    deindent(withoutNewLine = false) {
      if (withoutNewLine) {
        --context.indentLevel;
      } else {
        newline(--context.indentLevel);
      }
    },
    newline() {
      newline(context.indentLevel);
    }
  };
  function newline(n) {
    context.push("\n" + `  `.repeat(n));
  }
  return context;
}
function generate(ast, options = {}) {
  const context = createCodegenContext(ast, options);
  if (options.onContextCreated)
    options.onContextCreated(context);
  const { mode, push, prefixIdentifiers, indent, deindent, newline, scopeId, ssr } = context;
  const hasHelpers = ast.helpers.length > 0;
  const useWithBlock = !prefixIdentifiers && mode !== "module";
  const preambleContext = context;
  {
    genFunctionPreamble(ast, preambleContext);
  }
  const functionName = ssr ? `ssrRender` : `render`;
  const args = ssr ? ["_ctx", "_push", "_parent", "_attrs"] : ["_ctx", "_cache"];
  const signature = args.join(", ");
  {
    push(`function ${functionName}(${signature}) {`);
  }
  indent();
  if (useWithBlock) {
    push(`with (_ctx) {`);
    indent();
    if (hasHelpers) {
      push(`const { ${ast.helpers.map(aliasHelper).join(", ")} } = _Vue`);
      push(`
`);
      newline();
    }
  }
  if (ast.components.length) {
    genAssets(ast.components, "component", context);
    if (ast.directives.length || ast.temps > 0) {
      newline();
    }
  }
  if (ast.directives.length) {
    genAssets(ast.directives, "directive", context);
    if (ast.temps > 0) {
      newline();
    }
  }
  if (ast.filters && ast.filters.length) {
    newline();
    genAssets(ast.filters, "filter", context);
    newline();
  }
  if (ast.temps > 0) {
    push(`let `);
    for (let i = 0; i < ast.temps; i++) {
      push(`${i > 0 ? `, ` : ``}_temp${i}`);
    }
  }
  if (ast.components.length || ast.directives.length || ast.temps) {
    push(`
`);
    newline();
  }
  if (!ssr) {
    push(`return `);
  }
  if (ast.codegenNode) {
    genNode(ast.codegenNode, context);
  } else {
    push(`null`);
  }
  if (useWithBlock) {
    deindent();
    push(`}`);
  }
  deindent();
  push(`}`);
  return {
    ast,
    code: context.code,
    preamble: ``,
    // SourceMapGenerator does have toJSON() method but it's not in the types
    map: context.map ? context.map.toJSON() : void 0
  };
}
function genFunctionPreamble(ast, context) {
  const { ssr, prefixIdentifiers, push, newline, runtimeModuleName, runtimeGlobalName, ssrRuntimeModuleName } = context;
  const VueBinding = runtimeGlobalName;
  if (ast.helpers.length > 0) {
    {
      push(`const _Vue = ${VueBinding}
`);
      if (ast.hoists.length) {
        const staticHelpers = [
          CREATE_VNODE,
          CREATE_ELEMENT_VNODE,
          CREATE_COMMENT,
          CREATE_TEXT,
          CREATE_STATIC
        ].filter((helper) => ast.helpers.includes(helper)).map(aliasHelper).join(", ");
        push(`const { ${staticHelpers} } = _Vue
`);
      }
    }
  }
  genHoists(ast.hoists, context);
  newline();
  push(`return `);
}
function genAssets(assets, type, { helper, push, newline, isTS }) {
  const resolver = helper(type === "filter" ? RESOLVE_FILTER : type === "component" ? RESOLVE_COMPONENT : RESOLVE_DIRECTIVE);
  for (let i = 0; i < assets.length; i++) {
    let id = assets[i];
    const maybeSelfReference = id.endsWith("__self");
    if (maybeSelfReference) {
      id = id.slice(0, -6);
    }
    push(`const ${toValidAssetId(id, type)} = ${resolver}(${JSON.stringify(id)}${maybeSelfReference ? `, true` : ``})${isTS ? `!` : ``}`);
    if (i < assets.length - 1) {
      newline();
    }
  }
}
function genHoists(hoists, context) {
  if (!hoists.length) {
    return;
  }
  context.pure = true;
  const { push, newline, helper, scopeId, mode } = context;
  newline();
  for (let i = 0; i < hoists.length; i++) {
    const exp = hoists[i];
    if (exp) {
      push(`const _hoisted_${i + 1} = ${``}`);
      genNode(exp, context);
      newline();
    }
  }
  context.pure = false;
}
function isText$1(n) {
  return isString3(n) || n.type === 4 || n.type === 2 || n.type === 5 || n.type === 8;
}
function genNodeListAsArray(nodes, context) {
  const multilines = nodes.length > 3 || nodes.some((n) => isArray3(n) || !isText$1(n));
  context.push(`[`);
  multilines && context.indent();
  genNodeList(nodes, context, multilines);
  multilines && context.deindent();
  context.push(`]`);
}
function genNodeList(nodes, context, multilines = false, comma = true) {
  const { push, newline } = context;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (isString3(node)) {
      push(node);
    } else if (isArray3(node)) {
      genNodeListAsArray(node, context);
    } else {
      genNode(node, context);
    }
    if (i < nodes.length - 1) {
      if (multilines) {
        comma && push(",");
        newline();
      } else {
        comma && push(", ");
      }
    }
  }
}
function genNode(node, context) {
  if (isString3(node)) {
    context.push(node);
    return;
  }
  if (isSymbol(node)) {
    context.push(context.helper(node));
    return;
  }
  switch (node.type) {
    case 1:
    case 9:
    case 11:
      assert(node.codegenNode != null, `Codegen node is missing for element/if/for node. Apply appropriate transforms first.`);
      genNode(node.codegenNode, context);
      break;
    case 2:
      genText(node, context);
      break;
    case 4:
      genExpression(node, context);
      break;
    case 5:
      genInterpolation(node, context);
      break;
    case 12:
      genNode(node.codegenNode, context);
      break;
    case 8:
      genCompoundExpression(node, context);
      break;
    case 3:
      genComment(node, context);
      break;
    case 13:
      genVNodeCall(node, context);
      break;
    case 14:
      genCallExpression(node, context);
      break;
    case 15:
      genObjectExpression(node, context);
      break;
    case 17:
      genArrayExpression(node, context);
      break;
    case 18:
      genFunctionExpression(node, context);
      break;
    case 19:
      genConditionalExpression(node, context);
      break;
    case 20:
      genCacheExpression(node, context);
      break;
    case 21:
      genNodeList(node.body, context, true, false);
      break;
    case 22:
      break;
    case 23:
      break;
    case 24:
      break;
    case 25:
      break;
    case 26:
      break;
    case 10:
      break;
    default:
      if (true) {
        assert(false, `unhandled codegen node type: ${node.type}`);
        const exhaustiveCheck = node;
        return exhaustiveCheck;
      }
  }
}
function genText(node, context) {
  context.push(JSON.stringify(node.content), node);
}
function genExpression(node, context) {
  const { content, isStatic } = node;
  context.push(isStatic ? JSON.stringify(content) : content, node);
}
function genInterpolation(node, context) {
  const { push, helper, pure } = context;
  if (pure)
    push(PURE_ANNOTATION);
  push(`${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(`)`);
}
function genCompoundExpression(node, context) {
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (isString3(child)) {
      context.push(child);
    } else {
      genNode(child, context);
    }
  }
}
function genExpressionAsPropertyKey(node, context) {
  const { push } = context;
  if (node.type === 8) {
    push(`[`);
    genCompoundExpression(node, context);
    push(`]`);
  } else if (node.isStatic) {
    const text = isSimpleIdentifier(node.content) ? node.content : JSON.stringify(node.content);
    push(text, node);
  } else {
    push(`[${node.content}]`, node);
  }
}
function genComment(node, context) {
  const { push, helper, pure } = context;
  if (pure) {
    push(PURE_ANNOTATION);
  }
  push(`${helper(CREATE_COMMENT)}(${JSON.stringify(node.content)})`, node);
}
function genVNodeCall(node, context) {
  const { push, helper, pure } = context;
  const { tag, props, children, patchFlag, dynamicProps, directives, isBlock, disableTracking, isComponent: isComponent2 } = node;
  if (directives) {
    push(helper(WITH_DIRECTIVES) + `(`);
  }
  if (isBlock) {
    push(`(${helper(OPEN_BLOCK)}(${disableTracking ? `true` : ``}), `);
  }
  if (pure) {
    push(PURE_ANNOTATION);
  }
  const callHelper = isBlock ? getVNodeBlockHelper(context.inSSR, isComponent2) : getVNodeHelper(context.inSSR, isComponent2);
  push(helper(callHelper) + `(`, node);
  genNodeList(genNullableArgs([tag, props, children, patchFlag, dynamicProps]), context);
  push(`)`);
  if (isBlock) {
    push(`)`);
  }
  if (directives) {
    push(`, `);
    genNode(directives, context);
    push(`)`);
  }
}
function genNullableArgs(args) {
  let i = args.length;
  while (i--) {
    if (args[i] != null)
      break;
  }
  return args.slice(0, i + 1).map((arg) => arg || `null`);
}
function genCallExpression(node, context) {
  const { push, helper, pure } = context;
  const callee = isString3(node.callee) ? node.callee : helper(node.callee);
  if (pure) {
    push(PURE_ANNOTATION);
  }
  push(callee + `(`, node);
  genNodeList(node.arguments, context);
  push(`)`);
}
function genObjectExpression(node, context) {
  const { push, indent, deindent, newline } = context;
  const { properties } = node;
  if (!properties.length) {
    push(`{}`, node);
    return;
  }
  const multilines = properties.length > 1 || properties.some(
    (p) => p.value.type !== 4
    /* NodeTypes.SIMPLE_EXPRESSION */
  );
  push(multilines ? `{` : `{ `);
  multilines && indent();
  for (let i = 0; i < properties.length; i++) {
    const { key, value } = properties[i];
    genExpressionAsPropertyKey(key, context);
    push(`: `);
    genNode(value, context);
    if (i < properties.length - 1) {
      push(`,`);
      newline();
    }
  }
  multilines && deindent();
  push(multilines ? `}` : ` }`);
}
function genArrayExpression(node, context) {
  genNodeListAsArray(node.elements, context);
}
function genFunctionExpression(node, context) {
  const { push, indent, deindent } = context;
  const { params, returns, body, newline, isSlot } = node;
  if (isSlot) {
    push(`_${helperNameMap[WITH_CTX]}(`);
  }
  push(`(`, node);
  if (isArray3(params)) {
    genNodeList(params, context);
  } else if (params) {
    genNode(params, context);
  }
  push(`) => `);
  if (newline || body) {
    push(`{`);
    indent();
  }
  if (returns) {
    if (newline) {
      push(`return `);
    }
    if (isArray3(returns)) {
      genNodeListAsArray(returns, context);
    } else {
      genNode(returns, context);
    }
  } else if (body) {
    genNode(body, context);
  }
  if (newline || body) {
    deindent();
    push(`}`);
  }
  if (isSlot) {
    if (node.isNonScopedSlot) {
      push(`, undefined, true`);
    }
    push(`)`);
  }
}
function genConditionalExpression(node, context) {
  const { test, consequent, alternate, newline: needNewline } = node;
  const { push, indent, deindent, newline } = context;
  if (test.type === 4) {
    const needsParens = !isSimpleIdentifier(test.content);
    needsParens && push(`(`);
    genExpression(test, context);
    needsParens && push(`)`);
  } else {
    push(`(`);
    genNode(test, context);
    push(`)`);
  }
  needNewline && indent();
  context.indentLevel++;
  needNewline || push(` `);
  push(`? `);
  genNode(consequent, context);
  context.indentLevel--;
  needNewline && newline();
  needNewline || push(` `);
  push(`: `);
  const isNested = alternate.type === 19;
  if (!isNested) {
    context.indentLevel++;
  }
  genNode(alternate, context);
  if (!isNested) {
    context.indentLevel--;
  }
  needNewline && deindent(
    true
    /* without newline */
  );
}
function genCacheExpression(node, context) {
  const { push, helper, indent, deindent, newline } = context;
  push(`_cache[${node.index}] || (`);
  if (node.isVNode) {
    indent();
    push(`${helper(SET_BLOCK_TRACKING)}(-1),`);
    newline();
  }
  push(`_cache[${node.index}] = `);
  genNode(node.value, context);
  if (node.isVNode) {
    push(`,`);
    newline();
    push(`${helper(SET_BLOCK_TRACKING)}(1),`);
    newline();
    push(`_cache[${node.index}]`);
    deindent();
  }
  push(`)`);
}
var prohibitedKeywordRE = new RegExp("\\b" + "do,if,for,let,new,try,var,case,else,with,await,break,catch,class,const,super,throw,while,yield,delete,export,import,return,switch,default,extends,finally,continue,debugger,function,arguments,typeof,void".split(",").join("\\b|\\b") + "\\b");
var stripStringRE = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*\$\{|\}(?:[^`\\]|\\.)*`|`(?:[^`\\]|\\.)*`/g;
function validateBrowserExpression(node, context, asParams = false, asRawStatements = false) {
  const exp = node.content;
  if (!exp.trim()) {
    return;
  }
  try {
    new Function(asRawStatements ? ` ${exp} ` : `return ${asParams ? `(${exp}) => {}` : `(${exp})`}`);
  } catch (e) {
    let message = e.message;
    const keywordMatch = exp.replace(stripStringRE, "").match(prohibitedKeywordRE);
    if (keywordMatch) {
      message = `avoid using JavaScript keyword as property name: "${keywordMatch[0]}"`;
    }
    context.onError(createCompilerError(45, node.loc, void 0, message));
  }
}
var transformExpression = (node, context) => {
  if (node.type === 5) {
    node.content = processExpression(node.content, context);
  } else if (node.type === 1) {
    for (let i = 0; i < node.props.length; i++) {
      const dir = node.props[i];
      if (dir.type === 7 && dir.name !== "for") {
        const exp = dir.exp;
        const arg = dir.arg;
        if (exp && exp.type === 4 && !(dir.name === "on" && arg)) {
          dir.exp = processExpression(
            exp,
            context,
            // slot args must be processed as function params
            dir.name === "slot"
          );
        }
        if (arg && arg.type === 4 && !arg.isStatic) {
          dir.arg = processExpression(arg, context);
        }
      }
    }
  }
};
function processExpression(node, context, asParams = false, asRawStatements = false, localVars = Object.create(context.identifiers)) {
  {
    if (true) {
      validateBrowserExpression(node, context, asParams, asRawStatements);
    }
    return node;
  }
}
var transformIf = createStructuralDirectiveTransform(/^(if|else|else-if)$/, (node, dir, context) => {
  return processIf(node, dir, context, (ifNode, branch, isRoot) => {
    const siblings = context.parent.children;
    let i = siblings.indexOf(ifNode);
    let key = 0;
    while (i-- >= 0) {
      const sibling = siblings[i];
      if (sibling && sibling.type === 9) {
        key += sibling.branches.length;
      }
    }
    return () => {
      if (isRoot) {
        ifNode.codegenNode = createCodegenNodeForBranch(branch, key, context);
      } else {
        const parentCondition = getParentCondition(ifNode.codegenNode);
        parentCondition.alternate = createCodegenNodeForBranch(branch, key + ifNode.branches.length - 1, context);
      }
    };
  });
});
function processIf(node, dir, context, processCodegen) {
  if (dir.name !== "else" && (!dir.exp || !dir.exp.content.trim())) {
    const loc = dir.exp ? dir.exp.loc : node.loc;
    context.onError(createCompilerError(28, dir.loc));
    dir.exp = createSimpleExpression(`true`, false, loc);
  }
  if (dir.exp) {
    validateBrowserExpression(dir.exp, context);
  }
  if (dir.name === "if") {
    const branch = createIfBranch(node, dir);
    const ifNode = {
      type: 9,
      loc: node.loc,
      branches: [branch]
    };
    context.replaceNode(ifNode);
    if (processCodegen) {
      return processCodegen(ifNode, branch, true);
    }
  } else {
    const siblings = context.parent.children;
    const comments = [];
    let i = siblings.indexOf(node);
    while (i-- >= -1) {
      const sibling = siblings[i];
      if (sibling && sibling.type === 3) {
        context.removeNode(sibling);
        comments.unshift(sibling);
        continue;
      }
      if (sibling && sibling.type === 2 && !sibling.content.trim().length) {
        context.removeNode(sibling);
        continue;
      }
      if (sibling && sibling.type === 9) {
        if (dir.name === "else-if" && sibling.branches[sibling.branches.length - 1].condition === void 0) {
          context.onError(createCompilerError(30, node.loc));
        }
        context.removeNode();
        const branch = createIfBranch(node, dir);
        if (comments.length && // #3619 ignore comments if the v-if is direct child of <transition>
        !(context.parent && context.parent.type === 1 && isBuiltInType(context.parent.tag, "transition"))) {
          branch.children = [...comments, ...branch.children];
        }
        if (true) {
          const key = branch.userKey;
          if (key) {
            sibling.branches.forEach(({ userKey }) => {
              if (isSameKey(userKey, key)) {
                context.onError(createCompilerError(29, branch.userKey.loc));
              }
            });
          }
        }
        sibling.branches.push(branch);
        const onExit = processCodegen && processCodegen(sibling, branch, false);
        traverseNode(branch, context);
        if (onExit)
          onExit();
        context.currentNode = null;
      } else {
        context.onError(createCompilerError(30, node.loc));
      }
      break;
    }
  }
}
function createIfBranch(node, dir) {
  const isTemplateIf = node.tagType === 3;
  return {
    type: 10,
    loc: node.loc,
    condition: dir.name === "else" ? void 0 : dir.exp,
    children: isTemplateIf && !findDir(node, "for") ? node.children : [node],
    userKey: findProp(node, `key`),
    isTemplateIf
  };
}
function createCodegenNodeForBranch(branch, keyIndex, context) {
  if (branch.condition) {
    return createConditionalExpression(
      branch.condition,
      createChildrenCodegenNode(branch, keyIndex, context),
      // make sure to pass in asBlock: true so that the comment node call
      // closes the current block.
      createCallExpression(context.helper(CREATE_COMMENT), [
        true ? '"v-if"' : '""',
        "true"
      ])
    );
  } else {
    return createChildrenCodegenNode(branch, keyIndex, context);
  }
}
function createChildrenCodegenNode(branch, keyIndex, context) {
  const { helper } = context;
  const keyProperty = createObjectProperty(`key`, createSimpleExpression(
    `${keyIndex}`,
    false,
    locStub,
    2
    /* ConstantTypes.CAN_HOIST */
  ));
  const { children } = branch;
  const firstChild = children[0];
  const needFragmentWrapper = children.length !== 1 || firstChild.type !== 1;
  if (needFragmentWrapper) {
    if (children.length === 1 && firstChild.type === 11) {
      const vnodeCall = firstChild.codegenNode;
      injectProp(vnodeCall, keyProperty, context);
      return vnodeCall;
    } else {
      let patchFlag = 64;
      let patchFlagText = PatchFlagNames[
        64
        /* PatchFlags.STABLE_FRAGMENT */
      ];
      if (!branch.isTemplateIf && children.filter(
        (c) => c.type !== 3
        /* NodeTypes.COMMENT */
      ).length === 1) {
        patchFlag |= 2048;
        patchFlagText += `, ${PatchFlagNames[
          2048
          /* PatchFlags.DEV_ROOT_FRAGMENT */
        ]}`;
      }
      return createVNodeCall(context, helper(FRAGMENT), createObjectExpression([keyProperty]), children, patchFlag + (true ? ` /* ${patchFlagText} */` : ``), void 0, void 0, true, false, false, branch.loc);
    }
  } else {
    const ret = firstChild.codegenNode;
    const vnodeCall = getMemoedVNodeCall(ret);
    if (vnodeCall.type === 13) {
      makeBlock(vnodeCall, context);
    }
    injectProp(vnodeCall, keyProperty, context);
    return ret;
  }
}
function isSameKey(a, b) {
  if (!a || a.type !== b.type) {
    return false;
  }
  if (a.type === 6) {
    if (a.value.content !== b.value.content) {
      return false;
    }
  } else {
    const exp = a.exp;
    const branchExp = b.exp;
    if (exp.type !== branchExp.type) {
      return false;
    }
    if (exp.type !== 4 || exp.isStatic !== branchExp.isStatic || exp.content !== branchExp.content) {
      return false;
    }
  }
  return true;
}
function getParentCondition(node) {
  while (true) {
    if (node.type === 19) {
      if (node.alternate.type === 19) {
        node = node.alternate;
      } else {
        return node;
      }
    } else if (node.type === 20) {
      node = node.value;
    }
  }
}
var transformFor = createStructuralDirectiveTransform("for", (node, dir, context) => {
  const { helper, removeHelper } = context;
  return processFor(node, dir, context, (forNode) => {
    const renderExp = createCallExpression(helper(RENDER_LIST), [
      forNode.source
    ]);
    const isTemplate = isTemplateNode(node);
    const memo = findDir(node, "memo");
    const keyProp = findProp(node, `key`);
    const keyExp = keyProp && (keyProp.type === 6 ? createSimpleExpression(keyProp.value.content, true) : keyProp.exp);
    const keyProperty = keyProp ? createObjectProperty(`key`, keyExp) : null;
    const isStableFragment = forNode.source.type === 4 && forNode.source.constType > 0;
    const fragmentFlag = isStableFragment ? 64 : keyProp ? 128 : 256;
    forNode.codegenNode = createVNodeCall(context, helper(FRAGMENT), void 0, renderExp, fragmentFlag + (true ? ` /* ${PatchFlagNames[fragmentFlag]} */` : ``), void 0, void 0, true, !isStableFragment, false, node.loc);
    return () => {
      let childBlock;
      const { children } = forNode;
      if (isTemplate) {
        node.children.some((c) => {
          if (c.type === 1) {
            const key = findProp(c, "key");
            if (key) {
              context.onError(createCompilerError(33, key.loc));
              return true;
            }
          }
        });
      }
      const needFragmentWrapper = children.length !== 1 || children[0].type !== 1;
      const slotOutlet = isSlotOutlet(node) ? node : isTemplate && node.children.length === 1 && isSlotOutlet(node.children[0]) ? node.children[0] : null;
      if (slotOutlet) {
        childBlock = slotOutlet.codegenNode;
        if (isTemplate && keyProperty) {
          injectProp(childBlock, keyProperty, context);
        }
      } else if (needFragmentWrapper) {
        childBlock = createVNodeCall(
          context,
          helper(FRAGMENT),
          keyProperty ? createObjectExpression([keyProperty]) : void 0,
          node.children,
          64 + (true ? ` /* ${PatchFlagNames[
            64
            /* PatchFlags.STABLE_FRAGMENT */
          ]} */` : ``),
          void 0,
          void 0,
          true,
          void 0,
          false
          /* isComponent */
        );
      } else {
        childBlock = children[0].codegenNode;
        if (isTemplate && keyProperty) {
          injectProp(childBlock, keyProperty, context);
        }
        if (childBlock.isBlock !== !isStableFragment) {
          if (childBlock.isBlock) {
            removeHelper(OPEN_BLOCK);
            removeHelper(getVNodeBlockHelper(context.inSSR, childBlock.isComponent));
          } else {
            removeHelper(getVNodeHelper(context.inSSR, childBlock.isComponent));
          }
        }
        childBlock.isBlock = !isStableFragment;
        if (childBlock.isBlock) {
          helper(OPEN_BLOCK);
          helper(getVNodeBlockHelper(context.inSSR, childBlock.isComponent));
        } else {
          helper(getVNodeHelper(context.inSSR, childBlock.isComponent));
        }
      }
      if (memo) {
        const loop = createFunctionExpression(createForLoopParams(forNode.parseResult, [
          createSimpleExpression(`_cached`)
        ]));
        loop.body = createBlockStatement([
          createCompoundExpression([`const _memo = (`, memo.exp, `)`]),
          createCompoundExpression([
            `if (_cached`,
            ...keyExp ? [` && _cached.key === `, keyExp] : [],
            ` && ${context.helperString(IS_MEMO_SAME)}(_cached, _memo)) return _cached`
          ]),
          createCompoundExpression([`const _item = `, childBlock]),
          createSimpleExpression(`_item.memo = _memo`),
          createSimpleExpression(`return _item`)
        ]);
        renderExp.arguments.push(loop, createSimpleExpression(`_cache`), createSimpleExpression(String(context.cached++)));
      } else {
        renderExp.arguments.push(createFunctionExpression(
          createForLoopParams(forNode.parseResult),
          childBlock,
          true
          /* force newline */
        ));
      }
    };
  });
});
function processFor(node, dir, context, processCodegen) {
  if (!dir.exp) {
    context.onError(createCompilerError(31, dir.loc));
    return;
  }
  const parseResult = parseForExpression(
    // can only be simple expression because vFor transform is applied
    // before expression transform.
    dir.exp,
    context
  );
  if (!parseResult) {
    context.onError(createCompilerError(32, dir.loc));
    return;
  }
  const { addIdentifiers, removeIdentifiers, scopes } = context;
  const { source, value, key, index } = parseResult;
  const forNode = {
    type: 11,
    loc: dir.loc,
    source,
    valueAlias: value,
    keyAlias: key,
    objectIndexAlias: index,
    parseResult,
    children: isTemplateNode(node) ? node.children : [node]
  };
  context.replaceNode(forNode);
  scopes.vFor++;
  const onExit = processCodegen && processCodegen(forNode);
  return () => {
    scopes.vFor--;
    if (onExit)
      onExit();
  };
}
var forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
var forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
var stripParensRE = /^\(|\)$/g;
function parseForExpression(input, context) {
  const loc = input.loc;
  const exp = input.content;
  const inMatch = exp.match(forAliasRE);
  if (!inMatch)
    return;
  const [, LHS, RHS] = inMatch;
  const result = {
    source: createAliasExpression(loc, RHS.trim(), exp.indexOf(RHS, LHS.length)),
    value: void 0,
    key: void 0,
    index: void 0
  };
  if (true) {
    validateBrowserExpression(result.source, context);
  }
  let valueContent = LHS.trim().replace(stripParensRE, "").trim();
  const trimmedOffset = LHS.indexOf(valueContent);
  const iteratorMatch = valueContent.match(forIteratorRE);
  if (iteratorMatch) {
    valueContent = valueContent.replace(forIteratorRE, "").trim();
    const keyContent = iteratorMatch[1].trim();
    let keyOffset;
    if (keyContent) {
      keyOffset = exp.indexOf(keyContent, trimmedOffset + valueContent.length);
      result.key = createAliasExpression(loc, keyContent, keyOffset);
      if (true) {
        validateBrowserExpression(result.key, context, true);
      }
    }
    if (iteratorMatch[2]) {
      const indexContent = iteratorMatch[2].trim();
      if (indexContent) {
        result.index = createAliasExpression(loc, indexContent, exp.indexOf(indexContent, result.key ? keyOffset + keyContent.length : trimmedOffset + valueContent.length));
        if (true) {
          validateBrowserExpression(result.index, context, true);
        }
      }
    }
  }
  if (valueContent) {
    result.value = createAliasExpression(loc, valueContent, trimmedOffset);
    if (true) {
      validateBrowserExpression(result.value, context, true);
    }
  }
  return result;
}
function createAliasExpression(range, content, offset) {
  return createSimpleExpression(content, false, getInnerRange(range, offset, content.length));
}
function createForLoopParams({ value, key, index }, memoArgs = []) {
  return createParamsList([value, key, index, ...memoArgs]);
}
function createParamsList(args) {
  let i = args.length;
  while (i--) {
    if (args[i])
      break;
  }
  return args.slice(0, i + 1).map((arg, i2) => arg || createSimpleExpression(`_`.repeat(i2 + 1), false));
}
var defaultFallback = createSimpleExpression(`undefined`, false);
var trackSlotScopes = (node, context) => {
  if (node.type === 1 && (node.tagType === 1 || node.tagType === 3)) {
    const vSlot = findDir(node, "slot");
    if (vSlot) {
      vSlot.exp;
      context.scopes.vSlot++;
      return () => {
        context.scopes.vSlot--;
      };
    }
  }
};
var buildClientSlotFn = (props, children, loc) => createFunctionExpression(props, children, false, true, children.length ? children[0].loc : loc);
function buildSlots(node, context, buildSlotFn = buildClientSlotFn) {
  context.helper(WITH_CTX);
  const { children, loc } = node;
  const slotsProperties = [];
  const dynamicSlots = [];
  let hasDynamicSlots = context.scopes.vSlot > 0 || context.scopes.vFor > 0;
  const onComponentSlot = findDir(node, "slot", true);
  if (onComponentSlot) {
    const { arg, exp } = onComponentSlot;
    if (arg && !isStaticExp(arg)) {
      hasDynamicSlots = true;
    }
    slotsProperties.push(createObjectProperty(arg || createSimpleExpression("default", true), buildSlotFn(exp, children, loc)));
  }
  let hasTemplateSlots = false;
  let hasNamedDefaultSlot = false;
  const implicitDefaultChildren = [];
  const seenSlotNames = /* @__PURE__ */ new Set();
  let conditionalBranchIndex = 0;
  for (let i = 0; i < children.length; i++) {
    const slotElement = children[i];
    let slotDir;
    if (!isTemplateNode(slotElement) || !(slotDir = findDir(slotElement, "slot", true))) {
      if (slotElement.type !== 3) {
        implicitDefaultChildren.push(slotElement);
      }
      continue;
    }
    if (onComponentSlot) {
      context.onError(createCompilerError(37, slotDir.loc));
      break;
    }
    hasTemplateSlots = true;
    const { children: slotChildren, loc: slotLoc } = slotElement;
    const { arg: slotName = createSimpleExpression(`default`, true), exp: slotProps, loc: dirLoc } = slotDir;
    let staticSlotName;
    if (isStaticExp(slotName)) {
      staticSlotName = slotName ? slotName.content : `default`;
    } else {
      hasDynamicSlots = true;
    }
    const slotFunction = buildSlotFn(slotProps, slotChildren, slotLoc);
    let vIf;
    let vElse;
    let vFor;
    if (vIf = findDir(slotElement, "if")) {
      hasDynamicSlots = true;
      dynamicSlots.push(createConditionalExpression(vIf.exp, buildDynamicSlot(slotName, slotFunction, conditionalBranchIndex++), defaultFallback));
    } else if (vElse = findDir(
      slotElement,
      /^else(-if)?$/,
      true
      /* allowEmpty */
    )) {
      let j = i;
      let prev;
      while (j--) {
        prev = children[j];
        if (prev.type !== 3) {
          break;
        }
      }
      if (prev && isTemplateNode(prev) && findDir(prev, "if")) {
        children.splice(i, 1);
        i--;
        let conditional = dynamicSlots[dynamicSlots.length - 1];
        while (conditional.alternate.type === 19) {
          conditional = conditional.alternate;
        }
        conditional.alternate = vElse.exp ? createConditionalExpression(vElse.exp, buildDynamicSlot(slotName, slotFunction, conditionalBranchIndex++), defaultFallback) : buildDynamicSlot(slotName, slotFunction, conditionalBranchIndex++);
      } else {
        context.onError(createCompilerError(30, vElse.loc));
      }
    } else if (vFor = findDir(slotElement, "for")) {
      hasDynamicSlots = true;
      const parseResult = vFor.parseResult || parseForExpression(vFor.exp, context);
      if (parseResult) {
        dynamicSlots.push(createCallExpression(context.helper(RENDER_LIST), [
          parseResult.source,
          createFunctionExpression(
            createForLoopParams(parseResult),
            buildDynamicSlot(slotName, slotFunction),
            true
            /* force newline */
          )
        ]));
      } else {
        context.onError(createCompilerError(32, vFor.loc));
      }
    } else {
      if (staticSlotName) {
        if (seenSlotNames.has(staticSlotName)) {
          context.onError(createCompilerError(38, dirLoc));
          continue;
        }
        seenSlotNames.add(staticSlotName);
        if (staticSlotName === "default") {
          hasNamedDefaultSlot = true;
        }
      }
      slotsProperties.push(createObjectProperty(slotName, slotFunction));
    }
  }
  if (!onComponentSlot) {
    const buildDefaultSlotProperty = (props, children2) => {
      const fn = buildSlotFn(props, children2, loc);
      if (context.compatConfig) {
        fn.isNonScopedSlot = true;
      }
      return createObjectProperty(`default`, fn);
    };
    if (!hasTemplateSlots) {
      slotsProperties.push(buildDefaultSlotProperty(void 0, children));
    } else if (implicitDefaultChildren.length && // #3766
    // with whitespace: 'preserve', whitespaces between slots will end up in
    // implicitDefaultChildren. Ignore if all implicit children are whitespaces.
    implicitDefaultChildren.some((node2) => isNonWhitespaceContent(node2))) {
      if (hasNamedDefaultSlot) {
        context.onError(createCompilerError(39, implicitDefaultChildren[0].loc));
      } else {
        slotsProperties.push(buildDefaultSlotProperty(void 0, implicitDefaultChildren));
      }
    }
  }
  const slotFlag = hasDynamicSlots ? 2 : hasForwardedSlots(node.children) ? 3 : 1;
  let slots = createObjectExpression(slotsProperties.concat(createObjectProperty(
    `_`,
    // 2 = compiled but dynamic = can skip normalization, but must run diff
    // 1 = compiled and static = can skip normalization AND diff as optimized
    createSimpleExpression(slotFlag + (true ? ` /* ${slotFlagsText[slotFlag]} */` : ``), false)
  )), loc);
  if (dynamicSlots.length) {
    slots = createCallExpression(context.helper(CREATE_SLOTS), [
      slots,
      createArrayExpression(dynamicSlots)
    ]);
  }
  return {
    slots,
    hasDynamicSlots
  };
}
function buildDynamicSlot(name, fn, index) {
  const props = [
    createObjectProperty(`name`, name),
    createObjectProperty(`fn`, fn)
  ];
  if (index != null) {
    props.push(createObjectProperty(`key`, createSimpleExpression(String(index), true)));
  }
  return createObjectExpression(props);
}
function hasForwardedSlots(children) {
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    switch (child.type) {
      case 1:
        if (child.tagType === 2 || hasForwardedSlots(child.children)) {
          return true;
        }
        break;
      case 9:
        if (hasForwardedSlots(child.branches))
          return true;
        break;
      case 10:
      case 11:
        if (hasForwardedSlots(child.children))
          return true;
        break;
    }
  }
  return false;
}
function isNonWhitespaceContent(node) {
  if (node.type !== 2 && node.type !== 12)
    return true;
  return node.type === 2 ? !!node.content.trim() : isNonWhitespaceContent(node.content);
}
var directiveImportMap = /* @__PURE__ */ new WeakMap();
var transformElement = (node, context) => {
  return function postTransformElement() {
    node = context.currentNode;
    if (!(node.type === 1 && (node.tagType === 0 || node.tagType === 1))) {
      return;
    }
    const { tag, props } = node;
    const isComponent2 = node.tagType === 1;
    let vnodeTag = isComponent2 ? resolveComponentType(node, context) : `"${tag}"`;
    const isDynamicComponent = isObject2(vnodeTag) && vnodeTag.callee === RESOLVE_DYNAMIC_COMPONENT;
    let vnodeProps;
    let vnodeChildren;
    let vnodePatchFlag;
    let patchFlag = 0;
    let vnodeDynamicProps;
    let dynamicPropNames;
    let vnodeDirectives;
    let shouldUseBlock = (
      // dynamic component may resolve to plain elements
      isDynamicComponent || vnodeTag === TELEPORT || vnodeTag === SUSPENSE || !isComponent2 && (tag === "svg" || tag === "foreignObject")
    );
    if (props.length > 0) {
      const propsBuildResult = buildProps(node, context, void 0, isComponent2, isDynamicComponent);
      vnodeProps = propsBuildResult.props;
      patchFlag = propsBuildResult.patchFlag;
      dynamicPropNames = propsBuildResult.dynamicPropNames;
      const directives = propsBuildResult.directives;
      vnodeDirectives = directives && directives.length ? createArrayExpression(directives.map((dir) => buildDirectiveArgs(dir, context))) : void 0;
      if (propsBuildResult.shouldUseBlock) {
        shouldUseBlock = true;
      }
    }
    if (node.children.length > 0) {
      if (vnodeTag === KEEP_ALIVE) {
        shouldUseBlock = true;
        patchFlag |= 1024;
        if (node.children.length > 1) {
          context.onError(createCompilerError(46, {
            start: node.children[0].loc.start,
            end: node.children[node.children.length - 1].loc.end,
            source: ""
          }));
        }
      }
      const shouldBuildAsSlots = isComponent2 && // Teleport is not a real component and has dedicated runtime handling
      vnodeTag !== TELEPORT && // explained above.
      vnodeTag !== KEEP_ALIVE;
      if (shouldBuildAsSlots) {
        const { slots, hasDynamicSlots } = buildSlots(node, context);
        vnodeChildren = slots;
        if (hasDynamicSlots) {
          patchFlag |= 1024;
        }
      } else if (node.children.length === 1 && vnodeTag !== TELEPORT) {
        const child = node.children[0];
        const type = child.type;
        const hasDynamicTextChild = type === 5 || type === 8;
        if (hasDynamicTextChild && getConstantType(child, context) === 0) {
          patchFlag |= 1;
        }
        if (hasDynamicTextChild || type === 2) {
          vnodeChildren = child;
        } else {
          vnodeChildren = node.children;
        }
      } else {
        vnodeChildren = node.children;
      }
    }
    if (patchFlag !== 0) {
      if (true) {
        if (patchFlag < 0) {
          vnodePatchFlag = patchFlag + ` /* ${PatchFlagNames[patchFlag]} */`;
        } else {
          const flagNames = Object.keys(PatchFlagNames).map(Number).filter((n) => n > 0 && patchFlag & n).map((n) => PatchFlagNames[n]).join(`, `);
          vnodePatchFlag = patchFlag + ` /* ${flagNames} */`;
        }
      } else {
        vnodePatchFlag = String(patchFlag);
      }
      if (dynamicPropNames && dynamicPropNames.length) {
        vnodeDynamicProps = stringifyDynamicPropNames(dynamicPropNames);
      }
    }
    node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren, vnodePatchFlag, vnodeDynamicProps, vnodeDirectives, !!shouldUseBlock, false, isComponent2, node.loc);
  };
};
function resolveComponentType(node, context, ssr = false) {
  let { tag } = node;
  const isExplicitDynamic = isComponentTag(tag);
  const isProp = findProp(node, "is");
  if (isProp) {
    if (isExplicitDynamic || isCompatEnabled("COMPILER_IS_ON_ELEMENT", context)) {
      const exp = isProp.type === 6 ? isProp.value && createSimpleExpression(isProp.value.content, true) : isProp.exp;
      if (exp) {
        return createCallExpression(context.helper(RESOLVE_DYNAMIC_COMPONENT), [
          exp
        ]);
      }
    } else if (isProp.type === 6 && isProp.value.content.startsWith("vue:")) {
      tag = isProp.value.content.slice(4);
    }
  }
  const isDir = !isExplicitDynamic && findDir(node, "is");
  if (isDir && isDir.exp) {
    return createCallExpression(context.helper(RESOLVE_DYNAMIC_COMPONENT), [
      isDir.exp
    ]);
  }
  const builtIn = isCoreComponent(tag) || context.isBuiltInComponent(tag);
  if (builtIn) {
    if (!ssr)
      context.helper(builtIn);
    return builtIn;
  }
  context.helper(RESOLVE_COMPONENT);
  context.components.add(tag);
  return toValidAssetId(tag, `component`);
}
function buildProps(node, context, props = node.props, isComponent2, isDynamicComponent, ssr = false) {
  const { tag, loc: elementLoc, children } = node;
  let properties = [];
  const mergeArgs = [];
  const runtimeDirectives = [];
  const hasChildren = children.length > 0;
  let shouldUseBlock = false;
  let patchFlag = 0;
  let hasRef = false;
  let hasClassBinding = false;
  let hasStyleBinding = false;
  let hasHydrationEventBinding = false;
  let hasDynamicKeys = false;
  let hasVnodeHook = false;
  const dynamicPropNames = [];
  const pushMergeArg = (arg) => {
    if (properties.length) {
      mergeArgs.push(createObjectExpression(dedupeProperties(properties), elementLoc));
      properties = [];
    }
    if (arg)
      mergeArgs.push(arg);
  };
  const analyzePatchFlag = ({ key, value }) => {
    if (isStaticExp(key)) {
      const name = key.content;
      const isEventHandler = isOn(name);
      if (isEventHandler && (!isComponent2 || isDynamicComponent) && // omit the flag for click handlers because hydration gives click
      // dedicated fast path.
      name.toLowerCase() !== "onclick" && // omit v-model handlers
      name !== "onUpdate:modelValue" && // omit onVnodeXXX hooks
      !isReservedProp2(name)) {
        hasHydrationEventBinding = true;
      }
      if (isEventHandler && isReservedProp2(name)) {
        hasVnodeHook = true;
      }
      if (value.type === 20 || (value.type === 4 || value.type === 8) && getConstantType(value, context) > 0) {
        return;
      }
      if (name === "ref") {
        hasRef = true;
      } else if (name === "class") {
        hasClassBinding = true;
      } else if (name === "style") {
        hasStyleBinding = true;
      } else if (name !== "key" && !dynamicPropNames.includes(name)) {
        dynamicPropNames.push(name);
      }
      if (isComponent2 && (name === "class" || name === "style") && !dynamicPropNames.includes(name)) {
        dynamicPropNames.push(name);
      }
    } else {
      hasDynamicKeys = true;
    }
  };
  for (let i = 0; i < props.length; i++) {
    const prop = props[i];
    if (prop.type === 6) {
      const { loc, name, value } = prop;
      let isStatic = true;
      if (name === "ref") {
        hasRef = true;
        if (context.scopes.vFor > 0) {
          properties.push(createObjectProperty(createSimpleExpression("ref_for", true), createSimpleExpression("true")));
        }
      }
      if (name === "is" && (isComponentTag(tag) || value && value.content.startsWith("vue:") || isCompatEnabled("COMPILER_IS_ON_ELEMENT", context))) {
        continue;
      }
      properties.push(createObjectProperty(createSimpleExpression(name, true, getInnerRange(loc, 0, name.length)), createSimpleExpression(value ? value.content : "", isStatic, value ? value.loc : loc)));
    } else {
      const { name, arg, exp, loc } = prop;
      const isVBind = name === "bind";
      const isVOn = name === "on";
      if (name === "slot") {
        if (!isComponent2) {
          context.onError(createCompilerError(40, loc));
        }
        continue;
      }
      if (name === "once" || name === "memo") {
        continue;
      }
      if (name === "is" || isVBind && isStaticArgOf(arg, "is") && (isComponentTag(tag) || isCompatEnabled("COMPILER_IS_ON_ELEMENT", context))) {
        continue;
      }
      if (isVOn && ssr) {
        continue;
      }
      if (isVBind && isStaticArgOf(arg, "key") || isVOn && hasChildren && isStaticArgOf(arg, "vue:before-update")) {
        shouldUseBlock = true;
      }
      if (isVBind && isStaticArgOf(arg, "ref") && context.scopes.vFor > 0) {
        properties.push(createObjectProperty(createSimpleExpression("ref_for", true), createSimpleExpression("true")));
      }
      if (!arg && (isVBind || isVOn)) {
        hasDynamicKeys = true;
        if (exp) {
          if (isVBind) {
            pushMergeArg();
            {
              if (true) {
                const hasOverridableKeys = mergeArgs.some((arg2) => {
                  if (arg2.type === 15) {
                    return arg2.properties.some(({ key }) => {
                      if (key.type !== 4 || !key.isStatic) {
                        return true;
                      }
                      return key.content !== "class" && key.content !== "style" && !isOn(key.content);
                    });
                  } else {
                    return true;
                  }
                });
                if (hasOverridableKeys) {
                  checkCompatEnabled("COMPILER_V_BIND_OBJECT_ORDER", context, loc);
                }
              }
              if (isCompatEnabled("COMPILER_V_BIND_OBJECT_ORDER", context)) {
                mergeArgs.unshift(exp);
                continue;
              }
            }
            mergeArgs.push(exp);
          } else {
            pushMergeArg({
              type: 14,
              loc,
              callee: context.helper(TO_HANDLERS),
              arguments: isComponent2 ? [exp] : [exp, `true`]
            });
          }
        } else {
          context.onError(createCompilerError(isVBind ? 34 : 35, loc));
        }
        continue;
      }
      const directiveTransform = context.directiveTransforms[name];
      if (directiveTransform) {
        const { props: props2, needRuntime } = directiveTransform(prop, node, context);
        !ssr && props2.forEach(analyzePatchFlag);
        if (isVOn && arg && !isStaticExp(arg)) {
          pushMergeArg(createObjectExpression(props2, elementLoc));
        } else {
          properties.push(...props2);
        }
        if (needRuntime) {
          runtimeDirectives.push(prop);
          if (isSymbol(needRuntime)) {
            directiveImportMap.set(prop, needRuntime);
          }
        }
      } else if (!isBuiltInDirective(name)) {
        runtimeDirectives.push(prop);
        if (hasChildren) {
          shouldUseBlock = true;
        }
      }
    }
  }
  let propsExpression = void 0;
  if (mergeArgs.length) {
    pushMergeArg();
    if (mergeArgs.length > 1) {
      propsExpression = createCallExpression(context.helper(MERGE_PROPS), mergeArgs, elementLoc);
    } else {
      propsExpression = mergeArgs[0];
    }
  } else if (properties.length) {
    propsExpression = createObjectExpression(dedupeProperties(properties), elementLoc);
  }
  if (hasDynamicKeys) {
    patchFlag |= 16;
  } else {
    if (hasClassBinding && !isComponent2) {
      patchFlag |= 2;
    }
    if (hasStyleBinding && !isComponent2) {
      patchFlag |= 4;
    }
    if (dynamicPropNames.length) {
      patchFlag |= 8;
    }
    if (hasHydrationEventBinding) {
      patchFlag |= 32;
    }
  }
  if (!shouldUseBlock && (patchFlag === 0 || patchFlag === 32) && (hasRef || hasVnodeHook || runtimeDirectives.length > 0)) {
    patchFlag |= 512;
  }
  if (!context.inSSR && propsExpression) {
    switch (propsExpression.type) {
      case 15:
        let classKeyIndex = -1;
        let styleKeyIndex = -1;
        let hasDynamicKey = false;
        for (let i = 0; i < propsExpression.properties.length; i++) {
          const key = propsExpression.properties[i].key;
          if (isStaticExp(key)) {
            if (key.content === "class") {
              classKeyIndex = i;
            } else if (key.content === "style") {
              styleKeyIndex = i;
            }
          } else if (!key.isHandlerKey) {
            hasDynamicKey = true;
          }
        }
        const classProp = propsExpression.properties[classKeyIndex];
        const styleProp = propsExpression.properties[styleKeyIndex];
        if (!hasDynamicKey) {
          if (classProp && !isStaticExp(classProp.value)) {
            classProp.value = createCallExpression(context.helper(NORMALIZE_CLASS), [classProp.value]);
          }
          if (styleProp && (hasStyleBinding || styleProp.value.type === 4 && styleProp.value.content.trim()[0] === `[` || // v-bind:style and style both exist,
          // v-bind:style with static literal object
          styleProp.value.type === 17)) {
            styleProp.value = createCallExpression(context.helper(NORMALIZE_STYLE), [styleProp.value]);
          }
        } else {
          propsExpression = createCallExpression(context.helper(NORMALIZE_PROPS), [propsExpression]);
        }
        break;
      case 14:
        break;
      default:
        propsExpression = createCallExpression(context.helper(NORMALIZE_PROPS), [
          createCallExpression(context.helper(GUARD_REACTIVE_PROPS), [
            propsExpression
          ])
        ]);
        break;
    }
  }
  return {
    props: propsExpression,
    directives: runtimeDirectives,
    patchFlag,
    dynamicPropNames,
    shouldUseBlock
  };
}
function dedupeProperties(properties) {
  const knownProps = /* @__PURE__ */ new Map();
  const deduped = [];
  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    if (prop.key.type === 8 || !prop.key.isStatic) {
      deduped.push(prop);
      continue;
    }
    const name = prop.key.content;
    const existing = knownProps.get(name);
    if (existing) {
      if (name === "style" || name === "class" || isOn(name)) {
        mergeAsArray(existing, prop);
      }
    } else {
      knownProps.set(name, prop);
      deduped.push(prop);
    }
  }
  return deduped;
}
function mergeAsArray(existing, incoming) {
  if (existing.value.type === 17) {
    existing.value.elements.push(incoming.value);
  } else {
    existing.value = createArrayExpression([existing.value, incoming.value], existing.loc);
  }
}
function buildDirectiveArgs(dir, context) {
  const dirArgs = [];
  const runtime = directiveImportMap.get(dir);
  if (runtime) {
    dirArgs.push(context.helperString(runtime));
  } else {
    {
      context.helper(RESOLVE_DIRECTIVE);
      context.directives.add(dir.name);
      dirArgs.push(toValidAssetId(dir.name, `directive`));
    }
  }
  const { loc } = dir;
  if (dir.exp)
    dirArgs.push(dir.exp);
  if (dir.arg) {
    if (!dir.exp) {
      dirArgs.push(`void 0`);
    }
    dirArgs.push(dir.arg);
  }
  if (Object.keys(dir.modifiers).length) {
    if (!dir.arg) {
      if (!dir.exp) {
        dirArgs.push(`void 0`);
      }
      dirArgs.push(`void 0`);
    }
    const trueExpression = createSimpleExpression(`true`, false, loc);
    dirArgs.push(createObjectExpression(dir.modifiers.map((modifier) => createObjectProperty(modifier, trueExpression)), loc));
  }
  return createArrayExpression(dirArgs, dir.loc);
}
function stringifyDynamicPropNames(props) {
  let propsNamesString = `[`;
  for (let i = 0, l = props.length; i < l; i++) {
    propsNamesString += JSON.stringify(props[i]);
    if (i < l - 1)
      propsNamesString += ", ";
  }
  return propsNamesString + `]`;
}
function isComponentTag(tag) {
  return tag === "component" || tag === "Component";
}
true ? Object.freeze({}) : {};
true ? Object.freeze([]) : [];
var cacheStringFunction4 = (fn) => {
  const cache = /* @__PURE__ */ Object.create(null);
  return (str) => {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  };
};
var camelizeRE4 = /-(\w)/g;
var camelize4 = cacheStringFunction4((str) => {
  return str.replace(camelizeRE4, (_, c) => c ? c.toUpperCase() : "");
});
var transformSlotOutlet = (node, context) => {
  if (isSlotOutlet(node)) {
    const { children, loc } = node;
    const { slotName, slotProps } = processSlotOutlet(node, context);
    const slotArgs = [
      context.prefixIdentifiers ? `_ctx.$slots` : `$slots`,
      slotName,
      "{}",
      "undefined",
      "true"
    ];
    let expectedLen = 2;
    if (slotProps) {
      slotArgs[2] = slotProps;
      expectedLen = 3;
    }
    if (children.length) {
      slotArgs[3] = createFunctionExpression([], children, false, false, loc);
      expectedLen = 4;
    }
    if (context.scopeId && !context.slotted) {
      expectedLen = 5;
    }
    slotArgs.splice(expectedLen);
    node.codegenNode = createCallExpression(context.helper(RENDER_SLOT), slotArgs, loc);
  }
};
function processSlotOutlet(node, context) {
  let slotName = `"default"`;
  let slotProps = void 0;
  const nonNameProps = [];
  for (let i = 0; i < node.props.length; i++) {
    const p = node.props[i];
    if (p.type === 6) {
      if (p.value) {
        if (p.name === "name") {
          slotName = JSON.stringify(p.value.content);
        } else {
          p.name = camelize4(p.name);
          nonNameProps.push(p);
        }
      }
    } else {
      if (p.name === "bind" && isStaticArgOf(p.arg, "name")) {
        if (p.exp)
          slotName = p.exp;
      } else {
        if (p.name === "bind" && p.arg && isStaticExp(p.arg)) {
          p.arg.content = camelize4(p.arg.content);
        }
        nonNameProps.push(p);
      }
    }
  }
  if (nonNameProps.length > 0) {
    const { props, directives } = buildProps(node, context, nonNameProps, false, false);
    slotProps = props;
    if (directives.length) {
      context.onError(createCompilerError(36, directives[0].loc));
    }
  }
  return {
    slotName,
    slotProps
  };
}
var fnExpRE = /^\s*([\w$_]+|(async\s*)?\([^)]*?\))\s*(:[^=]+)?=>|^\s*(async\s+)?function(?:\s+[\w$]+)?\s*\(/;
var transformOn = (dir, node, context, augmentor) => {
  const { loc, modifiers, arg } = dir;
  if (!dir.exp && !modifiers.length) {
    context.onError(createCompilerError(35, loc));
  }
  let eventName;
  if (arg.type === 4) {
    if (arg.isStatic) {
      let rawName = arg.content;
      if (rawName.startsWith("vue:")) {
        rawName = `vnode-${rawName.slice(4)}`;
      }
      const eventString = node.tagType !== 0 || rawName.startsWith("vnode") || !/[A-Z]/.test(rawName) ? (
        // for non-element and vnode lifecycle event listeners, auto convert
        // it to camelCase. See issue #2249
        toHandlerKey(camelize3(rawName))
      ) : (
        // preserve case for plain element listeners that have uppercase
        // letters, as these may be custom elements' custom events
        `on:${rawName}`
      );
      eventName = createSimpleExpression(eventString, true, arg.loc);
    } else {
      eventName = createCompoundExpression([
        `${context.helperString(TO_HANDLER_KEY)}(`,
        arg,
        `)`
      ]);
    }
  } else {
    eventName = arg;
    eventName.children.unshift(`${context.helperString(TO_HANDLER_KEY)}(`);
    eventName.children.push(`)`);
  }
  let exp = dir.exp;
  if (exp && !exp.content.trim()) {
    exp = void 0;
  }
  let shouldCache = context.cacheHandlers && !exp && !context.inVOnce;
  if (exp) {
    const isMemberExp = isMemberExpression(exp.content);
    const isInlineStatement = !(isMemberExp || fnExpRE.test(exp.content));
    const hasMultipleStatements = exp.content.includes(`;`);
    if (true) {
      validateBrowserExpression(exp, context, false, hasMultipleStatements);
    }
    if (isInlineStatement || shouldCache && isMemberExp) {
      exp = createCompoundExpression([
        `${isInlineStatement ? `$event` : `${``}(...args)`} => ${hasMultipleStatements ? `{` : `(`}`,
        exp,
        hasMultipleStatements ? `}` : `)`
      ]);
    }
  }
  let ret = {
    props: [
      createObjectProperty(eventName, exp || createSimpleExpression(`() => {}`, false, loc))
    ]
  };
  if (augmentor) {
    ret = augmentor(ret);
  }
  if (shouldCache) {
    ret.props[0].value = context.cache(ret.props[0].value);
  }
  ret.props.forEach((p) => p.key.isHandlerKey = true);
  return ret;
};
var transformBind = (dir, _node, context) => {
  const { exp, modifiers, loc } = dir;
  const arg = dir.arg;
  if (arg.type !== 4) {
    arg.children.unshift(`(`);
    arg.children.push(`) || ""`);
  } else if (!arg.isStatic) {
    arg.content = `${arg.content} || ""`;
  }
  if (modifiers.includes("camel")) {
    if (arg.type === 4) {
      if (arg.isStatic) {
        arg.content = camelize3(arg.content);
      } else {
        arg.content = `${context.helperString(CAMELIZE)}(${arg.content})`;
      }
    } else {
      arg.children.unshift(`${context.helperString(CAMELIZE)}(`);
      arg.children.push(`)`);
    }
  }
  if (!context.inSSR) {
    if (modifiers.includes("prop")) {
      injectPrefix(arg, ".");
    }
    if (modifiers.includes("attr")) {
      injectPrefix(arg, "^");
    }
  }
  if (!exp || exp.type === 4 && !exp.content.trim()) {
    context.onError(createCompilerError(34, loc));
    return {
      props: [createObjectProperty(arg, createSimpleExpression("", true, loc))]
    };
  }
  return {
    props: [createObjectProperty(arg, exp)]
  };
};
var injectPrefix = (arg, prefix) => {
  if (arg.type === 4) {
    if (arg.isStatic) {
      arg.content = prefix + arg.content;
    } else {
      arg.content = `\`${prefix}\${${arg.content}}\``;
    }
  } else {
    arg.children.unshift(`'${prefix}' + (`);
    arg.children.push(`)`);
  }
};
var transformText = (node, context) => {
  if (node.type === 0 || node.type === 1 || node.type === 11 || node.type === 10) {
    return () => {
      const children = node.children;
      let currentContainer = void 0;
      let hasText = false;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isText(child)) {
          hasText = true;
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j];
            if (isText(next)) {
              if (!currentContainer) {
                currentContainer = children[i] = createCompoundExpression([child], child.loc);
              }
              currentContainer.children.push(` + `, next);
              children.splice(j, 1);
              j--;
            } else {
              currentContainer = void 0;
              break;
            }
          }
        }
      }
      if (!hasText || children.length === 1 && (node.type === 0 || node.type === 1 && node.tagType === 0 && // #3756
      // custom directives can potentially add DOM elements arbitrarily,
      // we need to avoid setting textContent of the element at runtime
      // to avoid accidentally overwriting the DOM elements added
      // by the user through custom directives.
      !node.props.find((p) => p.type === 7 && !context.directiveTransforms[p.name]) && // in compat mode, <template> tags with no special directives
      // will be rendered as a fragment so its children must be
      // converted into vnodes.
      !(node.tag === "template"))) {
        return;
      }
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isText(child) || child.type === 8) {
          const callArgs = [];
          if (child.type !== 2 || child.content !== " ") {
            callArgs.push(child);
          }
          if (!context.ssr && getConstantType(child, context) === 0) {
            callArgs.push(1 + (true ? ` /* ${PatchFlagNames[
              1
              /* PatchFlags.TEXT */
            ]} */` : ``));
          }
          children[i] = {
            type: 12,
            content: child,
            loc: child.loc,
            codegenNode: createCallExpression(context.helper(CREATE_TEXT), callArgs)
          };
        }
      }
    };
  }
};
var seen = /* @__PURE__ */ new WeakSet();
var transformOnce = (node, context) => {
  if (node.type === 1 && findDir(node, "once", true)) {
    if (seen.has(node) || context.inVOnce) {
      return;
    }
    seen.add(node);
    context.inVOnce = true;
    context.helper(SET_BLOCK_TRACKING);
    return () => {
      context.inVOnce = false;
      const cur = context.currentNode;
      if (cur.codegenNode) {
        cur.codegenNode = context.cache(
          cur.codegenNode,
          true
          /* isVNode */
        );
      }
    };
  }
};
var transformModel = (dir, node, context) => {
  const { exp, arg } = dir;
  if (!exp) {
    context.onError(createCompilerError(41, dir.loc));
    return createTransformProps();
  }
  const rawExp = exp.loc.source;
  const expString = exp.type === 4 ? exp.content : rawExp;
  const bindingType = context.bindingMetadata[rawExp];
  if (bindingType === "props" || bindingType === "props-aliased") {
    context.onError(createCompilerError(44, exp.loc));
    return createTransformProps();
  }
  const maybeRef = false;
  if (!expString.trim() || !isMemberExpression(expString) && !maybeRef) {
    context.onError(createCompilerError(42, exp.loc));
    return createTransformProps();
  }
  const propName = arg ? arg : createSimpleExpression("modelValue", true);
  const eventName = arg ? isStaticExp(arg) ? `onUpdate:${arg.content}` : createCompoundExpression(['"onUpdate:" + ', arg]) : `onUpdate:modelValue`;
  let assignmentExp;
  const eventArg = context.isTS ? `($event: any)` : `$event`;
  {
    assignmentExp = createCompoundExpression([
      `${eventArg} => ((`,
      exp,
      `) = $event)`
    ]);
  }
  const props = [
    // modelValue: foo
    createObjectProperty(propName, dir.exp),
    // "onUpdate:modelValue": $event => (foo = $event)
    createObjectProperty(eventName, assignmentExp)
  ];
  if (dir.modifiers.length && node.tagType === 1) {
    const modifiers = dir.modifiers.map((m) => (isSimpleIdentifier(m) ? m : JSON.stringify(m)) + `: true`).join(`, `);
    const modifiersKey = arg ? isStaticExp(arg) ? `${arg.content}Modifiers` : createCompoundExpression([arg, ' + "Modifiers"']) : `modelModifiers`;
    props.push(createObjectProperty(modifiersKey, createSimpleExpression(
      `{ ${modifiers} }`,
      false,
      dir.loc,
      2
      /* ConstantTypes.CAN_HOIST */
    )));
  }
  return createTransformProps(props);
};
function createTransformProps(props = []) {
  return { props };
}
var validDivisionCharRE = /[\w).+\-_$\]]/;
var transformFilter = (node, context) => {
  if (!isCompatEnabled("COMPILER_FILTER", context)) {
    return;
  }
  if (node.type === 5) {
    rewriteFilter(node.content, context);
  }
  if (node.type === 1) {
    node.props.forEach((prop) => {
      if (prop.type === 7 && prop.name !== "for" && prop.exp) {
        rewriteFilter(prop.exp, context);
      }
    });
  }
};
function rewriteFilter(node, context) {
  if (node.type === 4) {
    parseFilter(node, context);
  } else {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (typeof child !== "object")
        continue;
      if (child.type === 4) {
        parseFilter(child, context);
      } else if (child.type === 8) {
        rewriteFilter(node, context);
      } else if (child.type === 5) {
        rewriteFilter(child.content, context);
      }
    }
  }
}
function parseFilter(node, context) {
  const exp = node.content;
  let inSingle = false;
  let inDouble = false;
  let inTemplateString = false;
  let inRegex = false;
  let curly = 0;
  let square = 0;
  let paren = 0;
  let lastFilterIndex = 0;
  let c, prev, i, expression, filters = [];
  for (i = 0; i < exp.length; i++) {
    prev = c;
    c = exp.charCodeAt(i);
    if (inSingle) {
      if (c === 39 && prev !== 92)
        inSingle = false;
    } else if (inDouble) {
      if (c === 34 && prev !== 92)
        inDouble = false;
    } else if (inTemplateString) {
      if (c === 96 && prev !== 92)
        inTemplateString = false;
    } else if (inRegex) {
      if (c === 47 && prev !== 92)
        inRegex = false;
    } else if (c === 124 && // pipe
    exp.charCodeAt(i + 1) !== 124 && exp.charCodeAt(i - 1) !== 124 && !curly && !square && !paren) {
      if (expression === void 0) {
        lastFilterIndex = i + 1;
        expression = exp.slice(0, i).trim();
      } else {
        pushFilter();
      }
    } else {
      switch (c) {
        case 34:
          inDouble = true;
          break;
        case 39:
          inSingle = true;
          break;
        case 96:
          inTemplateString = true;
          break;
        case 40:
          paren++;
          break;
        case 41:
          paren--;
          break;
        case 91:
          square++;
          break;
        case 93:
          square--;
          break;
        case 123:
          curly++;
          break;
        case 125:
          curly--;
          break;
      }
      if (c === 47) {
        let j = i - 1;
        let p;
        for (; j >= 0; j--) {
          p = exp.charAt(j);
          if (p !== " ")
            break;
        }
        if (!p || !validDivisionCharRE.test(p)) {
          inRegex = true;
        }
      }
    }
  }
  if (expression === void 0) {
    expression = exp.slice(0, i).trim();
  } else if (lastFilterIndex !== 0) {
    pushFilter();
  }
  function pushFilter() {
    filters.push(exp.slice(lastFilterIndex, i).trim());
    lastFilterIndex = i + 1;
  }
  if (filters.length) {
    warnDeprecation("COMPILER_FILTER", context, node.loc);
    for (i = 0; i < filters.length; i++) {
      expression = wrapFilter(expression, filters[i], context);
    }
    node.content = expression;
  }
}
function wrapFilter(exp, filter, context) {
  context.helper(RESOLVE_FILTER);
  const i = filter.indexOf("(");
  if (i < 0) {
    context.filters.add(filter);
    return `${toValidAssetId(filter, "filter")}(${exp})`;
  } else {
    const name = filter.slice(0, i);
    const args = filter.slice(i + 1);
    context.filters.add(name);
    return `${toValidAssetId(name, "filter")}(${exp}${args !== ")" ? "," + args : args}`;
  }
}
var seen$1 = /* @__PURE__ */ new WeakSet();
var transformMemo = (node, context) => {
  if (node.type === 1) {
    const dir = findDir(node, "memo");
    if (!dir || seen$1.has(node)) {
      return;
    }
    seen$1.add(node);
    return () => {
      const codegenNode = node.codegenNode || context.currentNode.codegenNode;
      if (codegenNode && codegenNode.type === 13) {
        if (node.tagType !== 1) {
          makeBlock(codegenNode, context);
        }
        node.codegenNode = createCallExpression(context.helper(WITH_MEMO), [
          dir.exp,
          createFunctionExpression(void 0, codegenNode),
          `_cache`,
          String(context.cached++)
        ]);
      }
    };
  }
};
function getBaseTransformPreset(prefixIdentifiers) {
  return [
    [
      transformOnce,
      transformIf,
      transformMemo,
      transformFor,
      ...[transformFilter],
      ...true ? [transformExpression] : [],
      transformSlotOutlet,
      transformElement,
      trackSlotScopes,
      transformText
    ],
    {
      on: transformOn,
      bind: transformBind,
      model: transformModel
    }
  ];
}
function baseCompile(template, options = {}) {
  const onError = options.onError || defaultOnError;
  const isModuleMode = options.mode === "module";
  {
    if (options.prefixIdentifiers === true) {
      onError(createCompilerError(
        47
        /* ErrorCodes.X_PREFIX_ID_NOT_SUPPORTED */
      ));
    } else if (isModuleMode) {
      onError(createCompilerError(
        48
        /* ErrorCodes.X_MODULE_MODE_NOT_SUPPORTED */
      ));
    }
  }
  const prefixIdentifiers = false;
  if (options.cacheHandlers) {
    onError(createCompilerError(
      49
      /* ErrorCodes.X_CACHE_HANDLER_NOT_SUPPORTED */
    ));
  }
  if (options.scopeId && !isModuleMode) {
    onError(createCompilerError(
      50
      /* ErrorCodes.X_SCOPE_ID_NOT_SUPPORTED */
    ));
  }
  const ast = isString3(template) ? baseParse(template, options) : template;
  const [nodeTransforms, directiveTransforms] = getBaseTransformPreset();
  transform(ast, extend({}, options, {
    prefixIdentifiers,
    nodeTransforms: [
      ...nodeTransforms,
      ...options.nodeTransforms || []
      // user transforms
    ],
    directiveTransforms: extend(
      {},
      directiveTransforms,
      options.directiveTransforms || {}
      // user transforms
    )
  }));
  return generate(ast, extend({}, options, {
    prefixIdentifiers
  }));
}

// packages/vue/src/index.ts
function compileToFunction(template, options = {}) {
  const { code } = baseCompile(template, options);
  const render = new Function("Vue", code)(runtime_dom_esm_exports);
  return render;
}
registerRuntimeCompiler(compileToFunction);
export {
  ReactiveEffect,
  closeBlock,
  computed,
  createApp,
  createBaseVNode,
  createElementBlock,
  createElementVNode,
  createRenderer,
  createTextVNode,
  createVNode,
  effect,
  h,
  isProxy,
  isReactive,
  isReadonly,
  isRef,
  markRaw,
  openBlock,
  reactive,
  readonly,
  ref,
  registerRuntimeCompiler,
  shallowReactive,
  toDisplayString,
  toRaw,
  toRef,
  toRefs,
  unRef
};
//# sourceMappingURL=vue.esm.js.map
