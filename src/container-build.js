const path        = require('path')
const utils       = require('./utils')
const os          = require('os')
const shell       = require('shelljs')
const fs          = require('fs')
// var debug      = require('depurar')('lanyon')
const _           = require('lodash')
const oneLine     = require('common-tags/lib/oneLine')
// const stripIndent = require('common-tags/lib/stripIndent')
const scrolex     = require('scrolex').persistOpts({
  announce             : true,
  addCommandAsComponent: true,
  components           : `lanyon>install`,
})

if (require.main === module) {
  scrolex.failure(`Please only used this module via require, or: src/cli.js ${process.argv[1]}`)
  process.exit(1)
}

module.exports = async (runtime, cb) => {
  try {
    // Set prerequisite defaults
    let deps = _.cloneDeep(runtime.prerequisites)
    for (const name in deps) {
      if (!deps[name].exeSuffix) {
        deps[name].exeSuffix = ''
      }
      if (!deps[name].exe) {
        deps[name].exe = name
      }
      if (!deps[name].versionCheck) {
        deps[name].versionCheck = `${deps[name].exe} -v`
      }
    }

    let envPrefix    = ''

    if (runtime.lanyonReset) {
      scrolex.stick('Removing existing shims')
      await scrolex.exe(`rm -f ${runtime.binDir}/*`)
    }

    if (!utils.satisfied(runtime, 'node')) {
      scrolex.failure('No satisfying node found')
      process.exit(1)
    }
    if (!utils.satisfied(runtime, 'docker')) {
      scrolex.failure('No satisfying docker found')
      process.exit(1)
    }

    const cache = process.env.DOCKER_RESET === '1' ? ' --no-cache' : ''
    await scrolex.exe(`cd "${runtime.cacheDir}" && docker build${cache} -t kevinvz/lanyon:${runtime.lanyonVersion} .`)
    await scrolex.exe(`cd "${runtime.cacheDir}" && docker push kevinvz/lanyon:${runtime.lanyonVersion}`)

    cb(null)
  } catch (e) {
    cb(e)
  }
}
