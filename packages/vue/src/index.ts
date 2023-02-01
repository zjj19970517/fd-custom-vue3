import * as runtimeDom from '@meils/vue-runtime-dom';
import { registerRuntimeCompiler } from '@meils/vue-runtime-dom';

export * from '@meils/vue-runtime-dom';

import { compile } from '@vue/compiler-dom'; // FIXME: 先使用 Vue 自身的编译器

function compileToFunction(template: any, options = {}) {
  const { code } = compile(
    template,
    Object.assign(options, {
      hoistStatic: true
    })
  );
  console.log('编译结果', code);
  // code 的输出结果如下：
  // const _Vue = Vue
  // const { createElementVNode: _createElementVNode } = _Vue

  // const _hoisted_1 = ["onClick"]

  // return function render(_ctx, _cache) {
  //   with (_ctx) {
  //     const { createElementVNode: _createElementVNode, toDisplayString: _toDisplayString, openBlock: _openBlock, createElementBlock: _createElementBlock } = _Vue

  //     return (_openBlock(), _createElementBlock("div", null, [
  //       _createElementVNode("p", { onClick: this.handleClick }, "静态节点1", 8 /* PROPS */, _hoisted_1),
  //       _createElementVNode("p", null, "Name: " + _toDisplayString(this.name), 1 /* TEXT */)
  //     ]))
  //   }
  // }

  // runtimeDom 作为参数 Vue 的实参传入
  // new Function('Vue', code) 构造一个函数
  const render = new Function('Vue', code)(runtimeDom);

  console.log('render', render);
  // render 的结果输出如下：
  // function render(_ctx, _cache) {
  //   with (_ctx) {
  //     const { createElementVNode: _createElementVNode, toDisplayString: _toDisplayString, openBlock: _openBlock, createElementBlock: _createElementBlock } = _Vue

  //     return (_openBlock(), _createElementBlock("div", null, [
  //       _createElementVNode("p", { onClick: this.handleClick }, "静态节点1", 8 /* PROPS */, _hoisted_1),
  //       _createElementVNode("p", null, "Name: " + _toDisplayString(this.name), 1 /* TEXT */)
  //     ]))
  //   }
  // }
  return render;
}

registerRuntimeCompiler(compileToFunction);
