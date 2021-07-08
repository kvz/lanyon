const childProcess = require('child_process')
const fs           = require('fs')
const path         = require('path')
const os           = require('os')
const yaml         = require('js-yaml')
const oneLine      = require('common-tags/lib/oneLine')
const scrolex      = require('scrolex').persistOpts({
  announce             : true,
  addCommandAsComponent: true,
})

const utils = this

if (require.main === module) {
  scrolex.failure('Please only used this module via require')
  process.exit(1)
}

module.exports.formatCmd = function formatCmd (cmd, { runtime }) {
  // Replace dirs
  cmd = cmd.replace(/\[lanyonDir]/g, runtime.lanyonDir)
  cmd = cmd.replace(/\[contentBuildDir]/g, runtime.contentBuildDir)
  cmd = cmd.replace(/\[projectDir]/g, runtime.projectDir)
  cmd = cmd.replace(/\[cacheDir]/g, runtime.cacheDir)
  cmd = cmd.replace(/\[assetsBuildDir]/g, runtime.assetsBuildDir)

  // Replace all npms with their first-found full-path executables
  const npmBins = {
    'browser-sync': 'node_modules/browser-sync/dist/bin.js',
    nodemon       : 'node_modules/nodemon/bin/nodemon.js',
    webpack       : 'node_modules/webpack/bin/webpack.js',
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

    cmd = cmd.replace(pat, `$1node --trace-deprecation ${npmBins[name]}$2`)

    // let nodeBin = utils.dockerString('node', { extraArgs: extraVolumes, runtime })
    // cmd = cmd.replace(pat, `$1${nodeBin} ${npmBins[name]}$2`)
  }

  // cp -f ${runtime.projectDir}/Gemfile ${runtime.cacheDir}/Gemfile &&
  const jekyllBin = utils.dockerString('jekyll', { runtime })

  // Replace shims
  if (process.env.LANYON_JEKYLL) {
    cmd = cmd.replace(/(\s|^)\[jekyll\](\s|$)/, `$1${process.env.LANYON_JEKYLL}$2`)
  } else {
    cmd = cmd.replace(/(\s|^)\[jekyll\](\s|$)/, `$1${jekyllBin}$2`)
  }

  return cmd
}

module.exports.splitDir = function splitDir (dir) {
  const dirList = []
  const parts = `${dir}`.split('/')
  let cont = ''
  for (const i in parts) {
    const part = parts[i]
    if (!part) continue
    cont = `${cont}/${part}`
    dirList.push(cont)
  }
  return dirList
}

module.exports.trapCleanup = function trapCleanup ({ runtime, code = 0, signal = '' }) {
  if (runtime.dying === true) {
    return
  }
  runtime.dying = true

  let cleanupCmds = [
    'pkill -f nodemon',
    'pkill -f browser-sync',
  ]

  if (runtime.dockerSync && runtime.dockerSync.enabled === true) {
    cleanupCmds = cleanupCmds.concat([
      'docker-sync stop',
      // `docker-compose stop`,
    ])
  }

  if (process.env.LANYON_DEBUG === '1') {
    console.error(`>>> About to exit. code=${code}, signal=${signal}. Cleaning up... `)
  }

  for (const i in cleanupCmds) {
    const c = cleanupCmds[i]
    if (process.env.LANYON_DEBUG === '1') {
      console.error(`Cleanup command: '${c}' ...`)
    }
    try {
      childProcess.execSync(`${c}`, {
        cwd: `${runtime.cacheDir}`,
      })
    } catch (err) {} // eslint-disable-line
  }

  if (signal === 'SIGINT') {
    if (process.env.LANYON_DEBUG === '1') {
      console.error('>>> Process aborted')
    }
    process.exit(1)
  }
}

module.exports.dockerString = function dockerString (cmd, { opts = {}, runtime } = {}) {
  const volumePaths = utils.volumePaths({ runtime })
  const listVolumes = []
  for (const key in volumePaths) {
    listVolumes.push(`--volume ${key}:${volumePaths[key]}`)
  }

  if (runtime.dockerSync && runtime.dockerSync.enabled === true) {
    // -i
    // --rm
    // ${cmd}
    // --workdir=${runtime.cacheDir}
    // -e "JEKYLL_ENV=${runtime.lanyonEnv}"
    // docker-sync start && docker-compose up && docker-compose exec
    return oneLine`
      docker-compose exec -T
        lanyon-container
      ${cmd}
    `
  }

  if (!opts || !('priviliged' in opts)) {
    opts.priviliged = false
  }

  // https://github.com/envygeeks/jekyll-docker/issues/223
  // --env "JEKYLL_GID=${os.userInfo().gid}" // <-- runs the risk of: groupmod: GID '20' already exists
  let userstr = ''
  if (opts.priviliged === false) {
    userstr = oneLine`
      --env "JEKYLL_UID=${os.userInfo().uid}"
    `
  }

  return oneLine`
    docker run
      --rm
      --interactive
      ${userstr}
      --env "JEKYLL_ENV=${runtime.lanyonEnv}"
      --workdir ${runtime.cacheDir}
      ${listVolumes.join('\n')}
      ${runtime.dockerImage}
    ${cmd}
  `
}

