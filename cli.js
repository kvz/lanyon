#!/usr/bin/env node
// Switch to a local lanyon install if available
var localLanyonPackage
try {
  localLanyonPackage = require('./node_modules/lanyon/package.json')
} catch (e) {
  localLanyonPackage = {}
} finally {
  if (localLanyonPackage.version) {
    console.log('--> Switching to local lanyon install v' + localLanyonPackage.version)
    var args = process.argv
    var exe = args.shift()
    for (var i in args) {
      if (args[i] === __filename) {
        args[i] = './node_modules/lanyon/cli.js'
      }
    }
    var spawnSync = require('child_process').spawnSync
    spawnSync(exe, args, { stdio: 'inherit' })
    process.exit(0)
  }
}

var spawnSync = require('child_process').spawnSync
var _ = require('underscore')
var cfg = require('./config')
var utils = require('./utils')
var runtime = cfg.runtime
// var debug = require('depurar')('lanyon')

var scripts = {
  'build:assets': 'webpack --config [cacheDir]/webpack.config.js',
  'build:content:incremental': 'jekyll build --incremental --source [projectDir] --destination [contentBuildDir] --config [projectDir]/_config.yml,[cacheDir]/jekyll.config.yml',
  'build:content': 'jekyll build --source [projectDir] --destination [contentBuildDir] --config [projectDir]/_config.yml,[cacheDir]/jekyll.config.yml',
  'build': '[lanyon] build:assets && [lanyon] build:content', // <-- parrallel won't work for production builds, jekyll needs to copy assets into _site
  'help': 'jekyll build --help',
  'postinstall': require('./postinstall'),
  'serve': 'browser-sync start --config [cacheDir]/browsersync.config.js',
  'start': '[lanyon] build:content:incremental && parallelshell "[lanyon] build:content:watch" "[lanyon] serve"',
  'build:content:watch': 'nodemon --config [cacheDir]/nodemon.config.json --exec "[lanyon] build:content:incremental' + '"'
}

var cmdName = process.argv[2]
var cmd = scripts[cmdName]

utils.writeConfig(cfg)
if (cmdName.match(/^build/)) {
  utils.initProject(runtime)

  if (runtime.prebuild) {
    console.log('--> Running prebuild: ' + runtime.prebuild)
    spawnSync('sh', ['-c', 'cd ' + runtime.projectDir + ' && ' + runtime.prebuild], {
      'stdio': 'inherit',
      'env': env,
      'cwd': runtime.cacheDir // <-- @todo: leading to: Error: ENOENT: no such file or directory, open '/Users/kvz/code/frey-website/node_modules/lanyon/.lanyon/jekyll.config.yml'
    })
    console.log('--> prebuild done. ')
  }
}

if (_.isFunction(cmd)) {
  cmd(runtime, function (err) {
    if (err) {
      console.error(cmdName + ' function exited with error ' + err)
      process.exit(1)
    }
    console.log('--> ' + cmdName + 'done. ')
  })
} else if (_.isString(cmd)) {
  cmd = cmd.replace(/\[lanyon]/g, 'node ' + __filename) // eslint-disable-line no-path-concat
  cmd = cmd.replace(/\[lanyonDir]/g, runtime.lanyonDir)
  cmd = cmd.replace(/\[contentBuildDir]/g, runtime.contentBuildDir)
  cmd = cmd.replace(/\[projectDir]/g, runtime.projectDir)
  cmd = cmd.replace(/\[cacheDir]/g, runtime.cacheDir)
  cmd = cmd.replace(/(\s|^)browser-sync(\s|$)/, '$1' + runtime.lanyonDir + '/node_modules/.bin/browser-sync$2')
  cmd = cmd.replace(/(\s|^)webpack(\s|$)/, '$1' + runtime.lanyonDir + '/node_modules/.bin/webpack$2')
  cmd = cmd.replace(/(\s|^)nodemon(\s|$)/, '$1' + runtime.lanyonDir + '/node_modules/.bin/nodemon$2')
  cmd = cmd.replace(/(\s|^)npm-run-all(\s|$)/, '$1' + runtime.lanyonDir + '/node_modules/.bin/npm-run-all$2')
  cmd = cmd.replace(/(\s|^)parallelshell(\s|$)/, '$1' + runtime.lanyonDir + '/node_modules/.bin/parallelshell$2')
  cmd = cmd.replace(/(\s|^)jekyll(\s|$)/, '$1' + runtime.cacheDir + '/vendor/bin/jekyll$2')

  var env = process.env
  env.NODE_ENV = runtime.lanyonEnv
  env.JEKYLL_ENV = runtime.lanyonEnv
  env.LANYON_PROJECT = runtime.projectDir // <-- to preserve the cwd over multiple nested executes, if it wasn't initially set

  console.log('--> Running cmd: ' + cmd)
  spawnSync('sh', ['-c', cmd], {
    'stdio': 'inherit',
    'env': env,
    'cwd': runtime.cacheDir // <-- @todo: leading to: Error: ENOENT: no such file or directory, open '/Users/kvz/code/frey-website/node_modules/lanyon/.lanyon/jekyll.config.yml'
  })
  console.log('--> ' + cmdName + 'done. ')
} else {
  console.error('--> "' + cmdName + '" is not a valid Lanyon command. Pick from: ' + Object.keys(scripts).join(', ') + '.')
}
