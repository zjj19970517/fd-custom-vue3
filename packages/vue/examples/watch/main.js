import { createApp, reactive, watchEffect, watch } from '../../dist/vue.esm.js';

const app = createApp({
  name: 'App',
  setup() {
    const state = reactive({
      count: 100,
      name: 'zjj',
      age: 100,
      list: ['A', 'B', 'C']
    });

    // watchEffect(() => {
    //   console.log('state', state.count);
    // });

    const stop = watch(
      () => state.count,
      value => {
        console.log('state', value);
      }
    );

    console.log('stop', stop);

    window.onChange = () => {
      state.count++;
    };

    window.onStop = () => {
      stop();
      // 调用 stop 后
      // watch 的回调函数就不再执行了
      state.count++;
    };

    return {
      state
    };
  },
  template: `
      <div>
        <p>Watch</p>
        <p>Count: {{ this.state.count }}</p>
      </div>
    `
});

app.mount('#app');

// const vnode = h('div', {}, [h('span', { class: 'inner' }, 'hello world')]);

// console.log('测试虚拟DOM', vnode);
