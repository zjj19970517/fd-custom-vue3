// onClick="fn1" ==> onClick="fn2"
// 事件绑定的处理，跟其他属性不一样，我们不能使用 addEventlistener 两次，因为新的事件处理函数不会覆盖。

// eslint-disable-next-line @typescript-eslint/ban-types
type EventValue = EventListener;

interface Invoker extends EventListener {
  value: EventValue;
}

export function patchEvent(
  el: Element & { _evCache?: Record<string, Invoker | undefined> },
  key: string,
  oldValue: EventValue,
  value: EventValue
) {
  const cache = el._evCache || (el._evCache = {}); // 元素节点 缓存一个绑定的事件列表
  const existingCache = cache[key]; // 是否存在缓存
  if (!!value && !!existingCache) {
    // 存在缓存 && 有新值
    existingCache.value = value;
  } else {
    // 无缓存
    const rawEventName = key.slice(2).toLowerCase();
    if (value) {
      // 缓存事件处理函数
      const listener = (cache[key] = createEventInvoker(value));
      // 添加事件
      el.addEventListener(rawEventName, listener);
    } else {
      // 需要删除事件绑定
      el.removeEventListener(rawEventName, existingCache!);
      // 删除缓存
      cache[key] = undefined;
    }
  }
}

function createEventInvoker(value: EventValue) {
  const fn: Invoker = (e: Event) => {
    fn.value(e);
  };
  // 更新事件的处理函数，我们只需要更新 .value 属性即可，下次调用的时候，自然会执行新的函数
  fn.value = value;
  return fn;
}
