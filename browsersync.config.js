var _ = require('lodash')
var path = require('path')
var fs = require('fs')
var debug = require('depurar')('lanyon')
// var lanyonDir = __dirname
var projectDir = process.env.PROJECT_DIR || '../..'
var projectPackageFile = path.join(projectDir, '/package.json')
var projectPackage = require(projectPackageFile)
var lanyonPackage = require('./package.json')
var mergedCfg = _.defaults(projectPackage.lanyon || {}, lanyonPackage.lanyon)
debug({mergedCfg: mergedCfg})

fs.writeFileSync('./_config.dev.yml', 'assets_base_url: "http://localhost:' + mergedCfg.ports.assets + '/"', 'utf-8')

module.exports = {
  'port': mergedCfg.ports.content,
  'proxy': 'http://localhost:' + mergedCfg.ports.assets,
  'serveStatic': [ projectDir + '/_site' ],
  'watchOptions': {
    'ignoreInitial': true,
    'ignored': [
      '.git'
    ]
  },
  'files': [
    projectDir + '/_site'
  ],
  'reloadDelay': 200
}
