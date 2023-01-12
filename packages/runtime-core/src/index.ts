export {
  reactive,
  ref,
  computed,
  shallowReactive,
  readonly,
  unRef,
  isRef,
  toRef,
  toRefs,
  isProxy,
  isReactive,
  isReadonly,
  markRaw,
  toRaw,
  effect,
  ReactiveEffect
} from '@meils/vue-reactivity';

// api
export { createRenderer } from './internal/renderer';
export { h } from './api/h';
export {
  watch,
  watchEffect,
  watchPostEffect,
  watchSyncEffect
} from './api/watch';
export {
  onBeforeMount,
  onMounted,
  onBeforeUnmount,
  onBeforeUpdate,
  onUnmounted,
  onUpdated
} from './api/lifecycle';

// compiler
export { registerRuntimeCompiler } from './internal/component/component';

// vnode
export {
  openBlock,
  closeBlock,
  createElementBlock,
  createTextVNode,
  createElementVNode,
  toDisplayString,
  renderList
} from './internal/vnode/utils';
export * from './internal/vnode/resolveAssets';
export { createVNode, createBaseVNode, Text, Fragment } from './internal/vnode';

// types export
export type {
  RendererElement,
  RendererNode,
  RendererOptions,
  Renderer
} from './internal/renderer';

export type {
  WatchCallback,
  OnCleanup,
  WatchEffect,
  WatchOptionsBase,
  WatchOptions,
  WatchStopHandle
} from './api/watch';
