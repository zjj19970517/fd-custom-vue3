/* eslint-disable @typescript-eslint/ban-types */
import { EMPTY_OBJ, isFunction, isObject, ShapeFlags } from '@meils/vue-shared';
import {
  pauseTracking,
  proxyRefs,
  ReactiveEffect,
  resetTracking,
  track,
  TrackOpTypes
} from '@meils/vue-reactivity';

import { AppContext, createAppContext } from '../../api/createApp';
import {
  emit,
  NormalizedObjectEmitsOptions,
  normalizeEmitsOptions
} from './componentEmits';
import {
  initProps,
  NormalizedPropsOptions,
  normalizePropsOptions
} from './componentProps';
import { VNode } from '../vnode';
import { PublicCtxProxyHandler } from './componentCtxProxy';
import { LifecycleHooks } from '../../api/lifecycle';
import { currentRenderingInstance } from './componentRenderContext';

export type Component = any;

export type Data = Record<string, unknown>;

export type CtxProxy = any;

export type InternalRenderFunction = {
  (ctx: any): any;
};

type LifecycleHook<TFn = Function> = TFn[] | null;

export interface ComponentInstance {
  uid: number; // 唯一 ID
  vnode: VNode; // 组件对应的虚拟 DOM
  parent: ComponentInstance | null; // 父组件
  root: ComponentInstance | null; // 根组件
  appContext: AppContext; // app 上下文
  type: any; // 组件选项内容 ==> vnode.type
  propsOptions: NormalizedPropsOptions; // 标准化后的 props 选项 options
  emitsOptions: NormalizedObjectEmitsOptions; // 标准化后的 emits 选项 options
  setupState: Data;
  data: Data;
  props: Data;
  attrs: Data;
  refs: Data; // 组件或者 DOM 的 ref 引用
  ctx: Data; // 渲染上下文
  proxy: CtxProxy | null; // 渲染上下文代理
  accessCache: Data | null; // 渲染上下文代理的属性访问缓存
  exposed: Data; // 组件暴露出的内容
  emit: any; // emit 事件
  render: InternalRenderFunction | null;
  effect: ReactiveEffect | null;
  // 带副作用更新函数
  // eslint-disable-next-line @typescript-eslint/ban-types
  update: Function | null;

  // lifecycle
  isMounted: boolean;
  isUnmounted: boolean;
  isDeactivated: boolean;
  subTree: VNode | null;
  [LifecycleHooks.BEFORE_MOUNT]: LifecycleHook;
  [LifecycleHooks.MOUNTED]: LifecycleHook;
  [LifecycleHooks.BEFORE_UPDATE]: LifecycleHook;
  [LifecycleHooks.UPDATED]: LifecycleHook;
  [LifecycleHooks.BEFORE_UNMOUNT]: LifecycleHook;
  [LifecycleHooks.UNMOUNTED]: LifecycleHook;

  provides: Data;
}

export interface SetupContext {
  attrs: Data;
  emit: any;
  expose: (exposed?: Record<string, any>) => void;
}

let uid = 0;

const defaultAppContext = createAppContext(); // 默认的 App 上下文对象

export let currentInstance: ComponentInstance | null = null; // 当前运行的组件实例

// 获取当前执行的组件实例
export const getCurrentInstance: () => ComponentInstance | null = () =>
  currentInstance || currentRenderingInstance;

// 设置当前执行的组件实例
export const setCurrentInstance = (instance: ComponentInstance) => {
  currentInstance = instance;
};

// 重置当前执行的组件实例为 null
export const unsetCurrentInstance = () => {
  currentInstance = null;
};

/**
 * 创建组件实例
 * @param vnode 虚拟 DOM
 * @param parent 父组件实例
 */
export function createComponentInstance(
  vnode: VNode,
  parent: ComponentInstance | null
) {
  const type = vnode.type as any;

  const appContext =
    (parent ? parent.appContext : vnode.appContext!) || defaultAppContext;

  const instance: ComponentInstance = {
    uid: uid++,
    type,
    vnode,
    parent,
    appContext,
    root: null,
    propsOptions: normalizePropsOptions(type), // 标准化出 props 选项
    emitsOptions: normalizeEmitsOptions(type), // 标准化出 emits 选项

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
    subTree: null,
    bm: null,
    m: null,
    bu: null,
    u: null,
    um: null,
    bum: null,
    provides: parent ? parent.provides : appContext.provides
  };

  // 初始化渲染上下文
  instance.ctx = { _: instance };
  // 初始化根组件指针
  instance.root = parent ? parent.root : instance;
  instance.emit = emit.bind(null, instance);

  return instance as ComponentInstance;
}

