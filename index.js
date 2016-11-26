// https://github.com/petehunt/webpack-howto/blob/master/README.md#8-optimizing-common-code
// https://www.jonathan-petitcolas.com/2016/08/12/plugging-webpack-to-jekyll-powered-pages.html
// https://webpack.github.io/docs/configuration.html#resolve-alias
// https://github.com/HenrikJoreteg/hjs-webpack
// http://webpack.github.io/docs/webpack-dev-middleware.html
// http://stackoverflow.com/a/28989476/151666
// https://github.com/webpack/webpack-dev-server/issues/97#issuecomment-70388180
// https://webpack.github.io/docs/hot-module-replacement.html
// https://github.com/css-modules/webpack-demo/issues/8#issuecomment-133922019
// https://github.com/gowravshekar/font-awesome-webpack

var _ = require('lodash')
var debug = require('depurar')('lanyon')
var path = require('path')
var fs = require('fs')
var shell = require('shelljs')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var webpack = require('webpack')
var webpackDevMiddleware = require('webpack-dev-middleware')
var webpackHotMiddleware = require('webpack-hot-middleware')
var BowerWebpackPlugin = require('bower-webpack-plugin')

var runtime = {}

runtime.lanyonDir = __dirname
runtime.binDir = path.join(runtime.lanyonDir, 'vendor', 'bin')
runtime.recordsPath = path.join(runtime.lanyonDir, 'records.json')
runtime.lanyonEnv = process.env.LANYON_ENV || 'development'
runtime.lanyonPackageFile = path.join(runtime.lanyonDir, 'package.json')
var lanyonPackage = require(runtime.lanyonPackageFile)

runtime.projectDir = process.env.LANYON_PROJECT || process.cwd()
// This is needed for docker, otherwise the cwd of /tmp/lanyon-1480075903N gets resolved to /private/tmp/lanyon-1480075903N later on
// and then the volumes can't be mapped. Readlink won't work on nested symlinks
runtime.projectDir = shell.exec('cd "' + runtime.projectDir + '" && echo $(pwd)').stdout.trim()

runtime.cacheDir = path.join(runtime.projectDir, '.lanyon')
runtime.projectPackageFile = path.join(runtime.projectDir, 'package.json')
try {
  var projectPackage = require(runtime.projectPackageFile)
} catch (e) {
  projectPackage = {}
}

runtime = _.defaults(projectPackage.lanyon || {}, lanyonPackage.lanyon, runtime)

runtime.assetsSourceDir = path.join(runtime.projectDir, 'assets')
runtime.assetsBuildDir = path.join(runtime.assetsSourceDir, 'build')
runtime.contentBuildDir = path.join(runtime.projectDir, '_site')

runtime.publicPath = '/assets/build/'

function isDev () {
  return runtime.lanyonEnv === 'development'
}
function isHotLoading () {
  return (isDev() && ['serve', 'start'].indexOf(process.argv[2]) !== -1)
}

