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

  if (process.env.DOCKER_BUILD === '1') {
    const cache = process.env.DOCKER_RESET === '1' ? ' --no-cache' : ''
    await scrolex.exe(`cd "${runtime.cacheDir}" && docker build${cache} -t kevinvz/lanyon:${runtime.lanyonVersion} .`)
    await scrolex.exe(`cd "${runtime.cacheDir}" && docker push kevinvz/lanyon:${runtime.lanyonVersion}`)
  }
  deps.sh.exe = utils.dockerCmd(runtime, 'sh', '--interactive --tty')
  deps.ruby.exe = utils.dockerCmd(runtime, 'ruby')
  deps.ruby.versionCheck = utils.dockerCmd(runtime, `ruby -v${deps.ruby.exeSuffix}`)
  deps.jekyll.exe = utils.dockerCmd(runtime, 'bundler exec jekyll')
  deps.bundler.exe = utils.dockerCmd(runtime, 'bundler')

  // Write shims
  for (const name in deps) {
    const dep = deps[name]
    if (dep.writeShim) {
      let shim = `${envPrefix + dep.exe.trim()} $*${deps.ruby.exeSuffix}\n`
      if (name === 'dash') {
        shim = `${envPrefix + dep.exe.trim()} $*${deps.dash.exeSuffix}\n`
      }
      var shimPath = path.join(runtime.binDir, name)
      fs.writeFileSync(shimPath, shim, { 'encoding': 'utf-8', 'mode': '755' })
      scrolex.stick(`Installed: ${name} shim to: ${shimPath} ..`)
    }
  }
}
