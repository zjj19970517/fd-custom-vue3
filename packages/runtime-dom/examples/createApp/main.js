import { createApp, reactive, h } from '../../dist/runtime-dom.esm.js';

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
    render() {
      return h('div', {}, [h('span', { class: 'inner' }, [this.state.count])]);
    }
  },
  { name: 'ZJJ', age: 26 }
);

app.mount('#app', { age: 1 });

// const vnode = h('div', {}, [h('span', { class: 'inner' }, 'hello world')]);

// console.log('测试虚拟DOM', vnode);
