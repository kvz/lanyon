const path    = require('path')
const utils   = require('./utils')
const fs      = require('fs')
const scrolex = require('scrolex').persistOpts({
  announce             : true,
  addCommandAsComponent: true,
  components           : 'lanyon>config>runtime',
})

module.exports = function () {
  const runtimeCfg = {}
  runtimeCfg.lanyonDir = path.join(__dirname, '..')
  runtimeCfg.lanyonEnv = process.env.LANYON_ENV || 'development'
  runtimeCfg.lanyonPackageFile = path.join(runtimeCfg.lanyonDir, 'package.json')
  const lanyonPackage = require(runtimeCfg.lanyonPackageFile)
  runtimeCfg.lanyonVersion = lanyonPackage.version
  runtimeCfg.publicPath = '/assets/build/'
  runtimeCfg.analyze = process.env.LANYON_ANALYZE === '1' || false

  runtimeCfg.onTravis = process.env.TRAVIS === 'true'
  runtimeCfg.ghPagesEnv = {
    GHPAGES_URL     : process.env.GHPAGES_URL,
    GHPAGES_BOTNAME : process.env.GHPAGES_BOTNAME,
    GHPAGES_BOTEMAIL: process.env.GHPAGES_BOTEMAIL,
  }
  runtimeCfg.isDev = runtimeCfg.lanyonEnv === 'development'

  runtimeCfg.attachHMR = runtimeCfg.isDev && process.argv[1].indexOf('browser-sync') !== -1 && ['start', 'start:crm', 'start:crm2'].indexOf(process.argv[2]) !== -1

  if (process.env.LANYON_PROJECT) {
    runtimeCfg.projectDir = process.env.LANYON_PROJECT
  } else {
    // Find path of parent module that lists lanyon as a dependency
    for (const searchPath of module.paths) {
      let pkg
      try {
        // searchPath always ends with /node_modules
        pkg = JSON.parse(fs.readFileSync(path.join(searchPath, '..', 'package.json')))
      } catch (_) {
        continue
      }
      if ({ ...pkg.dependencies, ...pkg.devDependencies }.lanyon) {
        runtimeCfg.projectDir = path.join(searchPath, '..')
        break
      }
    }
    if (!runtimeCfg.projectDir) {
      throw new Error('Could not find path of project requiring lanyon')
    }
  }

  if (!('uglify' in runtimeCfg) && !runtimeCfg.isDev) {
    runtimeCfg.uglify = true
  }

  runtimeCfg.npmRoot = utils.upwardDirContaining('package.json', runtimeCfg.projectDir, 'lanyon')
  if (!runtimeCfg.npmRoot) {
    scrolex.failure(`Unable to determine non-lanyon npmRoot, falling back to ${runtimeCfg.projectDir}`)
    runtimeCfg.npmRoot = runtimeCfg.projectDir
  }
  runtimeCfg.gitRoot = utils.upwardDirContaining('.git', runtimeCfg.npmRoot)

  const wantVersion = runtimeCfg.lanyonVersion
  // wantVersion = '0.0.109'
  runtimeCfg.dockerImage = `kevinvz/lanyon:${wantVersion}`

  runtimeCfg.entries = [
    'app',
  ]
  runtimeCfg.prerequisites = {
    sh: {
      preferred: '0.5.7',
      range    : '>=0.0.1',
    },
    node: {
      preferred: '8.11.0',
      range    : '>=8',
    },
    docker: {
      preferred: '1.12.3',
      range    : '>=1.12',
    },
  }
  runtimeCfg.ports = {
    assets : 3000,
    content: 4000,
  }

  try {
    runtimeCfg.projectDir = fs.realpathSync(runtimeCfg.projectDir)
  } catch (e) {
    runtimeCfg.projectDir = fs.realpathSync(`${runtimeCfg.gitRoot}/${runtimeCfg.projectDir}`)
  }

  runtimeCfg.cacheDir = path.join(runtimeCfg.projectDir, '.lanyon')
  runtimeCfg.recordsPath = path.join(runtimeCfg.cacheDir, 'records.json')
  runtimeCfg.assetsSourceDir = path.join(runtimeCfg.projectDir, 'assets')
  runtimeCfg.extraAssetsSourceDirs = []
  runtimeCfg.assetsBuildDir = path.join(runtimeCfg.assetsSourceDir, 'build')
  runtimeCfg.contentScandir = path.join(runtimeCfg.projectDir, runtimeCfg.contentScandir || '.')
  runtimeCfg.contentBuildDir = path.join(runtimeCfg.projectDir, '_site')

  return runtimeCfg
}
