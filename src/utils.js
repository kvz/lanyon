const semver = require('semver')
const fs = require('fs')
// const _        = require('lodash')
const path = require('path')
const _ = require('lodash')
const yaml = require('js-yaml')
const shell = require('shelljs')
// const spawnSync   = require('spawn-sync')
// const oneLine     = require('common-tags/lib/oneLine')
// const stripIndent = require('common-tags/lib/stripIndent')
const scrolex = require('scrolex').persistOpts({
  announce             : true,
  addCommandAsComponent: true,
})
const utils = this
const oneLine = require('common-tags/lib/oneLine')
// const pad = require('pad')
// const async = require('async')

if (require.main === module) {
  scrolex.failure(`Please only used this module via require`)
  process.exit(1)
}

module.exports.formatCmd = function formatCmd (cmd, { runtime, cmdName }) {
  let extraVolumes = ''
  if (runtime.contentBuildDir.indexOf(runtime.projectDir) === -1) {
    extraVolumes = `--volume ${runtime.contentBuildDir}:${runtime.contentBuildDir}`
  }

  // Replace dirs
  cmd = cmd.replace(/\[lanyonDir]/g, runtime.lanyonDir)
  cmd = cmd.replace(/\[contentBuildDir]/g, runtime.contentBuildDir)
  cmd = cmd.replace(/\[projectDir]/g, runtime.projectDir)
  cmd = cmd.replace(/\[cacheDir]/g, runtime.cacheDir)

  // Replace all npms with their first-found full-path executables
  const npmBins = {
    'browser-sync': 'node_modules/browser-sync/bin/browser-sync.js',
    'nodemon'     : 'node_modules/nodemon/bin/nodemon.js',
    'webpack'     : 'node_modules/webpack/bin/webpack.js',
    // 'imagemin'     : 'node_modules/imagemin-cli/cli.js',
  }
  for (const name in npmBins) {
    const tests = [
      `/srv/lanyon/${npmBins[name]}`,
      `${runtime.npmRoot}/${npmBins[name]}`,
      `${runtime.projectDir}/${npmBins[name]}`,
      `${runtime.lanyonDir}/${npmBins[name]}`,
      `${runtime.gitRoot}/${npmBins[name]}`,
    ]

    let found = false
    tests.forEach(test => {
      if (fs.existsSync(test)) {
        npmBins[name] = test
        found = true
        return false // Stop looking on first hit
      }
    })

    if (!found) {
      throw new Error(`Cannot find dependency "${name}" in "${tests.join('", "')}"`)
    }
    const pat = new RegExp(`(\\s|^)\\[${name}\\](\\s|$)`)
    cmd = cmd.replace(pat, `$1node ${npmBins[name]}$2`)

    // let nodeBin = utils.dockerString('node', { extraArgs: extraVolumes, runtime })
    // cmd = cmd.replace(pat, `$1${nodeBin} ${npmBins[name]}$2`)
  }

  // cp -f ${runtime.projectDir}/Gemfile ${runtime.cacheDir}/Gemfile &&
  let jekyllBin = utils.dockerString('jekyll', { extraArgs: extraVolumes, runtime })

  // Replace shims
  cmd = cmd.replace(/(\s|^)\[jekyll\](\s|$)/, `$1${jekyllBin}$2`)

  return cmd
}

module.exports.dockerString = function dockerString (cmd, { extraArgs, runtime }) {
  let wantVersion = runtime.lanyonVersion
  wantVersion = '0.0.109'
  return oneLine`
    docker run
      --rm
      -i
      --workdir ${runtime.cacheDir}
      --volume ${runtime.cacheDir}:${runtime.cacheDir}
      --volume ${runtime.projectDir}:${runtime.projectDir}
      --volume ${runtime.cacheDir}/srv-jekyll:/srv/jekyll
      ${extraArgs}
      kevinvz/lanyon:${wantVersion}
      ${cmd}
  `
}

module.exports.runString = async function runString (cmd, { runtime, cmdName, origCmd, hookName }) {
  const scrolexOpts = {
    stdio                : 'pipe',
    cwd                  : runtime.cacheDir,
    fatal                : true,
    components           : `lanyon>${cmdName}>${origCmd.split('--')[0].trim().replace('[', '').replace(']', '')}`,
    addCommandAsComponent: false,
  }

  // Run Pre-Hooks
  scrolex.stick(`Running pre${hookName} hooks (if any)`)
  await utils.runhooks('pre', hookName, runtime)

  scrolex.exe(cmd, scrolexOpts, async (err, out) => { // eslint-disable-line handle-callback-err
    // Run Post-Hooks
    scrolex.stick(`Done. Running post${hookName} hooks (if any)`)
    await utils.runhooks('post', hookName, runtime)
  })
}

module.exports.runhooks = async (order, cmdName, runtime) => {
  let squashedHooks = utils.gethooks(order, cmdName, runtime)

  if (!squashedHooks) {
    return
  }

  return scrolex.exe(squashedHooks, {
    cwd       : runtime.projectDir,
    mode      : (process.env.SCROLEX_MODE || 'passthru'),
    components: `lanyon>hooks>${order}${cmdName}`,
  })
}

