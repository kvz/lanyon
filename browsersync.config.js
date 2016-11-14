var _ = require('lodash')
var path = require('path')
var debug = require('depurar')('lanyon')
// var lanyonDir = __dirname
var projectDir = process.env.PROJECT_DIR || '../..'
var projectPackageFile = path.join(projectDir, '/package.json')
var projectPackage = require(projectPackageFile)
var lanyonPackage = require('./package.json')
var mergedCfg = _.defaults(projectPackage.lanyon || {}, lanyonPackage.lanyon)
debug({mergedCfg: mergedCfg})

module.exports = {
  'port': mergedCfg.portContent,
  'proxy': 'http://localhost:' + mergedCfg.portAssets,
  'serveStatic': [ projectDir + '/_site' ],
  'files': [
    '.'
  ],
  'reloadDelay': 200
}
