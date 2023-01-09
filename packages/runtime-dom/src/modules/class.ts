/**
 * 处理 class 属性的差异更新
 * @param el
 * @param value
 */
export function patchClass(el: Element, value: string | null) {
  if (value == null) {
    // 如果 value 为空，移除改属性
    el.removeAttribute('class');
  } else {
    // 设置 className 属性
    el.className = value;
  }
}
