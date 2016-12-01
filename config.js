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
var path = require('path')
var utils = require('./utils')
var fs = require('fs')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var webpack = require('webpack')
var webpackDevMiddleware = require('webpack-dev-middleware')
var webpackHotMiddleware = require('webpack-hot-middleware')
var BowerWebpackPlugin = require('bower-webpack-plugin')

var runtime = {}

runtime.lanyonDir = __dirname
runtime.lanyonEnv = process.env.LANYON_ENV || 'development'
runtime.lanyonPackageFile = path.join(runtime.lanyonDir, 'package.json')
var lanyonPackage = require(runtime.lanyonPackageFile)
runtime.lanyonVersion = lanyonPackage.version

runtime.trace = process.env.LANYON_TRACE === '1'
runtime.publicPath = '/assets/build/'

runtime.rubyProvidersOnly = (process.env.LANYON_ONLY || '')
runtime.rubyProvidersSkip = (process.env.LANYON_SKIP || '').split(/\s+/)

runtime.lanyonReset = process.env.LANYON_RESET === '1'
runtime.onTravis = process.env.TRAVIS === 'true'
runtime.ghPagesEnv = {
  GHPAGES_URL: process.env.GHPAGES_URL,
  GHPAGES_BOTNAME: process.env.GHPAGES_BOTNAME,
  GHPAGES_BOTEMAIL: process.env.GHPAGES_BOTEMAIL
}
runtime.isDev = runtime.lanyonEnv === 'development'
runtime.isHotLoading = runtime.isDev && ['serve', 'start'].indexOf(process.argv[2]) !== -1

runtime.projectDir = process.env.LANYON_PROJECT || process.env.PWD || process.cwd() // <-- symlinked npm will mess up process.cwd() and point to ~/code/lanyon

runtime.npmRoot = utils.upwardDirContaining('package.json', runtime.projectDir, 'lanyon')
if (!runtime.npmRoot) {
  throw new Error('Unable to determine non-lanyon npmRoot')
}
runtime.gitRoot = utils.upwardDirContaining('.git', runtime.npmRoot)

runtime.projectPackageFile = path.join(runtime.npmRoot, 'package.json')
try {
  var projectPackage = require(runtime.projectPackageFile)
} catch (e) {
  projectPackage = {}
}

runtime.gems = _.defaults(_.get(projectPackage, 'lanyon.gems') || {}, _.get(lanyonPackage, 'lanyon.gems'))
runtime = _.defaults(projectPackage.lanyon || {}, lanyonPackage.lanyon, runtime)

try {
  runtime.projectDir = fs.realpathSync(runtime.projectDir)
} catch (e) {
  runtime.projectDir = fs.realpathSync(runtime.gitRoot + '/' + runtime.projectDir)
}

runtime.cacheDir = path.join(runtime.projectDir, '.lanyon')
runtime.binDir = path.join(runtime.cacheDir, 'bin')
runtime.recordsPath = path.join(runtime.cacheDir, 'records.json')
runtime.assetsSourceDir = path.join(runtime.projectDir, 'assets')
runtime.assetsBuildDir = path.join(runtime.assetsSourceDir, 'build')
runtime.contentBuildDir = path.join(runtime.projectDir, '_site')

// Set prerequisite defaults
for (var name in runtime.prerequisites) {
  if (!runtime.prerequisites[name].exeSuffix) {
    runtime.prerequisites[name].exeSuffix = ''
  }
  if (!runtime.prerequisites[name].exe) {
    runtime.prerequisites[name].exe = name
  }
  if (!runtime.prerequisites[name].versionCheck) {
    runtime.prerequisites[name].versionCheck = runtime.prerequisites[name].exe + ' -v'
  }
}

// Determine rubyProvider sources to traverse
var allApps = [ 'system', 'docker', 'rbenv', 'rvm', 'ruby-shim' ]
if (runtime.rubyProvidersOnly === 'auto-all') {
  runtime.rubyProvidersOnly = ''
}

if (runtime.rubyProvidersOnly) {
  runtime.rubyProvidersSkip = []
  allApps.forEach(function (app) {
    if (app !== runtime.rubyProvidersOnly) {
      runtime.rubyProvidersSkip.push(app)
    }
  })
}

var cfg = {
  webpack: {
    entry: (function entries () {
      var entries = {}
      runtime.entries.forEach(function (entry) {
        entries[entry] = [ path.join(runtime.assetsSourceDir, entry + '.js') ]

        if (entry === 'app' && runtime.isDev) {
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
            test: /\.cur(\?v=\d+\.\d+\.\d+)?$/,
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
            test: /\.coffee$$/,
            loader: 'coffee-loader',
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

        if (runtime.isDev) {
          loaders.push({
            test: /\.scss$/,
            loader: 'style!css?sourceMap!sass?sourceMap&sourceComments',
            exclude: /(node_modules|bower_components|vendor)/
          })
          loaders.push({
            test: /\.less$/,
            loader: 'style-loader!css-loader!less-loader',
            exclude: /(node_modules|bower_components|vendor)/
          })
        } else {
          loaders.push({
            test: /\.scss$/,
            loader: ExtractTextPlugin.extract('css!sass'),
            exclude: /(node_modules|bower_components|vendor)/
          })
          loaders.push({
            test: /\.less/,
            loader: ExtractTextPlugin.extract('css-loader?sourceMap!less-loader?sourceMap'),
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

      if (runtime.isDev) {
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

if (runtime.isHotLoading) {
  var bundler = webpack(cfg.webpack)
}

cfg.browsersync = {
  server: {
    port: runtime.ports.content,
    baseDir: runtime.contentBuildDir,
    middleware: (function middlewares () {
      var middlewares = []

      if (runtime.isHotLoading) {
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
  watchOptions: {
    ignoreInitial: true,
    ignored: [
      // no need to watch '*.js' here, webpack will take care of it for us,
      // including full page reloads if HMR won't work
      '*.js',
      '.git',
      'assets/build',
      '.lanyon'
    ]
  },
  reloadDelay: 200,
  files: runtime.contentBuildDir
}

cfg.jekyll = {
  exclude: [
    'node_modules',
    'env.sh',
    'env.*.sh',
    '.env.sh',
    '.env.*.sh',
    '.lanyon'
  ]
}

cfg.nodemon = {
  onChangeOnly: true,
  verbose: false,
  watch: runtime.projectDir,
  ignore: [
    '.lanyon/*',
    'env.sh',
    'env.*.sh',
    '.env.sh',
    '.env.*.sh',
    'assets/*',
    'vendor/**',
    'node_modules/*',
    '_site/*'
  ],
  ext: [
    'htm',
    'html',
    'jpg',
    'json',
    'md',
    'png',
    'sh',
    'yml'
  ].join(',')
}

cfg.runtime = runtime

module.exports = cfg
