// https://github.com/petehunt/webpack-howto/blob/master/README.md#8-optimizing-common-code
// module.exports = {
//   entry: {
//     main: './main.js'
//   },
//   output: {
//     path: (process.env.PROJECT_DIR || '../..') + '/_site/assets/',
//     filename: '[file].js',
//     publicPath: '/assets/'
//   },
//   module: {
//     loaders: [
//       {
//         test: /\.coffee$/,
//         loader: 'coffee-loader'
//       },
//       {
//         test: /\.js$/,
//         loader: 'babel-loader',
//         query: {
//           presets: ['es2015', 'react']
//         }
//       }
//     ]
//   },
//   resolve: {
//     // you can now require('file') instead of require('file.coffee')
//     extensions: ['', '.js', '.json', '.coffee']
//   }
// }

// https://github.com/HenrikJoreteg/hjs-webpack
var path = require('path')
var fs = require('fs')
var parentDir = process.env.PROJECT_DIR || '../..'
var parentPackageFile = path.join(parentDir, '/package.json')
var parentPackage = require(parentPackageFile)
var getConfig = require('hjs-webpack')
var config = getConfig({
  // entry point for the app
  // in: path.join(__dirname, 'app.js'),
  in: path.join(parentDir, 'src', 'app.js'),

  // Name or full path of output directory
  // commonly named `www` or `public`. This
  // is where your fully static site should
  // end up for simple deployment.
  out: path.join(parentDir, 'assets'),

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
  // Reassign previous single entry to main entry
  main: config.entry
}

// delete config.module.loaders[0].exclude
config.plugins[0].config.package = parentPackage

config.resolveLoader = {
  root: [
    path.join(__dirname, 'node_modules'),
    path.join(parentDir, 'node_modules')
  ]
}

// console.log(config.module)
var json = JSON.stringify(config, null, '  ')
fs.writeFileSync('./fullthing.json', json, 'utf-8')
console.log(json)

module.exports = config
