module.exports = async function boot () {
  const _              = require('lodash')
  const config         = require('./config')
  const utils          = require('./utils')
  const fs             = require('fs')
  const asyncMapValues = require('async/mapValues')
  const scrolex        = require('scrolex')
  const oneLine        = require('common-tags/lib/oneLine')
  const pad            = require('pad')
  const runtime        = config.runtime

  // 'start'                    : 'parallelshell "lanyon build:content:watch" "lanyon build:assets:watch" "lanyon serve"',
  const scripts = {
    // assets:watch is typically handled via browsersync middleware, so this is more for debugging purposes:
    'build:assets:watch' : 'webpack --display-optimization-bailout --watch --config [cacheDir]/webpack.config.js',
    'build:assets'       : 'webpack --display-optimization-bailout --config [cacheDir]/webpack.config.js',
    'build:content:watch': 'nodemon --config [cacheDir]/nodemon.config.json --exec "lanyon build:content"',
    'build:content'      : 'jekyll build --config [cacheDir]/jekyll.config.yml,[cacheDir]/jekyll.lanyon_assets.yml',
    // 'build:images'             : 'imagemin [projectDir]/assets/images --out-dir=[projectDir]/assets/build/images',
    // @todo: useless until we have: https://github.com/imagemin/imagemin-cli/pull/11 and https://github.com/imagemin/imagemin/issues/226
    'build'              : 'lanyon build:assets && lanyon build:content', // <-- parrallel won't work for production builds, jekyll needs to copy assets into _site
    'deploy'             : require(`./deploy`),
    'encrypt'            : require(`./encrypt`),
    'help'               : 'jekyll build --help',
    'serve'              : 'browser-sync start --config [cacheDir]/browsersync.config.js',
    'start'              : 'parallelshell "lanyon build:content:watch" "lanyon serve"',
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
  } else if (_.isString(cmd)) {
    // Replace dirs
    cmd = cmd.replace(/\[lanyonDir]/g, runtime.lanyonDir)
    cmd = cmd.replace(/\[contentBuildDir]/g, runtime.contentBuildDir)
    cmd = cmd.replace(/\[projectDir]/g, runtime.projectDir)
    cmd = cmd.replace(/\[cacheDir]/g, runtime.cacheDir)

    // Replace all npms with their first-found full-path executables
    const npmBins = {
      'browser-sync' : 'node_modules/browser-sync/bin/browser-sync.js',
      'lanyon'       : 'node_modules/lanyon/src/cli.js',
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

      if (name === 'lanyon') {
        tests.push(`${__dirname}/cli.js`)
      }

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

    let extraVolumes = ''
    if (runtime.contentBuildDir.indexOf(runtime.projectDir) === -1) {
      extraVolumes = `--volume ${runtime.contentBuildDir}:${runtime.contentBuildDir}`
    }

    // cp -f ${runtime.projectDir}/Gemfile ${runtime.cacheDir}/Gemfile &&
    let jekyllBin = oneLine`
      docker run
        --rm
        -i
        --workdir ${runtime.cacheDir}
        --volume ${runtime.cacheDir}/srv-jekyll:/srv/jekyll
        --volume ${runtime.cacheDir}:${runtime.cacheDir}
        --volume ${runtime.projectDir}:${runtime.projectDir}
        ${extraVolumes}
        kevinvz/lanyon:0.0.109
        jekyll
    `

    // Replace shims
    cmd = cmd.replace(/(\s|^)jekyll(\s|$)/, `$1${jekyllBin}$2`)

    if (cmdName.match(/(^start|^deploy|^build$)/)) {
      // Show versions
      let versionMapping = {
        webpack: `node ${npmBins.webpack} -v`,
        nodemon: `node ${npmBins.nodemon} -v`,
        jekyll : `${jekyllBin} -v`,
      }
      try {
        asyncMapValues(versionMapping, function (cmd, key, callback) {
          scrolex.exe(cmd, { mode: 'silent', cwd: runtime.cacheDir }, callback)
        }, (err, stdouts) => {
          if (err) {
            return scrolex.failure(err)
          }
          for (let app in stdouts) {
            let version = stdouts[app].split(/\s+/).pop()
            scrolex.stick(`On ${pad(app, 7)}: v${version}`)
          }
        })
      } catch (e) {
        return scrolex.failure(e)
      }
    }

    scrolex.exe(cmd, scrolexOpts, async (err, out) => { // eslint-disable-line handle-callback-err
      // Run Post-Hooks
      await utils.runhooks('post', cmdName, runtime)
    })
  } else {
    scrolex.failure(`"${cmdName}" is not a valid Lanyon command. Pick from: ${Object.keys(scripts).join(', ')}.`)
    process.exit(1)
  }
}
