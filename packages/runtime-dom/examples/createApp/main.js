import { createApp } from '../../dist/runtime-dom.esm.js';

const app = createApp({
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
  }
});

console.log('app', app);

app.mount('#app', { age: 1 });
