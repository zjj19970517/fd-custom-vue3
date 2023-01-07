// Reactive 的特殊标志属性
export const enum ReactiveFlags {
  SKIP = '__v_skip',
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
  IS_SHALLOW = '__v_isShallow',
  RAW = '__v_raw'
}

export interface Target {
  [ReactiveFlags.SKIP]?: boolean; // 表示跳过，不需要代理
  [ReactiveFlags.IS_REACTIVE]?: boolean; // !isReadonly === true 处理后会标记这个属性
  [ReactiveFlags.IS_READONLY]?: boolean; // isReadonly === true 处理后会标记这个属性
  [ReactiveFlags.IS_SHALLOW]?: boolean; // 浅处理，会标记这个属性
  [ReactiveFlags.RAW]?: any;
}

export const enum TargetType {
  INVALID = 0, // 无效类型
  COMMON = 1, // 基础类型
  COLLECTION = 2 // 集合类型
}
