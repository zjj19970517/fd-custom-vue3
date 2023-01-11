import { createApp, h, ref } from '../../dist/vue.esm.js';

// import { childrenSequence1 as childrenSequence } from './patchArray.js';
// import { childrenSequence2 as childrenSequence } from './patchArray.js';
// import { childrenSequence3 as childrenSequence } from './patchArray.js';
// import { childrenSequence4 as childrenSequence } from './patchArray.js';
// import { childrenSequence5 as childrenSequence } from './patchArray.js';
import { childrenSequence6 as childrenSequence } from './patchArray.js';

const { prevChildren, nextChildren } = childrenSequence;

const app = createApp({
  setup() {
    const toggle = ref(false);

    const onChange = () => {
      toggle.value = true;
    };
    window.onChange = onChange;

    setTimeout(() => {
      onChange();
    }, 2000);
    return {
      toggle
    };
  },
  render() {
    return this.toggle
      ? h('div', {}, nextChildren)
      : h('div', {}, prevChildren);
  }
});

app.mount('#app');
