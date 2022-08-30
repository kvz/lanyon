const fs      = require('fs')
const scrolex = require('scrolex')

let mods = {
  overrideRuntime ({ runtime }) { return runtime },
  overrideConfig ({ config }) { return config },
}

const cfg = {}
let runtime = require('./config.runtime.cjs')()

if (fs.existsSync(`${runtime.projectDir}/.lanyonrc.cjs`)) {
  mods = require(`${runtime.projectDir}/.lanyonrc.cjs`)
} else if (fs.existsSync(`${runtime.projectDir}/.lanyonrc.js`)) {
  mods = require(`${runtime.projectDir}/.lanyonrc.js`)
}

const toolkit = {
  scrolex,
}

runtime = mods.overrideRuntime({ runtime, toolkit })

if ('scrolexMode' in runtime) {
  scrolex.persistOpts({
    mode: runtime.scrolexMode,
  })
}

cfg.webpack = require('./config.webpack.cjs')({ runtime, toolkit })
cfg.browsersync = require('./config.browsersync.cjs')({ runtime, webpack: cfg.webpack, toolkit })
cfg.jekyll = require('./config.jekyll.cjs')({ runtime, toolkit })
cfg.nodemon = require('./config.nodemon.cjs')({ runtime, jekyll: cfg.jekyll, toolkit })

cfg.runtime = runtime

module.exports = mods.overrideConfig({ config: cfg, toolkit })
