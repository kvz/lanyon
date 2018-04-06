module.exports = async function boot () {
  const _              = require('lodash')
  const config         = require('./config')
  const utils          = require('./utils')
  const scrolex        = require('scrolex')
  const async          = require('async')
  const runtime        = config.runtime

  // 'start'                    : 'parallelshell "lanyon build:content:watch" "lanyon build:assets:watch" "lanyon serve"',
  const scripts = {
    'build:assets'       : 'webpack --display-optimization-bailout --config [cacheDir]/webpack.config.js',
    'build:content:watch': 'nodemon --config [cacheDir]/nodemon.config.json --exec "lanyon build:content"',
    'build:content'      : 'jekyll build --verbose --config [cacheDir]/jekyll.config.yml,[cacheDir]/jekyll.lanyon_assets.yml',
    // 'build:images'             : 'imagemin [projectDir]/assets/images --out-dir=[projectDir]/assets/build/images',
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
    'help'   : 'jekyll build --help',
    'serve'  : 'browser-sync start --config [cacheDir]/browsersync.config.js',
    'start'  : {
      'mode'    : 'parallel',
      'commands': [
        'build:content:watch',
        'serve',
      ],
    },
  }

  const cmdName = process.argv[2]
  let cmd       = scripts[cmdName]

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

  // Run Pre-Hooks
  await utils.runhooks('pre', cmdName, runtime)

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
      methods.push(utils.runString.bind(utils.runString, scripts[name], { runtime, cmdName }))
    })

    async[cmd.mode](methods, (err) => {
      if (err) {
        scrolex.failure(`"${cmdName}" failed with: ${err}.`)
        process.exit(1)
      }
    })
  } else if (_.isString(cmd)) {
    utils.runString(cmd, { runtime, cmdName })
  } else {
    scrolex.failure(`"${cmdName}" is not a valid Lanyon command. Pick from: ${Object.keys(scripts).join(', ')}.`)
    process.exit(1)
  }
}
