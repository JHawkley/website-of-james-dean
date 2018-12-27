const path = require('path');
const glob = require('glob');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const DefinePlugin = require('webpack/lib/DefinePlugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  webpack: (config, { dir, isServer, defaultLoaders }) => {

    // Resolver settings.
    config.resolve.alias['~'] = dir;
    config.resolve.alias['components'] = '~/components';
    config.resolve.alias['pages'] = '~/pages';
    config.resolve.alias['tools'] = '~/tools';
    config.resolve.alias['styles'] = '~/styles';

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
      'process.module.name': runtimeValue(({ module }) => {
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
    const articlesGlob = path.join(__dirname, 'pages/articles') + '/*.@(js|jsx)';
    return glob.sync(articlesGlob).reduce(
      (map, p) => {
        const ext = path.extname(p);
        const name = path.basename(p, ext);
        map[`/${name}.html`] = { page: '/', query: { page: name } };
        return map;
      },
      { '/': { page: '/' } }
    );
  },
  pageExtensions: ['jsx', 'js']
}

function patchMain(patches, config) {
  if (patches.length === 0) return;

  const originalEntry = config.entry;
  config.entry = async () => {
    const entries = await originalEntry();
    if (!entries['main.js']) return entries;

    for (const patch of patches)
      if (!entries['main.js'].includes(patch))
        entries['main.js'].unshift(patch);

    return entries;
  };
}

// Patch instances of `RuntimeValue` of `DefinePlugin` to work like later versions of Webpack.
function runtimeValue(fn, fileDependencies) {
  const instance = DefinePlugin.runtimeValue(fn, fileDependencies);
  instance.exec = function patched_exec(parser) {
		if (this.fileDependencies === true) {
			parser.state.module.buildInfo.cacheable = false;
		} else {
			for (const fileDependency of this.fileDependencies) {
				parser.state.module.buildInfo.fileDependencies.add(fileDependency);
			}
		}

		return this.fn({ module: parser.state.module });
  }
  return instance;
}