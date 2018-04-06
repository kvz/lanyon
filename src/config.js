const fs                      = require('fs')

let mods = {
  head: function (config) { return config },
  tail: function (config) { return config },
}

let cfg = {}
let runtime = require('./config.runtime.js')()
cfg.webpack = require('./config.webpack.js')({runtime})
cfg.browsersync = require('./config.browsersync.js')({ runtime, webpack: cfg.webpack })
cfg.jekyll = require('./config.jekyll.js')({runtime})
cfg.nodemon = require('./config.nodemon.js')({runtime})
cfg.runtime = runtime

if (fs.existsSync(`${runtime.projectDir}/.lanyonrc.js`)) {
  mods = require(`${runtime.projectDir}/.lanyonrc.js`)
}

module.exports = mods.tail(cfg)
