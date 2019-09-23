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
    // Map `jsconfig.json` aliases.
    mapAliases(jsConfig.compilerOptions.paths, config, dir);

    // Force modules to use CoreJS 3.
    // Also map various similar modules to reduce package size.
    config.resolve.alias = Object.assign(config.resolve.alias, {
      '@babel/runtime-corejs2': '@babel/runtime-corejs3',
      'object-assign': 'core-js-pure/stable/object/assign.js',
      'querystring': 'querystring-es3'
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
        // Fix for missing polyfills in `node_modules`.
        // Without this, IE11 cannot be supported.
        test: /\.(mjs|es\.js)$/i,
        include: /node_modules/,
        use: [prefabs.use.transformForESM]
      },

      ...config.module.rules,

      cssRule('normal-css', {
        test: /\.(css|scss|sass)$/i,
        rules: [{
          test: /\.sass|scss$/i,
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
        use: [prefabs.use.transformForESM, 'image-media-loader']
      },

      {
        test: new RegExp(`\\.(${soundMediaLoader.supportedTypes.join('|')})$`, 'i'),
        use: [prefabs.use.transformForESM, 'sound-media-loader']
      },

      {
        resourceQuery: /(\?|&)jump(&|$)/,
        loader: 'jump-loader',
        options: { extensions: this.pageExtensions }
      }
    ].filter(Boolean);

    /* == Patches == */
    patchMain(config, [
      './patch/font-awesome.js',
      !isServer && './patch/client-router.js'
    ].filter(Boolean));

    /* == Plugins == */
    config.plugins = [
      isProduction && !isServer && new ShakePlugin(),

      isProduction && !isServer && new WebpackDeepScopeAnalysisPlugin(),

      ...config.plugins,

      !isProduction && new WebpackBarPlugin({
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
            matchExclude('**/node_modules/next?(-server)/**'),
            matchExclude('**/node_modules/@babel/runtime-corejs3/**'),
            matchExclude('**/node_modules/core-js?(-pure)/**')
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

    if (isProduction) {
      // Disable the `parallel` options for the Terser plugin.
      // This option seems to have a lot of instability associated with it.
      const { TerserPlugin } = require('next/dist/build/webpack/plugins/terser-webpack-plugin/src/index');
      for (const minimizer of config.optimization.minimizer)
        if (minimizer instanceof TerserPlugin)
          minimizer.options.parallel = false;
    }

    if (isProduction && !isServer) {
      // Customize chunk splitting.
      const splitChunks = config.optimization.splitChunks;

      const matcherNodeModules = matchString('**/node_modules/**');
      const reNameData = /(?:\\|\/)(pages|runtime)(?:\\|\/)(.*)\.js/;

      const isAppEntry = (nameData) => {
        if (!nameData) return false;
        if (nameData.dir !== 'pages') return true;
        if (nameData.name === '_app') return true;
        return false;
      };

      const isPageEntry = (nameData) =>
        Boolean(nameData && !isAppEntry(nameData));

      const getPageEntries = (nameData) =>
        nameData.filter(isPageEntry);

      const isModuleVendor = ({context}) =>
        matcherNodeModules(context);

      const getNameData = ({name}) => {
        if (!name) return null;

        const nameData = reNameData.exec(name);
        if (!nameData) return null;

        const baseName = ospath.basename(nameData[2]);
        return { dir: nameData[1], name: nameData[2], baseName };
      };

      const dedupeNameData = (nameDataArr) => {
        const namesSet = new Set();

        for (const data of nameDataArr) {
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
        test: matchModule('**/node_modules/(react|react-dom)/**'),
        enforce: true,
        chunks: 'all',
        priority: 1000
      };

      const cacheGroups = {
        default: false,
        vendors: false,
        appShared, pageShared,
        commons, react
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

// Makes matchers for basic strings.
function matchString(pattern) {
  const matcher = typeof pattern === 'function' ? pattern : mm.matcher(pattern);
  return (s) => typeof s === 'string' && matcher(s);
}

// Makes matchers for module objects.
function matchModule(pattern) {
  const matcher = typeof pattern === 'function' ? pattern : matchString(pattern);
  return (module) => Boolean(module && module.resource && matcher(module.resource));
}

// Makes matchers for stats exclusions.
function matchExclude(pattern) {
  const matcher = typeof pattern === 'function' ? pattern : matchModule(pattern);
  return (id, module) => matcher(module);
}

// Creates various prefabs for Webpack rules.
function getPrefabs() {
  const absoluteRuntime = ospath.resolve(__dirname, './node_modules/@babel/runtime-corejs3');

  const plugins = {
    transformRuntime: [
      '@babel/plugin-transform-runtime',
      {
        corejs: { version: 3, proposals: true },
        helpers: true,
        regenerator: true,
        absoluteRuntime
      }
    ]
  };

  const presets = {
    env: [
      '@babel/preset-env', {
        include: ['transform-arrow-functions'],
        modules: 'auto'
      }
    ]
  };

  const use = {
    transformForESM: {
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

// Patches the main chunk, adding specific modules.
function patchMain(webkitConfig, patches) {
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

// A helper for creating CSS-related rules.
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

// Maps module aliases defined in `jsconfig.json` into Webpack.
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