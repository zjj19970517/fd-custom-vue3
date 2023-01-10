import {
  isArray,
  isFunction,
  isMap,
  isObject,
  isPlainObject,
  isSet,
  isString
} from '@meils/vue-shared';
import { createBaseVNode, createVNode, VNode, VNodeTypes } from './index';

export const blockStack: (VNode[] | null)[] = [];
export let currentBlock: VNode[] | null = null;

/**
 * 标志开启一个 Block
 * @param disableTracking
 */
export function openBlock(disableTracking = false) {
  blockStack.push((currentBlock = disableTracking ? null : []));
}

/**
 * 标志当前 Block 将要关闭了
 */
export function closeBlock() {
  blockStack.pop();
  currentBlock = blockStack[blockStack.length - 1] || null;
}

/**
 * 创建 Text 虚拟DOM
 * @param text 文本内容
 * @param flag patchFlag 为 0
 * @returns
 */
export function createTextVNode(text = '', flag = 0): VNode {
  return createVNode(Text, null, text, flag);
}

/**
 * 创建元素 Block
 * @param type
 * @param props
 * @param children
 * @param patchFlag
 * @param dynamicProps
 * @param shapeFlag
 * @returns
 */
export function createElementBlock(
  type: VNodeTypes,
  props: Record<string, unknown> | null = null,
  children: unknown = null,
  patchFlag?: number,
  dynamicProps?: string[],
  shapeFlag?: number
) {
  const vnode = createBaseVNode(
    type,
    props,
    children,
    patchFlag,
    shapeFlag,
    true /* isBlockNode */
  );
  vnode.dynamicChildren = currentBlock;
  closeBlock();
  currentBlock && currentBlock.push(vnode);
  return vnode;
}

/**
 * 创建元素 虚拟 DOM
 * @param type
 * @param props
 * @param children
 * @param patchFlag
 * @param shapeFlag
 */
export function createElementVNode(
  type: VNodeTypes,
  props: Record<string, unknown> | null = null,
  children: unknown = null,
  patchFlag = 0,
  shapeFlag = 0
) {
  return createBaseVNode(type, props, children, patchFlag, shapeFlag);
}

/**
 * For converting {{ interpolation }} values to displayed strings.
 * @private
 */
export const toDisplayString = (val: unknown): string => {
  return isString(val)
    ? val
    : val == null
    ? ''
    : isArray(val) ||
      (isObject(val) &&
        (val.toString === Object.prototype.toString ||
          !isFunction(val.toString)))
    ? JSON.stringify(val, replacer, 2)
    : String(val);
};

const replacer = (_key: string, val: any): any => {
  // can't use isRef here since @vue/shared has no deps
  if (val && val.__v_isRef) {
    return replacer(_key, val.value);
  } else if (isMap(val)) {
    return {
      [`Map(${val.size})`]: [...val.entries()].reduce((entries, [key, val]) => {
        (entries as any)[`${key} =>`] = val;
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

export function renderList(
  source: Array<any>,
  renderItem: (...args: any[]) => any
): any[] {
  let children = [];
  if (isArray(source)) {
    children = new Array(source.length);
    for (let i = 0, l = source.length; i < l; i++) {
      children[i] = renderItem(source[i], i);
    }
  }
  return children;
}
