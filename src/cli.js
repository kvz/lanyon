require('babel-polyfill')
const scrolex = require('scrolex').persistOpts({
  announce             : true,
  addCommandAsComponent: true,
  components           : `lanyon>cli`,
})

if (require.main !== module) {
  scrolex.failure(`Please only used this module on the commandline: node src/cli.js`)
  process.exit(1)
}

require('./boot')()