module.exports.volumePaths = function volumePaths ({ runtime }) {
  const volumePaths = {}

  if (runtime.contentBuildDir.indexOf(runtime.projectDir) === -1) {
    volumePaths[runtime.contentBuildDir] = runtime.contentBuildDir
  }
  if (runtime.cacheDir.indexOf(runtime.projectDir) === -1) {
    volumePaths[runtime.cacheDir] = runtime.cacheDir
  }

  volumePaths[runtime.projectDir] = runtime.projectDir

  return volumePaths
}

module.exports.runString = async function runString (cmd, { runtime, cmdName, origCmd, hookName }) {
  const scrolexOpts = {
    cwd                  : runtime.cacheDir,
    fatal                : true,
    mode                 : 'passthru',
    components           : `lanyon>${cmdName}>${origCmd.split('--')[0].trim().replace('[', '').replace(']', '')}`,
    addCommandAsComponent: false,
  }

  await utils.runhooks('pre', hookName, runtime)
  await scrolex.exe(cmd, scrolexOpts)
  await utils.runhooks('post', hookName, runtime)
}

module.exports.runhooks = async (order, cmdName, runtime) => {
  const squashedHooks = utils.gethooks(order, cmdName, runtime)

  if (process.env.LANYON_DEBUG === '1') {
    scrolex.stick(`Running ${squashedHooks.length} ${order}${cmdName} hooks`)
  }

  if (!squashedHooks.length) {
    return
  }

  return scrolex.exe(squashedHooks.join(' && '), {
    cwd       : runtime.projectDir,
    fatal     : true,
    mode      : 'passthru',
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

  let squashedHooks = []
  for (const i in arr) {
    const hook = arr[i]
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
        squashedHooks = squashedHooks.concat(runtime[hook])
      }
    }
  }

  return squashedHooks
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

module.exports.initProject = async ({ assetsBuildDir, gitRoot, cacheDir }) => {
  const scrolexOpts = {
    cwd  : gitRoot,
    fatal: false,
    mode : 'passthru',
  }

  const dirs = [
    assetsBuildDir,
    cacheDir,
  ]

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      const rel = path.relative(gitRoot, dir)
      try {
        await scrolex.exe(`mkdir -p '${rel}' && (grep -E '^.lanyon' .gitignore >/dev/null 2>&1 || echo '${rel}' >> .gitignore || true)`, scrolexOpts)
      } catch (err) {
        console.error(`Could not create dir. rel=${rel} gitRoot=${gitRoot} dir=${dir} err=${err}`)
      }
    }
  }
}

module.exports.fsCopySync = (src, dst, { mode = '644', encoding = 'utf-8' } = {}) => {
  fs.writeFileSync(`${dst}`, fs.readFileSync(`${src}`, 'utf-8'), { mode, encoding })
}

module.exports.writeConfig = (cfg) => {
  try {
    fs.writeFileSync(`${cfg.runtime.cacheDir}/jekyll.config.yml`, yaml.dump(cfg.jekyll), 'utf-8')
  } catch (e) {
    console.error({ jekyll: cfg.jekyll })
    throw new Error(`Unable to write above config to ${cfg.runtime.cacheDir}/jekyll.config.yml. ${e.message}`)
  }

  if (cfg.runtime.dockerSync && cfg.runtime.dockerSync.enabled === true) {
    try {
      fs.writeFileSync(`${cfg.runtime.cacheDir}/docker-sync.yml`, yaml.dump(cfg.dockerSync), 'utf-8')
    } catch (e) {
      console.error({ dockerSync: cfg.dockerSync })
      throw new Error(`Unable to write above config to ${cfg.runtime.cacheDir}/docker-sync.yml. ${e.message}`)
    }
    try {
      fs.writeFileSync(`${cfg.runtime.cacheDir}/docker-compose.yml`, yaml.dump(cfg.dockerCompose), 'utf-8')
    } catch (e) {
      console.error({ dockerCompose: cfg.dockerCompose })
      throw new Error(`Unable to write above config to ${cfg.runtime.cacheDir}/docker-compose.yml. ${e.message}`)
    }
    try {
      fs.writeFileSync(`${cfg.runtime.cacheDir}/docker-compose-dev.yml`, yaml.dump(cfg.dockerComposeDev), 'utf-8')
    } catch (e) {
      console.error({ dockerComposeDev: cfg.dockerComposeDev })
      throw new Error(`Unable to write above config to ${cfg.runtime.cacheDir}/docker-compose-dev.yml. ${e.message}`)
    }
  }

  fs.writeFileSync(`${cfg.runtime.cacheDir}/nodemon.config.json`, JSON.stringify(cfg.nodemon, null, '  '), 'utf-8')
  fs.writeFileSync(`${cfg.runtime.cacheDir}/full-config-dump.json`, JSON.stringify(cfg, null, '  '), 'utf-8')
  fs.writeFileSync(`${cfg.runtime.cacheDir}/browsersync.config.js`, `module.exports = require("${cfg.runtime.lanyonDir}/src/config.js").browsersync`, 'utf-8')
  fs.writeFileSync(`${cfg.runtime.cacheDir}/webpack.config.js`, `module.exports = require("${cfg.runtime.lanyonDir}/src/config.js").webpack`, 'utf-8')
  fs.writeFileSync(cfg.runtime.recordsPath, JSON.stringify({}, null, '  '), 'utf-8')
}
