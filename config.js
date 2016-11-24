// https://github.com/petehunt/webpack-howto/blob/master/README.md#8-optimizing-common-code
// https://www.jonathan-petitcolas.com/2016/08/12/plugging-webpack-to-jekyll-powered-pages.html
// https://webpack.github.io/docs/configuration.html#resolve-alias
// https://github.com/HenrikJoreteg/hjs-webpack
// http://webpack.github.io/docs/webpack-dev-middleware.html
// http://stackoverflow.com/a/28989476/151666
var _ = require('lodash')
var debug = require('depurar')('lanyon')
var fs = require('fs')
var path = require('path')
var rimraf = require('rimraf')
var shell = require('shelljs')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var webpack = require('webpack')
var webpackDevMiddleware = require('webpack-dev-middleware')
var webpackHotMiddleware = require('webpack-hot-middleware')

var runtime = {}

runtime.lanyonDir = __dirname
runtime.binDir = path.join(runtime.lanyonDir, 'vendor', 'bin')
runtime.lanyonEnv = process.env.LANYON_ENV || 'development'
runtime.lanyonPackageFile = path.join(runtime.lanyonDir, 'package.json')
var lanyonPackage = require(runtime.lanyonPackageFile)

runtime.projectDir = process.env.LANYON_PROJECT || '../..'
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
fs.writeFileSync('./_config.dev.yml', '', 'utf-8')
if (runtime.lanyonEnv === 'development') {
  // runtime.publicPath = 'http://localhost:' + runtime.ports.assets + '/'
  // fs.writeFileSync('./_config.dev.yml', 'assets_base_url: "http://localhost:' + runtime.ports.assets + '/"', 'utf-8')
}

function getEntries () {
  var sources = {}
  runtime.entries.forEach(function (entry) {
    sources[entry] = [ path.join(runtime.assetsSourceDir, entry + '.js') ]
    if (runtime.lanyonEnv === 'development') {
      // source[entry].push('webpack-dev-server/client?http://localhost:8080')
      sources[entry].push('webpack/hot/only-dev-server')
    }
  })

  return sources
}

var cfg = {
  webpack: {
    entry: getEntries(),
    output: {
      publicPath: runtime.publicPath,
      path: runtime.assetsBuildDir,
      filename: '[name].js',
      cssFilename: '[name].css'
    },
    'devtool': 'eval-cheap-source-map',
    module: {
      loaders: [
        {
          test: /\.js$/,
          loaders: [ 'jsx', 'babel' ],
          exclude: /(node_modules|bower_components|bower|vendor)/
        }, {
          test: /\.scss$/,
          loader: ExtractTextPlugin.extract('css!sass'),
          exclude: /(node_modules|bower_components|bower|vendor)/
        },
        {
          test: /\.(png|gif|jpe?g)$/,
          loader: 'url-loader?limit=8096',
          exclude: /(node_modules|bower_components|bower|vendor)/
        },
        {
          // https://github.com/webpack/webpack/issues/512
          test: /[\\/](bower_components|bower)[\\/]modernizr[\\/]modernizr\.js$/,
          loader: 'imports?this=>window!exports?window.Modernizr'
        }
      ]
    },
    plugins: [
      new ExtractTextPlugin(runtime.assetsBuildDir + '/[name].css', {
        allChunks: true
      }),
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery'
      })
    ],
    resolveLoader: {
      root: [
        path.join(runtime.lanyonDir, 'node_modules'),
        path.join(runtime.projectDir, 'node_modules')
      ]
    },
    resolve: {
      root: path.resolve(runtime.assetsSourceDir)
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

if (!/postinstall\.js$/.test(process.argv[1])) {
  shell.mkdir('-p', runtime.assetsBuildDir)
  // rimraf.sync(runtime.assetsBuildDir + '/' + '!(images|favicon.ico)')
  debug(runtime)

  var bundler = webpack(cfg.webpack)

  cfg.browsersync = {
    server: {
      'port': runtime.ports.content,
      baseDir: runtime.contentBuildDir,

      middleware: [
        webpackDevMiddleware(bundler, {
          publicPath: runtime.publicPath,
          // 'devServer': {
          //   'contentBase': runtime.projectDir,
          //   'hostname': 'localhost',
          //   'debug': true,
          //   'colors': true,
          'hot': true,
          //   'https': false,
          'inline': true,
          //   'port': runtime.ports.assets,
          //   'clientLogLevel': 'info',
          //   'publicPath': runtime.publicPath
          // },
          stats: { colors: true }
        }),

        // bundler should be the same as above
        webpackHotMiddleware(bundler)
      ]
    },
    'watchOptions': {
      'ignoreInitial': true,
      'ignored': [
        '.git',
        'assets/build'
      ]
    },
    'reloadDelay': 200,

    // no need to watch '*.js' here, webpack will take care of it for us,
    // including full page reloads if HMR won't work
    files: [
      '**.css',
      '**.html'
    ]
  }
}

cfg.runtime = runtime

// console.log(config.module)
var json = JSON.stringify(cfg, null, '  ')
fs.writeFileSync('./fullthing.json', json, 'utf-8')
debug(cfg)

module.exports = cfg
