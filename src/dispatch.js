module.exports = async function dispatch () {
  const _       = require('lodash')
  const config  = require('./config')
  const utils   = require('./utils')
  const scrolex = require('scrolex')
  const async   = require('async')
  const runtime = config.runtime
  const cmdName = process.argv[2]

  let buildCmd = '[jekyll] build --verbose --config [cacheDir]/jekyll.config.yml,[cacheDir]/jekyll.lanyon_assets.yml'
  let formattedBuildCmd = utils.formatCmd(buildCmd, { runtime, cmdName })
  // console.log(formattedBuildCmd)

  let postBuildContentHooks = utils.gethooks('post', 'build:content', runtime)

  const scripts = {
    'build:assets'       : '[webpack] --display-optimization-bailout --config [cacheDir]/webpack.config.js',
    'build:content:watch': `env DEBUG=nodemon:* [nodemon] --config [cacheDir]/nodemon.config.json --exec '${formattedBuildCmd} && ${postBuildContentHooks}'`,
    // 'build:content:watch': '[jekyll] build --watch --verbose --force_polling --config [cacheDir]/jekyll.config.yml,[cacheDir]/jekyll.lanyon_assets.yml',
    'build:content'      : buildCmd,
    // 'build:images'             : '[imagemin] [projectDir]/assets/images --out-dir=[projectDir]/assets/build/images',
    // @todo: useless until we have: https://github.com/imagemin/imagemin-cli/pull/11 and https://github.com/imagemin/imagemin/issues/226
    'build'              : {
      'mode'    : 'series', // <-- parrallel won't work for production builds, jekyll needs to copy assets into _site
      'commands': [
        'build:assets',
        'build:content',
      ],
    },
    'deploy' : require(`./deploy`),
    'encrypt': require(`./encrypt`),
    'help'   : '[jekyll] build --help',
    'serve'  : '[browser-sync] start --config [cacheDir]/browsersync.config.js',
    'start'  : {
      'mode'    : 'parallel',
      'commands': [
        'build:content:watch',
        'serve',
      ],
    },
  }

  let cmd = scripts[cmdName]

  scrolex.persistOpts({
    announce             : true,
    addCommandAsComponent: true,
    components           : `lanyon>${cmdName}`,
    env                  : Object.assign({}, process.env, {
      DEBUG         : process.env.DEBUG,
      NODE_ENV      : runtime.lanyonEnv,
      JEKYLL_ENV    : runtime.lanyonEnv,
      LANYON_PROJECT: runtime.projectDir, // <-- to preserve the cwd over multiple nested executes, if it wasn't initially setly set
    }),
  })

  if (require.main === module) {
    scrolex.failure(`Please only used this module via require`)
    process.exit(1)
  }

  scrolex.stick(`Booting Lanyon->${cmdName}. Version: ${runtime.lanyonVersion} on PID: ${process.pid} from: ${__filename}`)

  for (let key of Object.keys(runtime).sort()) {
    scrolex.stick(`Detected ${key} as "${runtime[key]}"`)
  }

  // Create asset dirs and git ignores
  if (cmdName.match(/^build|start/)) {
    utils.initProject(runtime)
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
  } else if (_.isObject(cmd)) {
    // Execute multiple commands, in paralel or serial
    let methods = []

    cmd.commands.forEach((name) => {
      let realcmd = utils.formatCmd(scripts[name], { runtime, cmdName })
      methods.push(utils.runString.bind(utils.runString, realcmd, { runtime, cmdName, origCmd: scripts[name], hookName: name.replace(/(:watch|\[\])/, '') }))
    })

    async[cmd.mode](methods, (err) => {
      if (err) {
        scrolex.failure(`"${cmdName}" failed with: ${err}.`)
        process.exit(1)
      }
    })
  } else if (_.isString(cmd)) {
    let realcmd = utils.formatCmd(cmd, { runtime, cmdName })
    utils.runString(realcmd, { runtime, cmdName, origCmd: cmd, hookName: cmdName.replace(/(:watch|\[\])/, '') })
  } else {
    scrolex.failure(`"${cmdName}" is not a valid Lanyon command. Pick from: ${Object.keys(scripts).join(', ')}.`)
    process.exit(1)
  }
}
