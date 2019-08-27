/* global module, __dirname */

const ospath = require('path');
const glob = require('glob');
const mm = require('micromatch');
const jumpLoader = require('./webpack/jump-loader');
const imageMediaLoader = require('./webpack/image-media-loader');
const soundMediaLoader = require('./webpack/sound-media-loader');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const WebpackBarPlugin = require('webpackbar');
const ShakePlugin = require('webpack-common-shake').Plugin;
const WebpackDeepScopeAnalysisPlugin = require('webpack-deep-scope-plugin').default;

const jsConfig = require('./jsconfig.json');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  webpack(config, { dir, isServer, totalPages }) {

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
    const prefabs = getPrefabs();

    config.module.rules = [
      {
        test: /\.mjs$/i,
        include: /node_modules/,
        type: 'javascript/auto'
      },

      {
        // Fix for missing polyfills in `node_modules`.
        // Without this, IE11 cannot be supported.
        test: /\.(mjs|es\.js)$/i,
        include: /node_modules/,
        use: prefabs.use.babelTransformRuntime
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
        before: prefabs.use.babelCommonJS
      }),

      {
        test: new RegExp(`\\.(${imageMediaLoader.supportedTypes.join('|')})$`, 'i'),
        use: [prefabs.use.babelTransformRuntime, 'image-media-loader']
      },

      {
        test: new RegExp(`\\.(${soundMediaLoader.supportedTypes.join('|')})$`, 'i'),
        loader: [prefabs.use.babelTransformRuntime, 'sound-media-loader']
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

      !isProduction && new WebpackBarPlugin({
        name: isServer ? 'server' : 'client',
        fancy: true
      }),

      isProduction && !isServer && new ShakePlugin(),

      isProduction && !isServer && new WebpackDeepScopeAnalysisPlugin(),

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

    if (isProduction && !isServer) {
      // Customize chunk splitting.
      const splitChunks = config.optimization.splitChunks;

      const matcherFor = (pattern) => {
        const matcher = typeof pattern === 'function' ? pattern : mm.matcher(pattern);
        return (module) => !module.resource ? false : matcher(module.resource);
      };

      const matchNodeModules = mm.matcher(ospath.resolve(dir, './node_modules/**'));
      const reNameData = /(?:\\|\/)(pages|runtime)(?:\\|\/)(.*)\.js/;

      const testReact = matcherFor('**/node_modules/(react|react-dom)/**');
      const testCoreJS = matcherFor('**/node_modules/(core-js|@babel/runtime-corejs3)/**');

      const isAppEntry = (nameData) => {
        if (!nameData) return false;
        if (nameData.dir !== 'pages') return true;
        if (nameData.name === '_app') return true;
        return false;
      };

      const isPageEntry = (nameData) =>
        Boolean(nameData) && !isAppEntry(nameData);

      const getPageEntries = (nameData) =>
        nameData.filter(isPageEntry);

      const isModuleVendor = ({context}) =>
        context && matchNodeModules(context);

      const getNameData = ({name}) => {
        if (!name) return null;

        const nameData = reNameData.exec(name);
        if (!nameData) return null;

        const baseName = ospath.basename(nameData[2]);
        return { dir: nameData[1], name: nameData[2], baseName };
      };

      const dedupeNameData = (nameDataArr) => {
        const len = nameDataArr.length;
        const namesSet = new Set();

        for (let i = 0; i < len; i++) {
          const data = nameDataArr[i];
          const { name, baseName } = data;

          if (name === baseName)
            namesSet.add(name);
          else if (namesSet.has(baseName))
            namesSet.add(name);
          else {
            const dupe = nameDataArr.some(d => data !== d && baseName === d.baseName);
            namesSet.add(dupe ? name : baseName);
          }
        }

        return Array.from(namesSet);
      };

      const minShared = 2;
      const minCommon = Math.max(minShared + 1, Math.round(totalPages * 0.5));

      const pageShared = {
        name: (module, chunks) => {
          const pageNames = dedupeNameData(getPageEntries(chunks.map(getNameData)));
          if (pageNames.length >= minShared * 2) return 'page-shared';
          return `page-shared~${pageNames.sort().join('+')}`;
        },
        test: (module, chunks) => getPageEntries(chunks.map(getNameData)).length >= 2,
        chunks: 'all',
        minChunks: minShared,
        minSize: 2000,
        priority: 0
      };

      const appShared = {
        name: 'app-shared',
        test: (module, chunks) => chunks.map(getNameData).some(isAppEntry),
        chunks: 'all',
        minChunks: minShared,
        priority: 100
      };

      const commons = {
        name: 'commons',
        test: isModuleVendor,
        chunks: 'all',
        minChunks: minCommon,
        priority: 200
      };

      // Place React into commons.
      const react = {
        name: 'commons',
        test: testReact,
        enforce: true,
        chunks: 'all',
        priority: 1000
      };//testCoreJS

      // Place CoreJS into commons.
      const corejs = {
        name: 'commons',
        test: testCoreJS,
        enforce: true,
        chunks: 'all',
        priority: 1000
      };

      const cacheGroups = {
        default: false,
        vendors: false,
        appShared, pageShared,
        commons, react, corejs
      };

      splitChunks.maxInitialRequests = Infinity;
      splitChunks.maxAsyncRequests = Infinity;
      splitChunks.cacheGroups = cacheGroups;
    }

    return config;
  },

  async exportPathMap(defaultPathMap, {dir}) {
    return jumpLoader.derivePathMap(dir, this.pageExtensions);
  },

  pageExtensions: ['jsx', 'js']
};

function getPrefabs() {
  const plugins = {
    transformRuntime: [
      '@babel/plugin-transform-runtime',
      {
        corejs: { version: 3, proposals: true },
        helpers: true,
        regenerator: true,
      }
    ]
  };

  const presets = {
    env: [
      '@babel/preset-env', {
        include: ['transform-arrow-functions'],
        corejs: { version: 3, proposals: true },
        modules: 'auto'
      }
    ]
  };

  const use = {
    babelTransformRuntime: {
      loader: 'babel-loader',
      options: {
        configFile: false,
        plugins: [plugins.transformRuntime],
        presets: [presets.env]
      }
    },

    babelCommonJS: {
      loader: 'babel-loader',
      options: {
        overrides: [{
          plugins: ['add-module-exports'],
          presets: [['next/babel', {
            'preset-env': { modules: 'commonjs' }
          }]]
        }]
      }
    }
  };

  return { presets, plugins, use };
}

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