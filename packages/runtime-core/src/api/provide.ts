import { getCurrentInstance } from '../internal/component/component';

export function provide(key: string, value: any) {
  // 获取当前组件实例
  const currentInstance: any = getCurrentInstance();
  if (currentInstance) {
    // 获取当前组件实例上 provides 属性
    // 此时的 provides 默认值是：parent.provides
    let { provides } = currentInstance;
    // 获取当前父级组件的 provides 属性
    const parentProvides = currentInstance.parent
      ? currentInstance.parent.provides
      : currentInstance.appContext.provides;
    // 如果当前的 provides 和父级的 provides 相同则说明还没赋值
    if (provides === parentProvides) {
      // provides 还没赋值，还是初始化的值
      // 使用原型继承再次赋值
      // 使用原型的好处是，当我们在 currentInstance.provides 上访问某个属性的时候，如果不存在，会自动去原型对象上查找
      provides = currentInstance.provides = Object.create(parentProvides);
    }
    // 赋值操作
    provides[key] = value;
  }
}

export function inject(key: string, defaultValue: any) {
  // 获取当前组件实例对象
  const currentInstance: any = getCurrentInstance();
  if (currentInstance) {
    // 根组件，返回 appContext 的 provides
    // 其他组件，返回 父组件的 provides (为什么是父级呢？因为 provide 一定是上层提供)
    const provides =
      currentInstance.parent == null
        ? currentInstance.vnode.appContext &&
          currentInstance.vnode.appContext.provides
        : currentInstance.parent.provides;
    if (provides && key in provides) {
      return provides[key];
    } else if (defaultValue) {
      return defaultValue;
    }
  }
}
