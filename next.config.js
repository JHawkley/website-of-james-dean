/* global module, __dirname */

const ospath = require('path');
const glob = require('glob');
const jumpLoader = require('./webpack/jump-loader');
const imageMediaLoader = require('./webpack/image-media-loader');
const soundMediaLoader = require('./webpack/sound-media-loader');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const WebpackBarPlugin = require('webpackbar');

const jsConfig = require('./jsconfig.json');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  webpack(config, { dir, isServer }) {

    /* == Resolver Settings == */
    // Map `.jsconfig.json` aliases.
    mapAliases(jsConfig.compilerOptions.paths, config, dir);

    // Force modules to use CoreJS 3.
    config.resolve.alias = Object.assign(config.resolve.alias, {
      '@babel/runtime-corejs2': ospath.resolve(dir, './node_modules/@babel/runtime-corejs3'),
      'object-assign': ospath.resolve(dir, './node_modules/core-js-pure/stable/object/assign.js')
    });

    // Add custom Webpack loaders to resolver.
    config.resolveLoader.modules.unshift('webpack');

    /* == Externals Settings == */
    // Remove `@babel/runtime-corejs3` from externals.
    config.externals = (config.externals || []).map((ext) => {
      if (typeof ext !== 'function') return ext;
      return (context, request, callback) => {
        if (/@babel(?:\\|\/)runtime-corejs3(?:\\|\/)/.test(request))
          return callback();
        return ext(context, request, callback);
      };
    });

    /* == Module Rules == */
    const useBabelCommonJS = {
      loader: 'babel-loader',
      options: {
        overrides: [{
          plugins: ['add-module-exports'],
          presets: [['next/babel', {
            'preset-env': { modules: 'commonjs' }
          }]]
        }]
      }
    };

    config.module.rules = [
      {
        test: /\.mjs$/i,
        include: /node_modules/,
        type: 'javascript/auto'
      },

      ...config.module.rules,

      cssRule('normal-css', {
        test: /\.(css|scss|sass)$/i,
        rules: [{
          test: /\.sass|scss$/i,
          use: {
            loader: 'sass-loader',
            options: {
              importer: require('node-sass-json-importer')(),
              // These options are from node-sass: https://github.com/sass/node-sass
              outputStyle: 'compressed',
              includePaths: ['styles', 'node_modules']
                .map((d) => ospath.join(dir, d))
                .map((g) => glob.sync(g))
                .reduce((a, c) => a.concat(c), [])
            }
          }
        }],

        optimize: isProduction
      }),

      cssRule('js-as-css', {
        test: /\.(js|mjs)$/i,
        resourceQuery: /(\?|&)as-css(&|$)/,

        exec: true,
        optimize: isProduction,
        before: useBabelCommonJS
      }),

      {
        test: new RegExp(`\\.(${imageMediaLoader.supportedTypes.join('|')})$`, 'i'),
        loader: 'image-media-loader'
      },

      {
        test: new RegExp(`\\.(${soundMediaLoader.supportedTypes.join('|')})$`, 'i'),
        loader: 'sound-media-loader'
      },

      {
        resourceQuery: /(\?|&)jump(&|$)/,
        loader: 'jump-loader',
        options: { extensions: this.pageExtensions }
      }
    ].filter(Boolean);

    /* == Patches == */
    if (!isServer) patchMain(['./patch/client-router.js'], config);

    /* == Plugins == */
    config.plugins = [
      ...config.plugins,

      new WebpackBarPlugin({
        name: isServer ? 'server' : 'client',
        fancy: true
      }),

      isProduction && !isServer && new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: ospath.join(__dirname, './bundle-report.html'),
        openAnalyzer: false,
        generateStatsFile: true,
        statsFilename: 'webpack-stats.json',
        statsOptions: {
          moduleSort: 'issuerId',
          maxModules: Infinity,
          excludeModules: [
            /node_modules(?:\\|\/)@babel(?:\\|\/)runtime-corejs3(?:\\|\/)/,
            /node_modules(?:\\|\/)core-js-pure(?:\\|\/)/
          ],
          depth: true,
          entrypoints: true,
          optimizationBailout: true,
          providedExports: true,
          source: false,
          usedExports: true
        }
      })
    ].filter(Boolean);

    /* == Optimization == */
    if (!isServer) {
      // Prevent Webpack's `setImmediate` polyfill.
      config.node = Object.assign(config.node || {}, { setImmediate: false });
    }

    return config;
  },

  async exportPathMap(defaultPathMap, {dir}) {
    return jumpLoader.derivePathMap(dir, this.pageExtensions);
  },

  pageExtensions: ['jsx', 'js']
};

function patchMain(patches, webkitConfig) {
  if (patches.length === 0) return;

  const originalEntry = webkitConfig.entry;
  webkitConfig.entry = async () => {
    const entries = await originalEntry();
    if (!entries['main.js']) return entries;

    const unincluded = patches.filter(patch => !entries['main.js'].includes(patch));
    if (unincluded.length > 0) entries['main.js'].unshift(...unincluded);

    return entries;
  };
}

function cssRule(ident, config) {
  let { exec, optimize, before, after } = config;
  before = Array.isArray(before) ? before : [before].filter(Boolean);
  after = Array.isArray(after) ? after : [after].filter(Boolean);

  delete config.exec;
  delete config.optimize;
  delete config.before;
  delete config.after;

  const cleanOptions = optimize ? { level: 2 } : { format: 'beautify' };

  return Object.assign(config, {
    use: [
      ...after,
      'raw-loader',
      {
        loader: 'postcss-loader',
        options: {
          ident: ident,
          exec: Boolean(exec),
          plugins: [
            require('postcss-easy-import')({prefix: '_'}),
            require('autoprefixer')(),
            require('postcss-clean')(cleanOptions)
          ].filter(Boolean)
        }
      },
      ...before
    ]
  });
}

function mapAliases(jsPaths, webpackConfig, dir) {
  const wpResolve = webpackConfig.resolve;
  for (const jsAlias of Object.keys(jsPaths)) {
    const jsTargets = jsPaths[jsAlias];
    if (jsTargets.length !== 1)
      throw new Error(`expected key \`${jsAlias}\` in \`paths\` entry of \`jsconfig.json\` to have 1 entry`);
    const [jsTarget] = jsTargets;
    const wpAlias = jsAlias.endsWith('/*') ? jsAlias.slice(0, -2) : jsAlias;
    const wpTarget = jsTarget.endsWith('/*') ? jsTarget.slice(0, -2) : jsTarget;
    wpResolve.alias[wpAlias] = ospath.join(dir, wpTarget);
  }
}