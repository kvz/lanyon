// https://github.com/petehunt/webpack-howto/blob/master/README.md#8-optimizing-common-code
// https://www.jonathan-petitcolas.com/2016/08/12/plugging-webpack-to-jekyll-powered-pages.html
// https://webpack.github.io/docs/configuration.html#resolve-alias
// https://github.com/HenrikJoreteg/hjs-webpack
var path = require('path')
var fs = require('fs')
var shell = require('shelljs')
var debug = require('depurar')('lanyon')
var _ = require('lodash')
var lanyonDir = __dirname
var projectDir = process.env.PROJECT_DIR || '../..'
var projectPackageFile = path.join(projectDir, '/package.json')
var projectPackage = require(projectPackageFile)
var lanyonPackage = require('./package.json')
var mergedCfg = _.defaults(projectPackage.lanyon || {}, lanyonPackage.lanyon)
var getConfig = require('hjs-webpack')
var buildDir = path.join(projectDir, 'assets', 'build')
debug({mergedCfg: mergedCfg})

RegExp.prototype.toJSON = RegExp.prototype.toString
Function.prototype.toJSON = Function.prototype.toString

shell.mkdir('-p', buildDir)

var config = getConfig({
  // entry point for the app
  // in: path.join(lanyonDir, 'app.js'),
  in: path.join(projectDir, 'assets', 'app.js'),

  // Name or full path of output directory
  // commonly named `www` or `public`. This
  // is where your fully static site should
  // end up for simple deployment.
  out: buildDir,

  // isDev: true,

  // This will destroy and re-create your
  // `out` folder before building so you always
  // get a fresh folder. Usually you want this
  // but since it's destructive we make it
  // false by default
  clearBeforeBuild: '!(images|favicon.ico)'
})

config.entry = {
  // Add entries for vendors
  // vendors: ['jquery'],
  // Reassign previous single entry to app entry
  app: config.entry,
  // ace: path.join(projectDir, 'assets', 'ace.js'),
  'worker-json': path.join(projectDir, 'assets', 'worker-json.js'),
  head: path.join(projectDir, 'assets', 'head.js'),
  crm: path.join(projectDir, 'assets', 'crm.js'),
  admin: path.join(projectDir, 'assets', 'admin.js')
}

config.output.filename = '[name].js'
config.output.cssFilename = '[name].css'
config.output.publicPath = '/assets/build'

// delete config.module.loaders[0].exclude
config.plugins[0].config.package = projectPackage

// config.module.loaders.push({ test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'url-loader?limit=10000&mimetype=application/font-woff' })
// config.module.loaders.push({ test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'file-loader' })

config.resolve.alias = {
  'AjaxLoader.gif': './assets/bower/owl-carousel/assets/img/AjaxLoader.gif',
  'grabbing.png': './assets/bower/owl-carousel/owl-carousel/grabbing.png'
}

// config.devServer.proxy = {
//   '/assets/bower/font-awesome-sass': {
//     target: 'http://localhost:' + mergedCfg.portContent + '',
//     secure: false
//   }
// }

config.resolveLoader = {
  root: [
    path.join(lanyonDir, 'node_modules'),
    path.join(projectDir, 'node_modules')
  ]
}

config.uglify = {
  compress: { warnings: false },
  output: { comments: true },
  sourceMap: false
}

if (config.devServer) {
  config.devServer.port = mergedCfg.portAssets
}

// console.log(config.module)
var json = JSON.stringify(config, null, '  ')
fs.writeFileSync('./fullthing.json', json, 'utf-8')
debug(config)

fs.writeFileSync('./_config.dev.yml', 'assets_base_url: "http://localhost:' + mergedCfg.portAssets + '/"', 'utf-8')

module.exports = config
