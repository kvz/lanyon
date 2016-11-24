// https://github.com/petehunt/webpack-howto/blob/master/README.md#8-optimizing-common-code
// https://www.jonathan-petitcolas.com/2016/08/12/plugging-webpack-to-jekyll-powered-pages.html
// https://webpack.github.io/docs/configuration.html#resolve-alias
// https://github.com/HenrikJoreteg/hjs-webpack
var _ = require('lodash')
var debug = require('depurar')('lanyon')
var fs = require('fs')
var path = require('path')
var rimraf = require('rimraf')
var shell = require('shelljs')
var ExtractTextPlugin = require('extract-text-webpack-plugin')

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
  runtime.publicPath = 'http://localhost:' + runtime.ports.assets + '/'
  fs.writeFileSync('./_config.dev.yml', 'assets_base_url: "http://localhost:' + runtime.ports.assets + '/"', 'utf-8')
}

shell.mkdir('-p', runtime.assetsBuildDir)
rimraf.sync(runtime.assetsBuildDir + '/' + '!(images|favicon.ico)')
debug(runtime)

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

var fullconfig = {
  webpack: {
    entry: getEntries(),
    output: {
      publicPath: runtime.publicPath,
      filename: runtime.assetsBuildDir + '/[name].js',
      cssFilename: runtime.assetsBuildDir + '/[name].css'
    },
    'devtool': 'cheap-module-eval-source-map',
    'devServer': {
      'noInfo': true,
      'quiet': false,
      'lazy': false,
      'publicPath': runtime.publicPath,
      'historyApiFallback': true,
      'hot': true,
      'contentBase': runtime.assetsBuildDir,
      'port': runtime.ports.assets,
      'https': false,
      'hostname': 'localhost'
    },
    module: {
      loaders: [
        { test: /\.(png|jpg|gif|jpeg)$/, loader: 'url-loader?limit=8192' },
        {
          test: /\.js$/,
          loaders: [
            'jsx', 'babel'
          ],
          exclude: /node_modules/
        }, {
          test: /\.scss$/,
          loader: ExtractTextPlugin.extract('css!sass')
        }
      ]
    },
    plugins: [
      new ExtractTextPlugin(runtime.assetsBuildDir + '/[name].css', {
        allChunks: true
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
      // alias: {
      //   'AjaxLoader.gif$': path.resolve(runtime.assetsSourceDir, 'bower/owl-carousel/assets/img/AjaxLoader.gif'),
      //   'grabbing.png$': path.resolve(runtime.assetsSourceDir, 'bower/owl-carousel/owl-carousel/grabbing.png')
      // },
      // extensions: ['', '.gif', '.png']
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
  },
  runtime: runtime,
  browsersync: {
    'port': runtime.ports.content,
    'proxy': 'http://localhost:' + runtime.ports.assets,
    'serveStatic': [ runtime.contentBuildDir ],
    'watchOptions': {
      'ignoreInitial': true,
      'ignored': [
        '.git'
      ]
    },
    'files': [
      runtime.contentBuildDir
    ],
    'reloadDelay': 200
  }
}

// console.log(config.module)
var json = JSON.stringify(fullconfig, null, '  ')
fs.writeFileSync('./fullthing.json', json, 'utf-8')
debug(fullconfig)

module.exports = fullconfig
