/* global module, __dirname */

const ospath = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const absoluteRuntime = ospath.resolve(__dirname, './node_modules/@babel/runtime-corejs3');

const pluginModuleResolver = [
  'module-resolver',
  {
    root: ['.'],
    alias: { styles: './styles' },
    cwd: 'babelrc'
  }
];

const pluginWrapInJs = [
  'wrap-in-js',
  {
    extensions: ['css$', 'scss$']
  }
];

const presetNextBabel = [
  'next/babel',
  {
    // 'preset-env': { 'useBuiltIns': 'usage' },
    'transform-runtime': {
      corejs: { version: 3, proposals: true },
      absoluteRuntime
    }
  }
];

module.exports = {
  sourceType: 'unambiguous',
  plugins: [
    '@babel/plugin-proposal-export-default-from',
    '@babel/plugin-proposal-export-namespace-from',
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-proposal-function-bind',
    '@babel/plugin-proposal-throw-expressions',
    '@babel/plugin-proposal-async-generator-functions',
    pluginModuleResolver,
    pluginWrapInJs,
    isProduction && 'closure-elimination',
    isProduction && '@babel/plugin-transform-react-constant-elements',
    isProduction && 'transform-resolve-wildcard-import'
  ].filter(Boolean),
  presets: [
    presetNextBabel
  ]
};