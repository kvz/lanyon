const fs = require('fs')
const yaml = require('js-yaml')
const shell = require('shelljs')
const path = require('path')

const scrolex = require('scrolex').persistOpts({
  announce             : true,
  addCommandAsComponent: true,
  components           : `lanyon>config>jekyll`,
})

module.exports = function ({runtime}) {
  const jekyllConfigPath = path.join(runtime.projectDir, '_config.yml')
  let jekyllCfg = {}
  try {
    const buf = fs.readFileSync(jekyllConfigPath)
    jekyllCfg = yaml.safeLoad(buf)
  } catch (e) {
    scrolex.failure(`Unable to load ${jekyllConfigPath}`)
  }

  runtime.themeDir = false
  if (jekyllCfg.theme) {
    const cmd = `${path.join(runtime.binDir, 'bundler')} show ${jekyllCfg.theme}`
    const z = shell.exec(cmd).stdout
    if (!z) {
      scrolex.failure(`Unable to locate defined theme "${jekyllCfg.theme}" via bundler with cmd: "${cmd}"`)
    } else {
      runtime.themeDir = z
    }
  }

  if (!('incremental' in jekyllCfg)) {
    jekyllCfg.incremental = true
  }
  if (!('verbose' in jekyllCfg)) {
    jekyllCfg.verbose = true
  }
  if (!('source' in jekyllCfg)) {
    jekyllCfg.source = runtime.projectDir
  }
  if (!('destination' in jekyllCfg)) {
    jekyllCfg.destination = runtime.contentBuildDir
  }

  return jekyllCfg
}
