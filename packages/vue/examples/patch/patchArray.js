import { h } from '../../dist/vue.esm.js';

// a b
// a b c
export const childrenSequence1 = {
  prevChildren: [h('p', { key: 'a' }, 'a'), h('p', { key: 'b' }, 'b')],
  nextChildren: [
    h('p', { key: 'a' }, 'a'),
    h('p', { key: 'b' }, 'b'),
    h('p', { key: 'c' }, 'c')
  ]
};

// a b
// d a b
export const childrenSequence2 = {
  prevChildren: [h('p', { key: 'a' }, 'a'), h('p', { key: 'b' }, 'b')],
  nextChildren: [
    h('p', { key: 'd' }, 'd'),
    h('p', { key: 'a' }, 'a'),
    h('p', { key: 'b' }, 'b')
  ]
};

// (a b) c
// (a b) d e
export const childrenSequence3 = {
  prevChildren: [
    h('p', { key: 'a' }, 'a'),
    h('p', { key: 'b' }, 'b'),
    h('p', { key: 'c' }, 'c')
  ],
  nextChildren: [
    h('p', { key: 'a' }, 'a'),
    h('p', { key: 'b' }, 'b'),
    h('p', { key: 'd' }, 'd'),
    h('p', { key: 'e' }, 'e')
  ]
};

// a (b c)
// d e (b c)
export const childrenSequence4 = {
  prevChildren: [
    h('p', { key: 'a' }, 'a'),
    h('p', { key: 'b' }, 'b'),
    h('p', { key: 'c' }, 'c')
  ],
  nextChildren: [
    h('p', { key: 'd' }, 'd'),
    h('p', { key: 'e' }, 'e'),
    h('p', { key: 'b' }, 'b'),
    h('p', { key: 'c' }, 'c')
  ]
};

// a,b,(c,d,e,z),f,g
// a,b,(d,c,y,e),f,g
export const childrenSequence5 = {
  prevChildren: [
    h('p', { key: 'a' }, 'a'),
    h('p', { key: 'b' }, 'b'),
    h('p', { key: 'c' }, 'c'),
    h('p', { key: 'd' }, 'd'),
    h('p', { key: 'e' }, 'e'),
    h('p', { key: 'Z' }, 'Z'),
    h('p', { key: 'f' }, 'f'),
    h('p', { key: 'g' }, 'g')
  ],
  nextChildren: [
    h('p', { key: 'a' }, 'a'),
    h('p', { key: 'b' }, 'b'),
    h('p', { key: 'd' }, 'd'),
    h('p', { key: 'c' }, 'c'),
    h('p', { key: 'Y' }, 'Y'),
    h('p', { key: 'e' }, 'e'),
    h('p', { key: 'f' }, 'f'),
    h('p', { key: 'g' }, 'g')
  ]
};

// a,b,(c,d,e),f,g
// a,b,(e,c,d),f,g
export const childrenSequence6 = {
  prevChildren: [
    h('p', { key: 'a' }, 'a'),
    h('p', { key: 'b' }, 'b'),
    h('p', { key: 'c' }, 'c'),
    h('p', { key: 'd' }, 'd'),
    h('p', { key: 'e' }, 'e'),
    h('p', { key: 'f' }, 'f'),
    h('p', { key: 'g' }, 'g')
  ],
  nextChildren: [
    h('p', { key: 'a' }, 'a'),
    h('p', { key: 'b' }, 'b'),
    h('p', { key: 'e' }, 'e'),
    h('p', { key: 'c' }, 'c'),
    h('p', { key: 'd' }, 'd'),
    h('p', { key: 'f' }, 'f'),
    h('p', { key: 'g' }, 'g')
  ]
};
