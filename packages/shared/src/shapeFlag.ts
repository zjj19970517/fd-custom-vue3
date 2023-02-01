/**
 * ShapeFlags 表示虚拟节点的类型
 */
export const enum ShapeFlags {
  ELEMENT = 1, // HTML 或 SVG 标签 普通 DOM 元素   ==> 0b00000001 1
  FUNCTIONAL_COMPONENT = 1 << 1, // 函数组件      ==> 0b00000010 2
  STATEFUL_COMPONENT = 1 << 2, // 有状态组件      ==> 0b00000100 4
  TEXT_CHILDREN = 1 << 3, // 子节点为纯文本        ==> 0b00001000 8
  ARRAY_CHILDREN = 1 << 4, // 子节点是数组        ==> 0b00010000 16
  // ...
  // 使用 | 运算 组合两个类型
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT
  // 有状态组件和函数组件都是组件，用 component 表示
}

// 或运算: 0b00000100 | 0b00000010 ==> 0b00000110