module.exports.gethooks = (order, cmdName, runtime) => {
  let arr = []

  arr = [
    `${order}${cmdName}`,
    `${order}${cmdName}:production`,
    `${order}${cmdName}:development`,
    `${order}${cmdName}:content`,
    `${order}${cmdName}:content:production`,
    `${order}${cmdName}:content:development`,
    `${order}${cmdName}:assets`,
    `${order}${cmdName}:assets:production`,
    `${order}${cmdName}:assets:development`,
  ]

  let squashedHooks = ''
  for (let i in arr) {
    let hook = arr[i]
    if (runtime[hook]) {
      const lastPart = hook.split(':').pop()
      let needEnv = 'both'

      if (lastPart === 'production') {
        needEnv = lastPart
      }
      if (lastPart === 'development') {
        needEnv = lastPart
      }

      if (needEnv === 'both' || runtime.lanyonEnv === needEnv) {
        squashedHooks = runtime[hook]
        if (_.isArray(runtime[hook])) {
          squashedHooks = runtime[hook].join(' && ')
        }
        return squashedHooks
      }
    }
  }
}

module.exports.upwardDirContaining = (find, cwd, not) => {
  if (!cwd) {
    cwd = process.env.PWD || process.cwd()
  }
  const parts = cwd.split('/')
  while (parts.length) {
    const newParts = parts
    const ppath = `${newParts.join('/')}/${find}`
    if (fs.existsSync(ppath)) {
      if (not === undefined || not !== path.basename(path.dirname(ppath))) {
        return path.dirname(ppath)
      }
    }
    parts.pop()
  }
  return false
}

module.exports.initProject = ({ assetsBuildDir, gitRoot, cacheDir, binDir }) => {
  if (!fs.existsSync(assetsBuildDir)) {
    shell.mkdir('-p', assetsBuildDir)
    shell.exec(`cd "${path.dirname(gitRoot)}" && git ignore "${path.relative(gitRoot, assetsBuildDir)}"`)
  }
  if (!fs.existsSync(cacheDir)) {
    shell.mkdir('-p', cacheDir)
    shell.exec(`cd "${path.dirname(gitRoot)}" && git ignore "${path.relative(gitRoot, cacheDir)}"`)
  }
  if (!fs.existsSync(binDir)) {
    shell.mkdir('-p', binDir)
    shell.exec(`cd "${path.dirname(gitRoot)}" && git ignore "${path.relative(gitRoot, binDir)}"`)
  }
}

module.exports.fsCopySync = (src, dst, { mode = '644', encoding = 'utf-8' } = {}) => {
  fs.writeFileSync(`${dst}`, fs.readFileSync(`${src}`, 'utf-8'), { mode, encoding })
}

module.exports.writeConfig = (cfg) => {
  if (!fs.existsSync(`${cfg.runtime.cacheDir}/jekyll.lanyon_assets.yml`)) {
    fs.writeFileSync(`${cfg.runtime.cacheDir}/jekyll.lanyon_assets.yml`, '# this file should be overwritten by the Webpack AssetsPlugin', 'utf-8')
  }
  try {
    fs.writeFileSync(`${cfg.runtime.cacheDir}/jekyll.config.yml`, yaml.safeDump(cfg.jekyll), 'utf-8')
  } catch (e) {
    console.error({ jekyll: cfg.jekyll })
    throw new Error(`Unable to write above config to ${cfg.runtime.cacheDir}/jekyll.config.yml. ${e.message}`)
  }
  fs.writeFileSync(`${cfg.runtime.cacheDir}/nodemon.config.json`, JSON.stringify(cfg.nodemon, null, '  '), 'utf-8')
  fs.writeFileSync(`${cfg.runtime.cacheDir}/full-config-dump.json`, JSON.stringify(cfg, null, '  '), 'utf-8')
  fs.writeFileSync(`${cfg.runtime.cacheDir}/browsersync.config.js`, `module.exports = require("${cfg.runtime.lanyonDir}/src/config.js").browsersync`, 'utf-8')
  fs.writeFileSync(`${cfg.runtime.cacheDir}/webpack.config.js`, `module.exports = require("${cfg.runtime.lanyonDir}/src/config.js").webpack`, 'utf-8')
  fs.writeFileSync(cfg.runtime.recordsPath, JSON.stringify({}, null, '  '), 'utf-8')
}

module.exports.satisfied = ({ prerequisites }, app, cmd, checkOn) => {
  let tag = ''
  if (checkOn === undefined) {
    checkOn = app
  } else {
    tag = `${checkOn}/`
  }

  if (!cmd) {
    cmd = `${app} -v`
  }

  const p = shell.exec(cmd, { 'silent': true })
  const appVersionFull = p.stdout.trim() || p.stderr.trim()
  const parts = appVersionFull.replace(/0+(\d)/g, '$1').split(/[,p\s-]+/)
  let appVersion = parts[1]

  if (app === 'node') {
    appVersion = parts[0]
  } else if (app === 'docker') {
    appVersion = parts[2]
  }

  try {
    if (semver.satisfies(appVersion, prerequisites[app].range)) {
      scrolex.stick(`${tag}${app} '${prerequisites[app].range} available`)
      return true
    }
  } catch (e) {
    scrolex.failure(`${tag}${app} '${prerequisites[app].range} unavailable. output: ${appVersionFull}. ${e}`)
    return false
  }

  scrolex.failure(`${tag}${app} '${prerequisites[app].range} unavailable. output: ${appVersionFull}`)
  return false
}
