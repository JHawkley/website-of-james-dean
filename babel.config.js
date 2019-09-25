/* global module, __dirname */

const ospath = require("path");

const isProduction = process.env.NODE_ENV === "production";
const absoluteRuntime = ospath.resolve(__dirname, "./node_modules/@babel/runtime-corejs3");

const removePropTypes = [
  "transform-react-remove-prop-types",
  {
    removeImport: true,
    additionalLibraries: ["tools/propTypes", "tools/extensions/propTypes"]
  }
];

const presetNextBabel = [
  "next/babel",
  {
    "preset-env": {
      include: ["transform-arrow-functions"]
    },
    "transform-runtime": {
      corejs: { version: 3, proposals: true },
      useESModules: true,
      absoluteRuntime
    }
  }
];

module.exports = {
  sourceType: "unambiguous",
  plugins: [
    "@babel/plugin-proposal-export-default-from",
    "@babel/plugin-proposal-export-namespace-from",
    "@babel/plugin-proposal-optional-chaining",
    "@babel/plugin-proposal-nullish-coalescing-operator",
    "@babel/plugin-proposal-function-bind",
    "@babel/plugin-proposal-throw-expressions",
    "@babel/plugin-proposal-async-generator-functions",
    isProduction && "closure-elimination",
    isProduction && "@babel/plugin-transform-react-constant-elements",
    isProduction && "transform-resolve-wildcard-import"
  ].filter(Boolean),
  presets: [
    presetNextBabel
  ],
  overrides: [{
    plugins: [
      isProduction && removePropTypes
    ].filter(Boolean)
  }]
};