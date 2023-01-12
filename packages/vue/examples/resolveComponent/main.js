import { createApp, reactive, h } from '../../dist/vue.esm.js';

const TestName = {
  name: 'TestName',
  props: {
    name: {
      type: String,
      default: 'default name'
    }
  },
  setup() {
    return {};
  },
  template: `
      <div>
        <p>静态节点1</p>
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
      age: 100
    });

    const onClick = () => {
      console.log('点击');
    };

    // setTimeout(() => {
    //   state.count = 101;
    //   state.name = 'meils';
    // }, 2000);

    const onChange = () => {
      state.name = 'meils';
    };

    window.onChange = onChange;

    return {
      state,
      onClick
    };
  },
  template: `
      <div>
        <p>静态节点</p>
        <p>Count: {{ this.state.count }}</p>
        <test-name :name="this.state.name" :age="this.state.age" @select="this.onClick"></test-name>
      </div>
    `
});

app.mount('#app');

// const vnode = h('div', {}, [h('span', { class: 'inner' }, 'hello world')]);

// console.log('测试虚拟DOM', vnode);
