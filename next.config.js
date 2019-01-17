/* global module, __dirname */

const path = require('path');
const glob = require('glob');
const jsonImporter = require('node-sass-json-importer');
const toLower = require('lodash/toLower');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const DefinePlugin = require('webpack/lib/DefinePlugin');

const jsconfig = require('./jsconfig.json');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  webpack: (config, { dir, isServer, defaultLoaders }) => {

    // Resolver settings.
    mapAliases(jsconfig.compilerOptions.paths, config, dir);
    config.resolveLoader.modules.unshift('webpack');

    // Module rules.
    config.module.rules.push(
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
                .map((d) => path.join(dir, d))
                .map((g) => glob.sync(g))
                .reduce((a, c) => a.concat(c), [])
            }
          }
        ]
      },
      {
        test: /\.(gif|jpeg|jpg|png|svg)$/,
        use: [
          defaultLoaders.babel,
          'async-image-loader'
        ]
      },
      {
        enforce: 'post',
        resourceQuery: /^\?name(-of|Of)?$/,
        loader: 'name-of-loader'
      }
    );

    // Main.js patches.
    if (!isServer)
      patchMain(['./patch/client-polyfills.js', './patch/client-router.js'], config);

    // Webpack plugins.
    const plugins = config.plugins || [];

    plugins.push(new DefinePlugin({
      'process.module.name': DefinePlugin.runtimeValue(({ module }) => {
        if (!module) return undefined;
        if (!module.resource) return undefined;
        const ext = path.extname(module.resource);
        const name = path.basename(module.resource, ext);
        return JSON.stringify(name);
      })
    }));

    if (!isServer && isProduction) {
      plugins.push(new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: path.join(__dirname, './bundle-report.html'),
        openAnalyzer: false
      }));
    }

    config.plugins = plugins;
    return config;
  },
  exportPathMap: () => {
    const articlesGlob = path.join(__dirname, 'components/articles') + '/*.@(js|jsx)';
    return glob.sync(articlesGlob).reduce(
      (map, p) => {
        const ext = path.extname(p);
        const name = path.basename(p, ext);
        map[`/${toLower(name)}.html`] = { page: '/', query: { article: name } };
        return map;
      },
      { '/': { page: '/' } }
    );
  },
  pageExtensions: ['jsx', 'js']
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

function mapAliases(jsPaths, webkitConfig, dir) {
  const wkResolve = webkitConfig.resolve;
  for (const jsAlias of Object.keys(jsPaths)) {
    const jsTargets = jsPaths[jsAlias];
    if (jsTargets.length !== 1)
      throw new Error(`expected key \`${jsAlias}\` in \`paths\` entry of \`jsconfig.json\` to have 1 entry`);
    const [jsTarget] = jsTargets;
    const wkAlias = jsAlias.endsWith('/*') ? jsAlias.slice(0, -2) : jsAlias;
    const wkTarget = jsTarget.endsWith('/*') ? jsTarget.slice(0, -2) : jsTarget;
    wkResolve.alias[wkAlias] = path.join(dir, wkTarget);
  }
}