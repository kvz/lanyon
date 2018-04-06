const fs      = require('fs')
const scrolex = require('scrolex')

let mods = {
  overrideRuntime: function (config) { return config },
  overrideConfig : function (config) { return config },
}

let cfg = {}
let runtime = require('./config.runtime.js')()

if (fs.existsSync(`${runtime.projectDir}/.lanyonrc.js`)) {
  mods = require(`${runtime.projectDir}/.lanyonrc.js`)
}

runtime = mods.overrideRuntime(runtime)

if ('scrolexMode' in runtime) {
  scrolex.persistOpts({
    mode: runtime.scrolexMode,
  })
}

cfg.webpack = require('./config.webpack.js')({runtime})
cfg.browsersync = require('./config.browsersync.js')({ runtime, webpack: cfg.webpack })
cfg.jekyll = require('./config.jekyll.js')({runtime})
cfg.nodemon = require('./config.nodemon.js')({runtime, jekyll: cfg.jekyll})
cfg.runtime = runtime

module.exports = mods.overrideConfig(cfg)
