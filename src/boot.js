require('babel-polyfill')
module.exports = async function boot (whichPackage) {
  const _       = require('lodash')
  const config  = require('./config')
  const utils   = require('./utils')
  const fs      = require('fs')
  const scrolex = require('scrolex')
  const runtime = config.runtime

  // 'start'                    : 'parallelshell "lanyon build:content:watch" "lanyon build:assets:watch" "lanyon serve"',
  const scripts = {
    // assets:watch is typically handled via browsersync middleware, so this is more for debugging purposes:
    'build:assets:watch'       : 'webpack --watch --config [cacheDir]/webpack.config.js',
    'build:assets'             : 'webpack --config [cacheDir]/webpack.config.js',
    'build:content:incremental': 'jekyll build --incremental --source [projectDir] --destination [contentBuildDir] --verbose --config [projectDir]/_config.yml,[cacheDir]/jekyll.config.yml,[cacheDir]/jekyll.lanyon_assets.yml',
    'build:content:watch'      : 'nodemon --config [cacheDir]/nodemon.config.json --exec "lanyon build:content:incremental"',
    'build:content'            : 'jekyll build --source [projectDir] --destination [contentBuildDir] --verbose --config [projectDir]/_config.yml,[cacheDir]/jekyll.config.yml,[cacheDir]/jekyll.lanyon_assets.yml',
    // 'build:images'             : 'imagemin [projectDir]/assets/images --out-dir=[projectDir]/assets/build/images',
    // @todo: useless until we have: https://github.com/imagemin/imagemin-cli/pull/11 and https://github.com/imagemin/imagemin/issues/226
    'build:emoji'              : 'bundler exec gemoji extract assets/images/emoji',
    'build'                    : 'lanyon build:assets && lanyon build:content', // <-- parrallel won't work for production builds, jekyll needs to copy assets into _site
    'container:connect'        : utils.dockerCmd(runtime, 'sh', '--interactive --tty'),
    'deploy'                   : require(`./deploy`),
    'encrypt'                  : require(`./encrypt`),
    'help'                     : 'jekyll build --help',
    'install'                  : require(`./install`),
    'list:ghpgems'             : 'bundler exec github-pages versions --gem',
    'serve'                    : 'browser-sync start --config [cacheDir]/browsersync.config.js',
    'start'                    : 'parallelshell "lanyon build:content:watch" "lanyon serve"',
  }

  if (runtime.trace) {
    scripts['build:content:incremental'] += ' --trace'
    scripts['build:content']             += ' --trace'
  }

  if (runtime.profile) {
    scripts['build:content:incremental'] += ' --profile'
    scripts['build:content']             += ' --profile'
  }

  const cmdName = process.argv[2]
  let cmd       = scripts[cmdName]

  scrolex.persistOpts({
    announce             : true,
    addCommandAsComponent: true,
    components           : `lanyon>${cmdName}`,
    env                  : Object.assign({}, process.env, {
      DEBUG              : process.env.DEBUG,
      LANYON_DISABLE_GEMS: process.env.LANYON_DISABLE_GEMS,
      NODE_ENV           : runtime.lanyonEnv,
      JEKYLL_ENV         : runtime.lanyonEnv,
      LANYON_PROJECT     : runtime.projectDir, // <-- to preserve the cwd over multiple nested executes, if it wasn't initially setly set
    }),
  })

  if (require.main === module) {
    scrolex.failure(`Please only used this module via require`)
    process.exit(1)
  }

  scrolex.stick(`Booting ${whichPackage.type} Lanyon->${cmdName}. Version: ${whichPackage.version} on PID: ${process.pid} from: ${__filename}`)
  scrolex.stick(`Detected cacheDir as "${runtime.cacheDir}"`)
  scrolex.stick(`Detected gitRoot as "${runtime.gitRoot}"`)
  scrolex.stick(`Detected npmRoot as "${runtime.npmRoot}"`)

  if (process.env.LANYON_DISABLE_GEMS) {
    scrolex.stick(`Disabled gems ${process.env.LANYON_DISABLE_GEMS} as per LANYON_DISABLE_GEMS`)
  }
  if (process.env.LANYON_EXCLUDE) {
    scrolex.stick(`Disabled building of ${process.env.LANYON_EXCLUDE} as per LANYON_EXCLUDE`)
  }
  if (process.env.LANYON_INCLUDE) {
    scrolex.stick(`Explicitly enabling building of ${process.env.LANYON_INCLUDE} as per LANYON_INCLUDE`)
  }

  // Create asset dirs and git ignores
  if (cmdName.match(/^build|install|start/)) {
    utils.initProject(runtime)
  }

  // Run Pre-Hooks
  if (cmdName.match(/^build:(assets|content)/)) {
    await utils.runhooks('pre', cmdName, runtime)
  }

  // Write all config files to cacheDir
  scrolex.stick('Writing configs')
  utils.writeConfig(config)

  // Run cmd arg
  if (_.isFunction(cmd)) {
    scrolex.stick(`Running ${cmdName} function`)
    cmd(runtime, err => {
      if (err) {
        scrolex.failure(`${cmdName} function exited with error ${err}`)
        process.exit(1)
      }
      scrolex.stick(`${cmdName} done`)
    })
  } else if (_.isString(cmd)) {
    // Replace dirs
    cmd = cmd.replace(/\[lanyonDir]/g, runtime.lanyonDir)
    cmd = cmd.replace(/\[contentBuildDir]/g, runtime.contentBuildDir)
    cmd = cmd.replace(/\[projectDir]/g, runtime.projectDir)
    cmd = cmd.replace(/\[cacheDir]/g, runtime.cacheDir)

    // Replace all npms with their first-found full-path executables
    const npmBins = {
      'browser-sync' : 'node_modules/browser-sync/bin/browser-sync.js',
      'lanyon'       : 'node_modules/lanyon/lib/cli.js',
      'nodemon'      : 'node_modules/nodemon/bin/nodemon.js',
      'npm-run-all'  : 'node_modules/npm-run-all/bin/npm-run-all/index.js',
      'parallelshell': 'node_modules/parallelshell/index.js',
      'webpack'      : 'node_modules/webpack/bin/webpack.js',
      // 'imagemin'     : 'node_modules/imagemin-cli/cli.js',
    }
    for (const name in npmBins) {
      const tests = [
        `${runtime.npmRoot}/${npmBins[name]}`,
        `${runtime.projectDir}/${npmBins[name]}`,
        `${runtime.lanyonDir}/${npmBins[name]}`,
        `${runtime.gitRoot}/${npmBins[name]}`,
      ]

      let found = false
      tests.forEach(test => {
        if (fs.existsSync(test)) {
          npmBins[name] = test
          found         = true
          return false // Stop looking on first hit
        }
      })

      if (!found) {
        throw new Error(`Cannot find dependency "${name}" in "${tests.join('", "')}"`)
      }
      const pat = new RegExp(`(\\s|^)${name}(\\s|$)`)
      cmd = cmd.replace(pat, `$1node ${npmBins[name]}$2`)
    }

    const scrolexOpts = {
      stdio: 'pipe',
      cwd  : runtime.cacheDir,
      fatal: true,
    }
    if (cmdName !== 'start') {
      scrolexOpts.mode = 'passthru'
    }
    if (cmdName === 'container:connect') {
      scrolexOpts.stdio = 'inherit'
    }

    // Replace shims
    cmd = cmd.replace(/(\s|^)jekyll(\s|$)/, `$1${runtime.binDir}/jekyll$2`)
    cmd = cmd.replace(/(\s|^)bundler(\s|$)/, `$1${runtime.binDir}/bundler$2`)

    scrolex.exe(cmd, scrolexOpts, async (err, out) => { // eslint-disable-line handle-callback-err
      // Run Post-Hooks
      await utils.runhooks('post', cmdName, runtime)
    })
  } else {
    scrolex.failure(`"${cmdName}" is not a valid Lanyon command. Pick from: ${Object.keys(scripts).join(', ')}.`)
    process.exit(1)
  }
}
