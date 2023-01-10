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
        count: 1,
        mag: 'test',
        name: props.name
      });

      const onClick = () => {
        console.log('点击');
      };

      ctx.expose({
        state
      });

      return {
        state,
        onClick
      };
    },
    template: `
      <div><p>静态节点</p><span>{{this.state.count}}</span></div>
    `
  },
  { name: 'ZJJ', age: 26 }
);

app.mount('#app', { age: 1 });

// const vnode = h('div', {}, [h('span', { class: 'inner' }, 'hello world')]);

// console.log('测试虚拟DOM', vnode);