var cfg = {
  webpack: {
    entry: (function entries () {
      var entries = {}
      runtime.entries.forEach(function (entry) {
        entries[entry] = [ path.join(runtime.assetsSourceDir, entry + '.js') ]

        if (entry === 'app' && isDev()) {
          entries[entry].unshift('webpack-hot-middleware/client')
        }
      })

      return entries
    }()),
    output: {
      publicPath: runtime.publicPath,
      path: runtime.assetsBuildDir,
      filename: '[name].js',
      cssFilename: '[name].css'
    },
    devtool: 'eval-cheap-source-map',
    // devtool: 'source-map',
    module: {
      loaders: (function plugins () {
        var loaders = [
          {
            test: /\.css$/,
            loader: 'style!css?sourceMap'
          }, {
            test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
            loader: 'url?limit=10000&mimetype=application/font-woff'
          }, {
            test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
            loader: 'url?limit=10000&mimetype=application/font-woff'
          }, {
            test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
            loader: 'url?limit=10000&mimetype=application/octet-stream'
          }, {
            test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
            loader: 'file'
          }, {
            test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
            loader: 'url?limit=10000&mimetype=image/svg+xml'
          },
          {
            test: /\.js$/,
            loaders: [ 'jsx', 'babel' ],
            exclude: /(node_modules|bower_components|vendor)/
          },
          {
            test: /\.(png|gif|jpe?g)$/,
            loader: 'url-loader?limit=8096',
            exclude: /(node_modules|bower_components|vendor)/
          },
          {
            // https://github.com/webpack/webpack/issues/512
            test: /[\\/](bower_components)[\\/]modernizr[\\/]modernizr\.js$/,
            loader: 'imports?this=>window!exports?window.Modernizr'
          },
          {
            test: /[\\/](bower_components)[\\/]svgeezy[\\/]svgeezy\.js$/,
            loader: 'imports?this=>window!exports?window.svgeezy'
          }
        ]

        if (isDev()) {
          loaders.push({
            test: /\.scss$/,
            loader: 'style!css?sourceMap!sass?sourceMap&sourceComments',
            exclude: /(node_modules|bower_components|vendor)/
          })
        } else {
          loaders.push({
            test: /\.scss$/,
            loader: ExtractTextPlugin.extract('css!sass'),
            exclude: /(node_modules|bower_components|vendor)/
          })
        }

        return loaders
      }())
    },
    plugins: (function plugins () {
      var plugins = [
        new BowerWebpackPlugin(),
        new webpack.ProvidePlugin({
          $: 'jquery',
          jQuery: 'jquery'
        })
      ]

      if (isDev()) {
        plugins.push(new webpack.HotModuleReplacementPlugin())
      } else {
        plugins.push(new ExtractTextPlugin('[name].css', {
          allChunks: true
        }))
      }

      return plugins
    }()),
    resolveLoader: {
      root: [
        path.join(runtime.lanyonDir, 'node_modules'),
        path.join(runtime.projectDir, 'node_modules')
      ]
    },
    recordsPath: runtime.recordsPath,
    resolve: {
      root: [
        path.resolve(runtime.assetsSourceDir),
        path.resolve(runtime.assetsSourceDir) + '/bower_components',
        path.resolve(runtime.projectDir) + '/node_modules',
        path.resolve(runtime.lanyonDir) + '/node_modules'
      ]
    },
    uglify: {
      compress: {
        warnings: false
      },
      output: {
        comments: true
      },
      sourceMap: false
    }
  }
}

if (isHotLoading()) {
  var bundler = webpack(cfg.webpack)
}

cfg.browsersync = {
  server: {
    port: runtime.ports.content,
    baseDir: runtime.contentBuildDir,

    middleware: (function middlewares () {
      var middlewares = []

      if (isHotLoading()) {
        middlewares.push(webpackDevMiddleware(bundler, {
          publicPath: runtime.publicPath,
          hot: true,
          inline: true,
          stats: { colors: true }
        }))
        middlewares.push(webpackHotMiddleware(bundler))
      }

      if (!middlewares.length) {
        return false
      }
      return middlewares
    }())
  },
  'watchOptions': {
    // 'ignoreInitial': true,
    'ignored': [
      '.git',
      'assets/build'
    ]
  },
  'reloadDelay': 200,

  // no need to watch '*.js' here, webpack will take care of it for us,
  // including full page reloads if HMR won't work
  files: [
    '**/*.css',
    '**/*.html',
    '*.css',
    '*.html'
  ]
}

cfg.nodemon = {
  onChangeOnly: true,
  verbose: false,
  watch: runtime.projectDir,
  ignore: [
    'assets/*',
    'vendor/**',
    'node_modules/*',
    '_site/*'
  ],
  ext: 'md,html,yml,json,sh'
}

cfg.runtime = runtime

module.exports = cfg
