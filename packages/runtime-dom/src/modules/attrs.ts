export function patchAttr(el: Element, key: string, value: any) {
  if (value === null || value === '') {
    el.removeAttribute(key);
  } else {
    el.setAttribute(key, value);
  }
}
