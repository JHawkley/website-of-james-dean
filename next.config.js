const path = require('path');
const glob = require('glob');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  webpack: (config, { dir, isServer, defaultLoaders }) => {
    config.resolveLoader.modules.push(path.join(dir, "webpack"));
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
                .map((d) => path.join(__dirname, d))
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
    }

    return config;
  },
  exportPathMap: function(defaultPathMap) {
    return {
      '/': { page: '/' }
    };
  },
  pageExtensions: ['jsx', 'js'],
  publicRuntimeConfig: { isProduction }
}