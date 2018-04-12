const fs = require('fs')
const yaml = require('js-yaml')
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

  if (!('incremental' in jekyllCfg)) {
    jekyllCfg.incremental = true
  }
  if (!('source' in jekyllCfg)) {
    jekyllCfg.source = runtime.projectDir
  }
  if (!('destination' in jekyllCfg)) {
    jekyllCfg.destination = runtime.contentBuildDir
  }

  return jekyllCfg
}
