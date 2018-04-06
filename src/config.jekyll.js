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
  let jekyll = {}
  try {
    const buf = fs.readFileSync(jekyllConfigPath)
    jekyll = yaml.safeLoad(buf)
  } catch (e) {
    scrolex.failure(`Unable to load ${jekyllConfigPath}`)
  }

  runtime.themeDir = false
  if (jekyll.theme) {
    const cmd = `${path.join(runtime.binDir, 'bundler')} show ${jekyll.theme}`
    const z = shell.exec(cmd).stdout
    if (!z) {
      scrolex.failure(`Unable to locate defined theme "${jekyll.theme}" via bundler with cmd: "${cmd}"`)
    } else {
      runtime.themeDir = z
    }
  }

  if (!('incremental' in jekyll)) {
    jekyll.incremental = true
  }
  if (!('verbose' in jekyll)) {
    jekyll.verbose = true
  }
  if (!('source' in jekyll)) {
    jekyll.source = runtime.projectDir
  }
  if (!('destination' in jekyll)) {
    jekyll.destination = runtime.contentBuildDir
  }

  return jekyll
}
