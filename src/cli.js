#!/usr/bin/env node
require('babel-polyfill')
const utils        = require('./utils')
const whichPackage = utils.preferLocalPackage(process.argv, __filename, process.cwd(), 'lanyon', 'lib/cli.js', require('../package.json').version)
const scrolex      = require('scrolex').persistOpts({
  announce             : true,
  addCommandAsComponent: true,
  components           : `lanyon>cli`,
})

if (require.main !== module) {
  scrolex.failure(`Please only used this module on the commandline: node src/cli.js`)
  process.exit(1)
}

require(`./boot`)(whichPackage)
