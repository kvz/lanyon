#!/usr/bin/env node
// const utils        = require('./utils')
const scrolex = require('scrolex').persistOpts({
  announce             : true,
  addCommandAsComponent: true,
  components           : `lanyon>cli`,
  mode                 : 'passthru',
})

if (require.main !== module) {
  scrolex.failure(`Please only used this module on the commandline: node src/cli.js`)
  process.exit(1)
}

async function cli () {
  try {
    await require(`./dispatch`)()
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}
cli()
