import * as runtimeDom from '@meils/vue-runtime-dom';
import { registerRuntimeCompiler } from '@meils/vue-runtime-dom';

export * from '@meils/vue-runtime-dom';

import { compile } from '@vue/compiler-dom'; // 先使用 Vue 自身的编译器

function compileToFunction(template: any, options = {}) {
  const { code } = compile(
    template,
    Object.assign(options, {
      hoistStatic: true
    })
  );

  // 调用 compile 得到的代码在给封装到函数内，
  // 这里会依赖 runtimeDom 的一些函数，所以在这里通过参数的形式注入进去
  const render = new Function('Vue', code)(runtimeDom);

  return render;
}

registerRuntimeCompiler(compileToFunction);
