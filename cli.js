#!/usr/bin/env node
var utils = require('./utils')
utils.preferLocalPackage(process.argv, __filename, process.cwd(), 'lanyon', 'cli.js')
var spawnSync = require('child_process').spawnSync
var _ = require('lodash')
var config = require('./config')
var runtime = config.runtime
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

console.log('--> cacheDir is "' + runtime.cacheDir + '". ')

if (cmdName.match(/^build|postinstall/)) {
  utils.initProject(runtime)
}

if (cmdName.match(/^build/) && runtime.prebuild) {
  console.log('--> Running prebuild: ' + runtime.prebuild)
  spawnSync('sh', ['-c', 'cd ' + runtime.projectDir + ' && ' + runtime.prebuild], {
    'stdio': 'inherit',
    'env': env,
    'cwd': runtime.cacheDir // <-- @todo: leading to: Error: ENOENT: no such file or directory, open '/Users/kvz/code/frey-website/node_modules/lanyon/.lanyon/jekyll.config.yml'
  })
  console.log('--> prebuild done. ')
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
  console.log('--> ' + cmdName + ' done. ')
} else {
  console.error('--> "' + cmdName + '" is not a valid Lanyon command. Pick from: ' + Object.keys(scripts).join(', ') + '.')
}
