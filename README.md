<br>


<h1 align="center">Custom Vue3</h1>

<p align="center">
手写 Mini 版 Vue3，加深对 Vue3 源码的理解
</p>

<br>
<br>

## Usage

```
# 安装依赖
pnpm i

# 开发调试构建 package，使用 dev script，具体使用参考如下
pnpm run dev reactivity -f esm
pnpm run dev vue -f global
```

## Fixtures

> 按照如下流程来完成：

- [x] reactive 的实现
- [x] effect 的实现
- [x] readonly 的实现
- [x] ref 的实现
- [x] computed 的实现
- [x] 初始化 vue package
- [x] 初始化 runtime-dom、runtime-core 这两个 package
- [x] 完成 runtime-dom 中操作节点和属性的方法
- [x] 初始化 createRender 方法
- [x] 完成 createApp API
- [x] 实现虚拟 DOM
- [x] 处理 renderer 中的 patch 逻辑
- [x] 开始处理组件 mountComponent 的流程
- [x] 创建组件实例
- [x] 组件实例初始化
  - [x] 初始化 props、渲染上下文代理
  - [x] 执行 setup 函数
  - [x] 处理 setup 执行结果
