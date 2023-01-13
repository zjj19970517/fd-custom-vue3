import { createApp, reactive, provide, inject } from '../../dist/vue.esm.js';

const TestName = {
  name: 'TestName',
  emits: ['select'],
  props: {
    name: {
      type: String,
      default: 'default name'
    }
  },
  setup(ctx) {
    const handleClick = () => {
      ctx.emit('select', 'foo');
    };

    const value = inject('first');
    const globalValue = inject('global');
    console.log('value', value, globalValue);
    return {
      handleClick
    };
  },
  template: `
      <div>
        <p @click="this.handleClick">静态节点1</p>
        <p>Name: {{ this.name }}</p>
      </div>
    `
};

const app = createApp({
  name: 'App',
  components: {
    TestName
  },
  setup() {
    const state = reactive({
      count: 100,
      name: 'zjj',
      age: 100,
      list: ['A', 'B', 'C']
    });

    const onSelect = () => {
      console.log('onSelect');
    };

    provide('first', 'hello');

    return {
      state,
      onSelect
    };
  },
  template: `
      <div>
        <p>静态节点</p>
        <p>Count: {{ this.state.count }}</p>
        <test-name :name="this.state.name" :age="this.state.age" @select="this.onSelect"></test-name>
      </div>
    `
});

app.provide('global', 'dark');

app.mount('#app');

// const vnode = h('div', {}, [h('span', { class: 'inner' }, 'hello world')]);

// console.log('测试虚拟DOM', vnode);
