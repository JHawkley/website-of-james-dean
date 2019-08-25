/* global module, __dirname */

const ospath = require('path');
const glob = require('glob');
const jsonImporter = require('node-sass-json-importer');
const jumpLoader = require('./webpack/jump-loader');
const imageMediaLoader = require('./webpack/image-media-loader');
const soundMediaLoader = require('./webpack/sound-media-loader');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const DefinePlugin = require('webpack/lib/DefinePlugin');

const jsConfig = require('./jsconfig.json');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  webpack(config, { dir, isServer }) {

    /* == Resolver Settings == */
    // Map `.jsconfig.json` aliases.
    mapAliases(jsConfig.compilerOptions.paths, config, dir);

    // Add custom Webpack loaders to resolver.
    config.resolveLoader.modules.unshift('webpack');

    /* == Module Rules == */
    config.module.rules = [
      {
        test: /\.mjs$/i,
        include: /node_modules/,
        type: 'javascript/auto'
      },

      ...config.module.rules,

      {
        test: /\.(css|scss)$/,
        loader: 'emit-file-loader',
        options: {
          name: 'dist/[path][name].[ext]'
        }
      },

      {
        test: /\.css$/,
        use: ['babel-loader', 'raw-loader', 'postcss-loader']
      },

      {
        test: /\.s(a|c)ss$/,
        use: ['babel-loader', 'raw-loader', 'postcss-loader',
          { loader: 'sass-loader',
            options: {
              importer: jsonImporter(),
              outputStyle: 'compressed', // These options are from node-sass: https://github.com/sass/node-sass
              includePaths: ['styles', 'node_modules']
                .map((d) => ospath.join(dir, d))
                .map((g) => glob.sync(g))
                .reduce((a, c) => a.concat(c), [])
            }
          }
        ]
      },

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
    patchMain(['./patch/polyfills.js'], config);
    if (!isServer) patchMain(['./patch/client-router.js'], config);

    /* == Plugins == */
    const plugins = config.plugins || [];

    plugins.push(new DefinePlugin({
      'process.module.name': DefinePlugin.runtimeValue(({ module }) => {
        if (!module) return undefined;
        if (!module.resource) return undefined;
        const ext = ospath.extname(module.resource);
        const name = ospath.basename(module.resource, ext);
        return JSON.stringify(name);
      })
    }));

    if (!isServer && isProduction) {
      plugins.push(new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: ospath.join(__dirname, './bundle-report.html'),
        openAnalyzer: false
      }));
    }

    config.plugins = plugins;
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