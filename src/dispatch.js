const _       = require('lodash')
const scrolex = require('scrolex')
const config  = require('./config')
const utils   = require('./utils')
const deploy  = require('./deploy')
const encrypt = require('./encrypt')

Promise.series = function series (providers) {
  const ret     = Promise.resolve(null)
  const results = []

  return providers.reduce((result, provider, index) => {
    return result.then(() => {
      return provider().then((val) => {
        results[index] = val
      })
    })
  }, ret).then(() => {
    return results
  })
}

module.exports = async function dispatch () {
  const { runtime } = config
  const cmdName = process.argv[2]

  // let buildCmd = '[jekyll] build --verbose --trace --config [cacheDir]/jekyll.config.yml'
  // LANYON_EXTRA_JEKYLL_FLAGS="--trace --verbose"

  let extraJekyllFlags = ''
  if (process.env.LANYON_EXTRA_JEKYLL_FLAGS) {
    extraJekyllFlags += `${process.env.LANYON_EXTRA_JEKYLL_FLAGS} `
  }
  if (process.env.LANYON_DEBUG === '1') {
    extraJekyllFlags += '--verbose --trace --profile '
  }

  let extraWebpackFlags = ''
  if (process.env.LANYON_DEBUG === '1') {
    extraWebpackFlags += '--progress --profile '
  }

  const buildCmd = `[jekyll] build ${extraJekyllFlags}--config [cacheDir]/jekyll.config.yml`
  const formattedBuildCmd = utils.formatCmd(buildCmd, { runtime, cmdName })
  // console.log(formattedBuildCmd)

  const postBuildContentHooks = utils.gethooks('post', 'build:content', runtime)
  let strPostBuildContentHooks = ''
  if (postBuildContentHooks.length) {
    strPostBuildContentHooks = `cd "${runtime.projectDir}" && ${postBuildContentHooks.join(' && ')}`
  }

  const scripts = {
    configure            : (_runtime, cb) => cb(null),
    'build:assets'       : `[webpack] ${extraWebpackFlags}--config [cacheDir]/webpack.config.cjs`,
    'build:content:watch': `${process.env.LANYON_DEBUG === '1' ? 'env DEBUG=nodemon:* ' : ''}[nodemon] --exitcrash --config [cacheDir]/nodemon.config.json --exec '${formattedBuildCmd} ${strPostBuildContentHooks}'`,
    'build:content'      : buildCmd,
    // 'build:images'             : '[imagemin] [projectDir]/assets/images --out-dir=[projectDir]/assets/build/images',
    // @todo: useless until we have: https://github.com/imagemin/imagemin-cli/pull/11
    // and https://github.com/imagemin/imagemin/issues/226
    build                : {
      mode    : 'series', // <-- parrallel won't work for production builds, jekyll needs to copy assets into _site
      commands: [
        'build:assets',
        'build:content',
      ],
    },
    deploy,
    encrypt,
    help : '[jekyll] build --help',
    serve: '[browser-sync] start --config [cacheDir]/browsersync.config.cjs',
    start: {
      mode    : 'all',
      commands: [
        'build:content:watch',
        'serve',
      ],
    },
  }

  if (process.env.LANYON_JEKYLL_WATCH === '1') {
    scripts['build:content:watch'] =  `[jekyll] build ${extraJekyllFlags}--watch --force_polling --config [cacheDir]/jekyll.config.yml`
  }

  const cmd = scripts[cmdName]

  scrolex.persistOpts({
    announce             : true,
    addCommandAsComponent: true,
    components           : `lanyon>${cmdName}`,
    env                  : {
      ...process.env,
      DEBUG         : process.env.DEBUG,
      NODE_ENV      : runtime.lanyonEnv,
      JEKYLL_ENV    : runtime.lanyonEnv,
      LANYON_PROJECT: runtime.projectDir,
      // ^-- to preserve the cwd over
      // multiple nested executes, if it wasn't initially setly set
    },
  })

  if (require.main === module) {
    scrolex.failure('Please only used this module via require')
    process.exit(1)
  }

  scrolex.stick(`Booting Lanyon->${cmdName}. ${runtime.isDev ? 'Development' : 'Production'} build. Version: ${runtime.lanyonVersion} on PID: ${process.pid} from: ${__filename}`)

  if (process.env.LANYON_DEBUG === '1') {
    for (const key of Object.keys(runtime).sort()) {
      scrolex.stick(`Runtime key '${key}' is '${runtime[key]}'`)
    }
  }

  // Create asset dirs and git ignores
  if (cmdName.match(/^(build|configure|start)/)) {
    await utils.initProject(runtime)
  }

  // Write all config files to cacheDir
  utils.writeConfig(config)

  process.on('exit', (code) => {
    utils.trapCleanup({ runtime, code })
  })
  process.on('SIGINT', () => {
    utils.trapCleanup({ runtime, signal: 'SIGINT' })
  })
  process.on('SIGUSR2', () => {
    utils.trapCleanup({ runtime, signal: 'SIGUSR2' })
  })

  // Run cmd arg
  if (_.isFunction(cmd)) {
    scrolex.stick(`Running ${cmdName} function`)
    cmd(runtime, err => {
      if (err) {
        scrolex.failure(`${cmdName} function exited with error ${err}`)
        process.exit(1)
      }
      scrolex.stick(`${cmdName} done`)
      process.exit(0)
    })
  } else if (_.isObject(cmd)) {
    // Execute multiple commands, in parallel or serial
    const methods = []

    cmd.commands.forEach(async (name) => {
      const realcmd = utils.formatCmd(scripts[name], { runtime, cmdName })

      const method = utils.runString.bind(utils.runString, realcmd, {
        runtime,
        cmdName,
        origCmd : scripts[name],
        hookName: name.replace(/(:watch|\[\])/, ''),
      })

      // Promises.all and our shim Promises.series expect a different input
      if (cmd.mode === 'all') {
        methods.push(method())
      } else {
        methods.push(method)
      }
    })

    await Promise[cmd.mode](methods)
    process.exit(0)
  } else if (_.isString(cmd)) {
    const realcmd = utils.formatCmd(cmd, { runtime, cmdName })

    utils.runString(realcmd, { runtime, cmdName, origCmd: cmd, hookName: cmdName.replace(/(:watch|\[\])/, '') }, (err) => {
      if (err) {
        scrolex.failure(`cmdName "${cmdName}" failed with: ${err}.`)
        process.exit(1)
      }
      process.exit(0)
    })
  } else {
    scrolex.failure(`cmdName "${cmdName}" is not a valid Lanyon command. Pick from: ${Object.keys(scripts).join(', ')}.`)
    process.exit(1)
  }
}