/**
 * 组件初始化
 * @param instance 组件实例
 */
export function setupComponent(instance: ComponentInstance) {
  const { vnode, type } = instance;
  const { props } = vnode;
  const isStateful = isStatefulComponent(instance);
  // 初始化 props（本质是：初始化 instance.props、instance.attrs）
  initProps(instance, !!isStateful, props);
  // TODO: 初始化 slots
  // initSlots(instance, children)

  if (isStateful) {
    if (__DEV__) {
      // TODO: 校验并标准化 instance.type 中用户传入的自定义选项
    }
    // 创建渲染代理的属性访问缓存
    instance.accessCache = {};
    // 创建渲染上下文代理
    // 执行组件渲染函数的时候，为了方便用户使用，会直接访问渲染上下文 instance.ctx 中的属性，
    // 所以我们也要做一层 proxy，对渲染上下文 instance.ctx 属性的访问和修改，
    // 代理到对 setupState、ctx、data、props 等数据的访问和修改
    instance.proxy = new Proxy(instance.ctx, PublicCtxProxyHandler);

    const { setup } = type;
    if (setup) {
      // 创建 setup 执行上下文
      const setupContext = createSetupContext(instance);
      // 设置当前执行的组件实例（这也就是为什么我们可以在 setup 中使用 getCurrentInstance 获取当前组件实例）
      setCurrentInstance(instance);
      // 准备执行  setup 函数，此时暂停依赖收集
      pauseTracking();
      const setupResult = setup(instance.props, setupContext);
      resetTracking();
      unsetCurrentInstance();

      // 处理setup 执行
      if (isFunction(setupResult)) {
        // 如果返回函数类型，则将其定为组件的 render 函数
        instance.render = setupResult;
      } else if (isObject(setupResult)) {
        // 设置 setupState
        // proxyRefs 的作用就是把 setupResult 对象做一层代理
        // 方便用户直接访问 ref 类型的值
        // 这就是为什么我们在 template 中不需要写 .value 的原因所在
        instance.setupState = proxyRefs(setupResult);
      } else {
        console.log(
          'The execution result only supports object and function types'
        );
      }
    }

    // 补全 render 函数
    if (!instance.render) {
      // 当组件没有 render 函数
      // 那么就需要把 template 编译成 render 函数
      if (compile && !type.render) {
        if (type.template) {
          const template = type.template;
          type.render = compile(template);
        }
      }

      instance.render = type.render;
    }

    console.log('【 debug: 组件初始化完毕 】', instance);
  }
}

/**
 * 判断组件是否为有状态的组件
 * @param instance 组件实例
 * @returns
 */
export function isStatefulComponent(instance: ComponentInstance) {
  return instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT;
}

/**
 * 创建 setup 执行上下文
 * @param instance
 */
export function createSetupContext(instance: ComponentInstance): SetupContext {
  // expose 是一个函数，用来传递需要向外部暴露出的属性
  const expose: SetupContext['expose'] = exposed => {
    instance.exposed = exposed || {};
  };

  let _attrs: Data;

  return {
    // 只读
    get attrs() {
      if (_attrs) {
        return _attrs;
      }
      // attrs 也是响应式的
      _attrs = createAttrsProxy(instance);
      return _attrs;
    },
    emit: instance.emit,
    expose
  };
}

/**
 * 创建 attrs 属性的代理，使其成为响应式
 * @param instance
 * @returns
 */
function createAttrsProxy(instance: ComponentInstance): Data {
  return new Proxy(instance.attrs, {
    get(target, key: string) {
      track(instance, TrackOpTypes.GET, '$attrs');
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

type CompileFunction = (
  template: string | object,
  options?: any
) => InternalRenderFunction;

let compile: CompileFunction | undefined;

/**
 * 注册运行时编译器的函数
 * @param _compile 自定义的编译器
 */
export function registerRuntimeCompiler(_compile: any) {
  compile = _compile;
}
