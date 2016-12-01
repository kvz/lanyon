#!/usr/bin/env node
var utils = require('./utils')
utils.preferLocalPackage(process.argv, __filename, process.cwd(), 'lanyon', 'cli.js', require('./package.json').version)
var _ = require('lodash')
var config = require('./config')
var shell = require('shelljs')
var runtime = config.runtime
// var debug = require('depurar')('lanyon')

var scripts = {
  'build:assets': 'webpack --config [cacheDir]/webpack.config.js',
  'build:content:incremental': 'jekyll build --incremental --source [projectDir] --destination [contentBuildDir] --verbose --config [projectDir]/_config.yml,[cacheDir]/jekyll.config.yml',
  'build:content': 'jekyll build --source [projectDir] --destination [contentBuildDir] --verbose --config [projectDir]/_config.yml,[cacheDir]/jekyll.config.yml',
  'build': '[lanyon] build:assets && [lanyon] build:content', // <-- parrallel won't work for production builds, jekyll needs to copy assets into _site
  'help': 'jekyll build --help',
  'postinstall': require('./postinstall'),
  'deploy': require('./deploy'),
  'encrypt': require('./encrypt'),
  'serve': 'browser-sync start --config [cacheDir]/browsersync.config.js',
  'start': '[lanyon] build:content:incremental && parallelshell "[lanyon] build:content:watch" "[lanyon] serve"',
  'build:content:watch': 'nodemon --config [cacheDir]/nodemon.config.json --exec "[lanyon] build:content:incremental' + '"'
}

console.log('--> cacheDir is "' + runtime.cacheDir + '". ')

if (runtime.lanyonEnv !== 'development') {
  scripts['build:assets'] += ' --production'
}
if (runtime.trace) {
  scripts['build:content:incremental'] += ' --trace'
  scripts['build:content'] += ' --trace'
}

var cmdName = process.argv[2]
var cmd = scripts[cmdName]

if (cmdName.match(/^build|postinstall/)) {
  utils.initProject(runtime)
}

if (cmdName.match(/^build/)) {
  ['prebuild', 'prebuild:production', 'prebuild:development'].forEach(function (hook) {
    if (runtime[hook]) {
      var needEnv = hook.split(':')[1]
      if (!needEnv || runtime.lanyonEnv === needEnv) {
        console.log('--> Running ' + hook + ': ' + runtime[hook])
        utils.passthru(runtime, 'cd ' + runtime.projectDir + ' && ' + runtime[hook], { 'env': env })
        console.log('--> ' + hook + ' done. ')
      }
    }
  })
}

utils.writeConfig(config)

if (_.isFunction(cmd)) {
  cmd(runtime, function (err) {
    if (err) {
      console.error(cmdName + ' function exited with error ' + err)
      process.exit(1)
    }
    console.log('--> ' + cmdName + ' done. ')
  })
} else if (_.isString(cmd)) {
  cmd = cmd.replace(/\[lanyon]/g, 'node ' + __filename) // eslint-disable-line no-path-concat
  cmd = cmd.replace(/\[lanyonDir]/g, runtime.lanyonDir)
  cmd = cmd.replace(/\[contentBuildDir]/g, runtime.contentBuildDir)
  cmd = cmd.replace(/\[projectDir]/g, runtime.projectDir)
  cmd = cmd.replace(/\[cacheDir]/g, runtime.cacheDir)

  var npmBins = {
    'browser-sync': '/node_modules/browser-sync/bin/browser-sync.js',
    'webpack': '/node_modules/webpack/bin/webpack.js',
    'nodemon': '/node_modules/nodemon/bin/nodemon.js',
    'npm-run-all': '/node_modules/npm-run-all/bin/npm-run-all/index.js',
    'parallelshell': '/node_modules/parallelshell/index.js'
  }
  for (var name in npmBins) {
    if (shell.test('-f', runtime.lanyonDir + npmBins[name])) {
      npmBins[name] = runtime.lanyonDir + npmBins[name]
    } else if (shell.test('-f', runtime.gitRoot + npmBins[name])) {
      npmBins[name] = runtime.gitRoot + npmBins[name]
    } else if (shell.test('-f', runtime.projectDir + npmBins[name])) {
      npmBins[name] = runtime.projectDir + npmBins[name]
    } else {
      throw new Error('Cannot find dependency ' + name + ' in ' + runtime.lanyonDir + npmBins[name] + ' or ' + runtime.gitRoot + npmBins[name])
    }

    var pat = new RegExp('(\\s|^)' + name + '(\\s|$)')
    cmd = cmd.replace(pat, '$1' + 'node ' + npmBins[name] + '$2')
  }

  cmd = cmd.replace(/(\s|^)jekyll(\s|$)/, '$1' + runtime.binDir + '/jekyll$2')

  var env = process.env
  env.NODE_ENV = runtime.lanyonEnv
  env.JEKYLL_ENV = runtime.lanyonEnv
  env.LANYON_PROJECT = runtime.projectDir // <-- to preserve the cwd over multiple nested executes, if it wasn't initially set

  console.log('--> Running cmd: ' + cmd)
  utils.passthru(runtime, cmd, {'env': env})
  console.log('--> ' + cmdName + ' done. ')
} else {
  console.error('--> "' + cmdName + '" is not a valid Lanyon command. Pick from: ' + Object.keys(scripts).join(', ') + '.')
}
