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

# 开发调试
pnpm run dev:all
```

## Fixtures

### 第一阶段：

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
- [x] 实现 h API
- [x] 处理 App 根组件渲染流程（引入Vue原本的编译器，编译template，测试vnode）
- [x] 完善 processElement，走通 mount 流程
- [x] 完善 processFragment 
- [x] 调试并确保依赖收集的正确性
- [x] 完善 update 流程之 updateElement、updateFragment
- [x] 完善 update 流程之 patchKeyedChildren
- [x] 测试 patchKeyedChildren 逻辑
- [x] 完善 resolveComponent 
- [x] 完善子组件注册和挂载流程
- [x] 完善子组件更新流程
- [x] 异步更新机制 Scheduler
- [x] 实现 watch、watchEffect
- [x] 实现生命周期
- [x] 调试DOM事件绑定、emit 派发事件
- [x] 实现 provide / inject / app.provide
- [x] 实现 app.use / app.component

### 第二阶段：

- [ ] 规划中...

## Notes

* 该项目是学习型项目，重点在于 Vue 内部逻辑的实现，TS 类型声明完善不是重点、package 打包构建不是重点。
* 该项目本质是 Vue3 源码的简化版本，为了方便以后学习和回顾 Vue3 源码逻辑，因此在变量命名和具体实现上尽可能靠近 Vue3 源码本身。