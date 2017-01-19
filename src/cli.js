#!/usr/bin/env node
const utils     = require('./utils')
utils.preferLocalPackage(process.argv, __filename, process.cwd(), 'lanyon', 'lib/cli.js', require('../package.json').version)
const _         = require('lodash')
const config    = require('./config')
const shell     = require('shelljs')
const Scrolex  = require('scrolex')
const runtime   = config.runtime
// var debug = require('depurar')('lanyon')

const scripts = {
  'build:assets'             : 'webpack --config [cacheDir]/webpack.config.js',
  'build:content:incremental': 'jekyll build --incremental --source [projectDir] --destination [contentBuildDir] --verbose --config [projectDir]/_config.yml,[cacheDir]/jekyll.config.yml,[cacheDir]/jekyll.lanyon_assets.yml',
  'build:content:watch'      : 'nodemon --config [cacheDir]/nodemon.config.json --exec "[lanyon] build:content:incremental' + '"',
  'build:content'            : 'jekyll build --source [projectDir] --destination [contentBuildDir] --verbose --config [projectDir]/_config.yml,[cacheDir]/jekyll.config.yml,[cacheDir]/jekyll.lanyon_assets.yml',
  // @todo: useless until we have: https://github.com/imagemin/imagemin-cli/pull/11 and https://github.com/imagemin/imagemin/issues/226
  'build:images'             : 'imagemin [projectDir]/assets/images --out-dir=[projectDir]/assets/build/images',
  'build'                    : '[lanyon] build:assets && [lanyon] build:content', // <-- parrallel won't work for production builds, jekyll needs to copy assets into _site
  'container:connect'        : utils.dockerCmd(runtime, 'sh', '--interactive --tty'),
  'deploy'                   : require('./deploy'),
  'encrypt'                  : require('./encrypt'),
  'help'                     : 'jekyll build --help',
  'list:ghpgems'             : 'bundler exec github-pages versions --gem',
  'postinstall'              : require('./postinstall'),
  'serve'                    : 'browser-sync start --config [cacheDir]/browsersync.config.js',
  'start'                    : '[lanyon] build:assets && [lanyon] build:content:incremental && parallelshell "[lanyon] build:content:watch" "[lanyon] serve"',
}

console.log(`--> cacheDir is "${runtime.cacheDir}". `)
console.log(`--> gitRoot is "${runtime.gitRoot}". `)
console.log(`--> npmRoot is "${runtime.npmRoot}". `)

if (runtime.trace) {
  scripts['build:content:incremental'] += ' --trace'
  scripts['build:content']             += ' --trace'
}

const cmdName = process.argv[2]
let cmd = scripts[cmdName]

// Create asset dirs and git ignores
if (cmdName.match(/^build|postinstall|start/)) {
  utils.initProject(runtime)
}

// Run Hooks
if (cmdName.match(/^build:(assets|content)/)) {
  ['prebuild', 'prebuild:production', 'prebuild:development'].forEach(hook => {
    if (runtime[hook]) {
      const needEnv = hook.split(':')[1]
      if (!needEnv || runtime.lanyonEnv === needEnv) {
        let squashedHooks = runtime[hook]
        if (_.isArray(runtime[hook])) {
          squashedHooks = runtime[hook].join(' && ')
        }
        Scrolex.exe(squashedHooks, { cwd: runtime.projectDir, components: `lanyon>build>${hook}` })
        // console.log(`--> ${hook} done. `)
      }
    }
  })
}

// Write all config files to cacheDir
console.log('--> Writing configs. ')
utils.writeConfig(config)

// Run cmd arg
if (_.isFunction(cmd)) {
  console.log(`--> Running ${cmdName} function. `)
  cmd(runtime, err => {
    if (err) {
      console.error(`${cmdName} function exited with error ${err}`)
      process.exit(1)
    }
    console.log(`--> ${cmdName} done. `)
  })
} else if (_.isString(cmd)) {
  cmd = cmd.replace(/\[lanyon]/g, `node ${__filename}`) // eslint-disable-line no-path-concat
  cmd = cmd.replace(/\[lanyonDir]/g, runtime.lanyonDir)
  cmd = cmd.replace(/\[contentBuildDir]/g, runtime.contentBuildDir)
  cmd = cmd.replace(/\[projectDir]/g, runtime.projectDir)
  cmd = cmd.replace(/\[cacheDir]/g, runtime.cacheDir)

  const npmBins = {
    'browser-sync' : '/node_modules/browser-sync/bin/browser-sync.js',
    'webpack'      : '/node_modules/webpack/bin/webpack.js',
    'imagemin'     : '/node_modules/imagemin-cli/cli.js',
    'nodemon'      : '/node_modules/nodemon/bin/nodemon.js',
    'npm-run-all'  : '/node_modules/npm-run-all/bin/npm-run-all/index.js',
    'parallelshell': '/node_modules/parallelshell/index.js',
  }
  for (const name in npmBins) {
    const tests = [
      runtime.lanyonDir + npmBins[name],
      runtime.gitRoot + npmBins[name],
      runtime.projectDir + npmBins[name],
      `${runtime.projectDir}/..${npmBins[name]}`,
    ]

    let found = false
    tests.forEach(test => {
      if (shell.test('-f', test)) {
        npmBins[name] = test
        found = true
      }
    })

    if (!found) {
      throw new Error(`Cannot find dependency "${name}" in "${tests.join('", "')}"`)
    }
    const pat = new RegExp(`(\\s|^)${name}(\\s|$)`)
    cmd = cmd.replace(pat, `$1node ${npmBins[name]}$2`)
  }

  cmd = cmd.replace(/(\s|^)jekyll(\s|$)/, `$1${runtime.binDir}/jekyll$2`)
  cmd = cmd.replace(/(\s|^)bundler(\s|$)/, `$1${runtime.binDir}/bundler$2`)

  var env = process.env
  env.NODE_ENV       = runtime.lanyonEnv
  env.JEKYLL_ENV     = runtime.lanyonEnv
  env.LANYON_PROJECT = runtime.projectDir // <-- to preserve the cwd over multiple nested executes, if it wasn't initially set

  console.log(`--> Running ${cmdName} shell cmd: "${cmd}"`)
  Scrolex.exe(cmd, {
    mode      : cmdName === 'start' ? 'singlescroll' : 'passthru',
    env       : env,
    cwd       : runtime.cacheDir,
    components: `lanyon>${cmdName}`,
  })
  console.log(`--> ${cmdName} done. `)
} else {
  console.error(`--> "${cmdName}" is not a valid Lanyon command. Pick from: ${Object.keys(scripts).join(', ')}.`)
}
