const path = require('path');
const glob = require('glob');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  webpack: (config, { dir, isServer, defaultLoaders }) => {

    config.resolve.alias['~'] = dir;
    config.resolve.alias['components'] = '~/components';
    config.resolve.alias['pages'] = '~/pages';
    config.resolve.alias['tools'] = '~/tools';
    config.resolve.alias['styles'] = '~/styles';

    config.resolveLoader.modules.unshift('webpack');

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
        use: ({ issuer }) => {
          return {
            loader: 'name-of-loader',
            rules: [defaultLoaders.babel],
            options: { issuer }
          };
        }
      },
      {
        enforce: 'post',
        resourceQuery: /^\?env$/,
        use: () => {
          return {
            loader: 'environment-loader',
            rules: [defaultLoaders.babel],
            options: { isServer, isProduction }
          };
        }
      }
    );

    if (!isServer) {
      const originalEntry = config.entry;
      config.entry = async () => {
        const entries = await originalEntry();

        if (entries['main.js'] && !entries['main.js'].includes('./patch/polyfills.js'))
          entries['main.js'].unshift('./patch/polyfills.js');

        return entries;
      };

      if (isProduction) {
        const plugins = config.plugins || [];
        plugins.push(new BundleAnalyzerPlugin());
        config.plugins = plugins;
      }
    }

    return config;
  },
  exportPathMap: () => {
    const articlesGlob = path.join(__dirname, 'pages/articles') + '/*.@(js|jsx)';
    return glob.sync(articlesGlob).reduce(
      (map, p) => {
        const ext = path.extname(p);
        const name = path.basename(p, ext);
        map[`/${name}`] = { page: '/', query: { page: name } };
        return map;
      },
      { '/': { page: '/' } }
    );
  },
  pageExtensions: ['jsx', 'js']
}