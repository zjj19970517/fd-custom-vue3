/*
 * 开发环境使用 esbuild 编译
 * 沿用 Vue3 的方案
 */
const { build } = require('esbuild');
const nodePolyfills = require('@esbuild-plugins/node-modules-polyfill');
const { resolve, relative } = require('path');
const args = require('minimist')(process.argv.slice(2)); // 解析出参数

const target = args._[0] || 'vue'; // 要构建的目标，args._ 是不带 - 的参数
const format = args.f || 'esm'; // 要输出的格式
const inlineDeps = args.i || args.inline;
const pkg = require(resolve(__dirname, `../packages/${target}/package.json`)); // 获取目标的 package.json 文件

// 得到要输出的格式，or iife or cjs or esm
const outputFormat = format.startsWith('global')
  ? 'iife'
  : format === 'cjs'
  ? 'cjs'
  : 'esm';

// 后缀
const postfix = format.endsWith('-runtime')
  ? `runtime.${format.replace(/-runtime$/, '')}`
  : format;

// 输出文件的名称
const outfile = resolve(
  __dirname,
  `../packages/${target}/dist/${
    target === 'vue-compat' ? `vue` : target
  }.${postfix}.js`
);

const relativeOutfile = relative(process.cwd(), outfile);

// 构建需要 external 的内容
let external = [];
if (!inlineDeps) {
  // cjs & esm : external all peers
  if (format === 'cjs' || format.includes('esm')) {
    external = [
      ...external,
      ...Object.keys(pkg.peerDependencies || {}),
      'path',
      'url',
      'stream'
    ];
  }
}

build({
  entryPoints: [resolve(__dirname, `../packages/${target}/src/index.ts`)], // 入口
  outfile,
  bundle: true, // 产出 bundle
  external,
  sourcemap: true, // 默认开启了 sourcemap 调试
  format: outputFormat, // 输出的格式
  globalName: pkg.buildOptions?.name, // global 模式下的命名
  platform: format === 'cjs' ? 'node' : 'browser', // 平台
  plugins:
    format === 'cjs' || pkg.buildOptions?.enableNonBrowserBranches
      ? [nodePolyfills.default()]
      : undefined,
  // 定义的环境变量值
  define: {
    __COMMIT__: `"dev"`,
    __VERSION__: `"${pkg.version}"`,
    __DEV__: `true`,
    __TEST__: `false`,
    __BROWSER__: String(
      format !== 'cjs' && !pkg.buildOptions?.enableNonBrowserBranches
    ),
    __GLOBAL__: String(format === 'global'),
    __ESM_BUNDLER__: String(format.includes('esm-bundler')),
    __ESM_BROWSER__: String(format.includes('esm-browser')),
    __NODE_JS__: String(format === 'cjs'),
    __SSR__: String(format === 'cjs' || format.includes('esm-bundler')),
    __COMPAT__: String(target === 'vue-compat'),
    __FEATURE_SUSPENSE__: `true`,
    __FEATURE_OPTIONS_API__: `true`,
    __FEATURE_PROD_DEVTOOLS__: `false`
  },
  // 开启 watch 模式
  watch: {
    onRebuild(error) {
      if (!error) console.log(`rebuilt: ${relativeOutfile}`);
    }
  }
}).then(() => {
  // 构建完成后输出的内容
  console.log(`builded: ${relativeOutfile}`);
});
