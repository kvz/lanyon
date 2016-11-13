// https://github.com/petehunt/webpack-howto/blob/master/README.md#8-optimizing-common-code
// https://www.jonathan-petitcolas.com/2016/08/12/plugging-webpack-to-jekyll-powered-pages.html
// https://webpack.github.io/docs/configuration.html#resolve-alias
// https://github.com/HenrikJoreteg/hjs-webpack

var path = require('path')
var fs = require('fs')
var shell = require('shelljs')
var parentDir = process.env.PROJECT_DIR || '../..'
var parentPackageFile = path.join(parentDir, '/package.json')
var parentPackage = require(parentPackageFile)
var getConfig = require('hjs-webpack')
var buildDir = path.join(parentDir, 'assets', 'build')

shell.mkdir('-p', buildDir)

var config = getConfig({
  // entry point for the app
  // in: path.join(__dirname, 'app.js'),
  in: path.join(parentDir, 'assets', 'app.js'),

  // Name or full path of output directory
  // commonly named `www` or `public`. This
  // is where your fully static site should
  // end up for simple deployment.
  out: buildDir,

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
  // ace: path.join(parentDir, 'assets', 'ace.js'),
  'worker-json': path.join(parentDir, 'assets', 'worker-json.js'),
  head: path.join(parentDir, 'assets', 'head.js'),
  crm: path.join(parentDir, 'assets', 'crm.js'),
  admin: path.join(parentDir, 'assets', 'admin.js')
}

// delete config.module.loaders[0].exclude
config.plugins[0].config.package = parentPackage

config.module.loaders.push({ test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'url-loader?limit=10000&mimetype=application/font-woff' })
config.module.loaders.push({ test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'file-loader' })

config.resolve.alias = {
  'AjaxLoader.gif': './assets/bower/owl-carousel/assets/img/AjaxLoader.gif',
  'grabbing.png': './assets/bower/owl-carousel/owl-carousel/grabbing.png'
}

config.devServer.headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
}

config.devServer.proxy = {
  '/assets/bower/font-awesome-sass': {
    target: 'http://localhost:3001',
    secure: false
  }
}

config.resolveLoader = {
  root: [
    path.join(__dirname, 'node_modules'),
    path.join(parentDir, 'node_modules')
  ]
}

config.uglify = {
  compress: { warnings: false },
  output: { comments: true },
  sourceMap: false
}

config.devServer.port = 3000

// console.log(config.module)
var json = JSON.stringify(config, null, '  ')
fs.writeFileSync('./fullthing.json', json, 'utf-8')
console.log(json)

fs.writeFileSync('./_config.dev.yml', 'assets_base_url: "http://localhost:' + config.devServer.port + '/"', 'utf-8')

module.exports = config
