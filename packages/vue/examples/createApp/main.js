import { createApp, reactive, h } from '../../dist/vue.esm.js';

const app = createApp(
  {
    name: 'App',
    props: {
      name: {
        type: String,
        default: ''
      },
      age: {
        type: Number,
        default: 0
      }
    },
    emits: ['change'],
    setup(props, ctx) {
      const state = reactive({
        count: 100,
        mag: 'test',
        name: props.name
      });

      const onClick = () => {
        console.log('点击');
      };

      ctx.expose({
        state
      });

      setTimeout(() => {
        state.count = 101;
      }, 2000);

      return {
        state,
        onClick
      };
    },
    template: `
      <div>
        <p>静态节点</p>
        <p>Count: {{ this.state.count }}</p>
        <button @click="this.onClick">更新 Count</button>
        <span v-for="item in [1, 2, 3, 4, 5]" key="item">{{ item }}</span>
      </div>
    `
  },
  { name: 'ZJJ', age: 26 }
);

app.mount('#app', { age: 1 });

// const vnode = h('div', {}, [h('span', { class: 'inner' }, 'hello world')]);

// console.log('测试虚拟DOM', vnode);
