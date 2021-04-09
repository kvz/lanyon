const fs      = require('fs')
const scrolex = require('scrolex')
const utils   = require('./utils')

let mods = {
  overrideRuntime ({ runtime }) { return runtime },
  overrideConfig ({ config }) { return config },
}

const cfg = {}
let runtime = require('./config.runtime.js')()

if (fs.existsSync(`${runtime.projectDir}/.lanyonrc.js`)) {
  mods = require(`${runtime.projectDir}/.lanyonrc.js`)
}

const toolkit = {
  dockerString: utils.dockerString,
  scrolex,
}

runtime = mods.overrideRuntime({ runtime, toolkit })

if ('scrolexMode' in runtime) {
  scrolex.persistOpts({
    mode: runtime.scrolexMode,
  })
}

cfg.webpack = require('./config.webpack.js')({ runtime, toolkit })
cfg.browsersync = require('./config.browsersync.js')({ runtime, webpack: cfg.webpack, toolkit })
cfg.jekyll = require('./config.jekyll.js')({ runtime, toolkit })
cfg.dockerSync = require('./config.dockerSync.js')({ runtime, jekyll: cfg.jekyll, toolkit })
cfg.dockerCompose = require('./config.dockerCompose.js')({ runtime, toolkit })
cfg.dockerComposeDev = require('./config.dockerComposeDev.js')({ runtime, toolkit })
cfg.nodemon = require('./config.nodemon.js')({ runtime, jekyll: cfg.jekyll, toolkit })

cfg.runtime = runtime

module.exports = mods.overrideConfig({ config: cfg, toolkit })
