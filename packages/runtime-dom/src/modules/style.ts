import { isString } from '@meils/vue-shared';

type Style = string | Record<string, string> | null; // 样式先考虑 字符串、对象、null 这三种类型

const importantStyle = /\s*!important$/; // 最高优先级样式

/**
 * 处理 style 属性的差异更新
 * @param el
 * @param oldValue
 * @param value
 */
export function patchStyle(el: Element, oldValue: Style, value: Style) {
  const currentStyle = (el as HTMLElement).style;
  const stringCSS = isString(value);
  if (value && !stringCSS) {
    // 存在新值 && 新值类型是 object
    // 此处处理新增和更新的情况
    for (const key in value) {
      updateStyle(currentStyle, key, value[key]);
    }
    // 继续处理删除的情况
    if (oldValue && !isString(oldValue)) {
      for (const key in oldValue) {
        if (!value[key]) {
          updateStyle(currentStyle, key, '');
        }
      }
    }
  } else {
    // 不存在新值 || 新值为 string
    if (stringCSS) {
      // 1. 新值为 string
      if (oldValue !== value) {
        currentStyle.cssText = value;
      }
    } else {
      // 2. 不存在新值
      // 删除属性样式
      if (oldValue) {
        el.removeAttribute('style');
      }
    }
  }
}

function updateStyle(style: CSSStyleDeclaration, name: string, val: string) {
  if (val == null) val = '';
  if (importantStyle.test(val)) {
    style.setProperty(name, val.replace(importantStyle, ''), 'important');
  } else {
    style.setProperty(name, val);
  }
}
