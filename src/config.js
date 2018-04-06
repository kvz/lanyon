const path                    = require('path')
const utils                   = require('./utils')
const fs                      = require('fs')
const scrolex                 = require('scrolex').persistOpts({
  announce             : true,
  addCommandAsComponent: true,
  components           : `lanyon>config`,
})

if (require.main === module) {
  scrolex.failure(`Please only used this module via require, or: src/cli.js ${process.argv[1]}`)
  process.exit(1)
}

let runtime = {}

runtime.lanyonDir = path.join(__dirname, '..')
runtime.lanyonEnv = process.env.LANYON_ENV || 'development'
runtime.lanyonPackageFile = path.join(runtime.lanyonDir, 'package.json')
const lanyonPackage       = require(runtime.lanyonPackageFile)
runtime.lanyonVersion = lanyonPackage.version
runtime.publicPath = '/assets/build/'

runtime.lanyonReset = process.env.LANYON_RESET === '1'
runtime.onTravis = process.env.TRAVIS === 'true'
runtime.ghPagesEnv = {
  GHPAGES_URL     : process.env.GHPAGES_URL,
  GHPAGES_BOTNAME : process.env.GHPAGES_BOTNAME,
  GHPAGES_BOTEMAIL: process.env.GHPAGES_BOTEMAIL,
}
runtime.isDev = runtime.lanyonEnv === 'development'
runtime.attachHMR = runtime.isDev && process.argv[1].indexOf('browser-sync') !== -1 && ['start', 'start:crm', 'start:crm2'].indexOf(process.argv[2]) !== -1

runtime.projectDir = process.env.LANYON_PROJECT || process.env.PWD || process.cwd() // <-- symlinked npm will mess up process.cwd() and point to ~/code/lanyon

runtime.npmRoot = utils.upwardDirContaining('package.json', runtime.projectDir, 'lanyon')
if (!runtime.npmRoot) {
  scrolex.failure(`Unable to determine non-lanyon npmRoot, falling back to ${runtime.projectDir}`)
  runtime.npmRoot = runtime.projectDir
}
runtime.gitRoot = utils.upwardDirContaining('.git', runtime.npmRoot)

let mods = {
  head: function (config) { return config },
  tail: function (config) { return config },
}
if (fs.existsSync(`${runtime.projectDir}/.lanyonrc.js`)) {
  mods = require(`${runtime.projectDir}/.lanyonrc.js`)
}

runtime.statistics = 'stats.html'
runtime.entries = [
  'app',
]
runtime.prerequisites = {
  'sh': {
    'preferred': '0.5.7',
    'range'    : '>=0.0.1',
  },
  'node': {
    'preferred': '8.11.0',
    'range'    : '>=8',
  },
  'docker': {
    'preferred': '1.12.3',
    'range'    : '>=1.12',
  },
}
runtime.ports = {
  'assets' : 3000,
  'content': 4000,
}

try {
  runtime.projectDir = fs.realpathSync(runtime.projectDir)
} catch (e) {
  runtime.projectDir = fs.realpathSync(`${runtime.gitRoot}/${runtime.projectDir}`)
}

runtime.cacheDir = path.join(runtime.projectDir, '.lanyon')
runtime.binDir = path.join(runtime.cacheDir, 'bin')
runtime.recordsPath = path.join(runtime.cacheDir, 'records.json')
runtime.assetsSourceDir = path.join(runtime.projectDir, 'assets')
runtime.assetsBuildDir = path.join(runtime.assetsSourceDir, 'build')
runtime.contentBuildDir = path.join(runtime.projectDir, '_site')
runtime.contentScandir = path.join(runtime.projectDir, runtime.contentScandir || '.')
runtime.contentIgnore = runtime.contentIgnore || []
runtime.contentBuildDir = path.join(runtime.projectDir, '_site')

let cfg = {}
cfg.webpack = require('./config.webpack.js')({runtime})
cfg.browsersync = require('./config.browsersync.js')({ runtime, webpack: cfg.webpack })
cfg.jekyll = require('./config.jekyll.js')({runtime})
cfg.nodemon = require('./config.nodemon.js')({runtime})
cfg.runtime = runtime

module.exports = mods.tail(cfg)
