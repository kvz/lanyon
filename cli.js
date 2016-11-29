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
    var cmd = args.shift()
    for (var i in args) {
      if (args[i] === __filename) {
        args[i] = './node_modules/lanyon/cli.js'
      }
    }
    var spawnSync = require('child_process').spawnSync
    spawnSync(cmd, args, { stdio: 'inherit' })
    process.exit(0)
  }
}

var spawn = require('child_process').spawn
var fs = require('fs')
var path = require('path')
var shell = require('shelljs')
var cfg = require('./index')
var runtime = cfg.runtime
var nodemon = cfg.nodemon
var debug = require('depurar')('lanyon')

var scripts = {
  'build:assets': 'webpack --config [cacheDir]/webpack.config.js',
  'build:content:incremental': 'jekyll build --incremental --source [projectDir] --destination [contentBuildDir] --config [projectDir]/_config.yml,[cacheDir]/jekyll.config.yml',
  'build:content': 'jekyll build --source [projectDir] --destination [contentBuildDir] --config [projectDir]/_config.yml,[cacheDir]/jekyll.config.yml',
  'build': '[lanyon] build:assets && [lanyon] build:content', // <-- parrallel won't work for production builds, jekyll needs to copy assets into _site
  'console': 'docker run -i -t kevinvz/lanyon sh',
  'help': 'jekyll build --help',
  'postinstall': 'node [lanyonDir]/postinstall.js',
  'serve': 'browser-sync start --config [cacheDir]/browsersync.config.js',
  'start': '[lanyon] build:content:incremental && parallelshell "[lanyon] build:content:watch" "[lanyon] serve"',
  'build:content:watch': 'nodemon --config [cacheDir]/nodemon.config.json --exec "[lanyon] build:content:incremental' + '"'
}

var cmdName = process.argv[2]
var cmd = scripts[cmdName]

if (!cmd) {
  console.error('"' + cmdName + '" is not a valid Lanyon command. Pick from: ' + Object.keys(scripts).join(', ') + '.')
}

fs.writeFileSync(runtime.cacheDir + '/jekyll.config.yml', '', 'utf-8') // <-- nothing yet but a good place to weak Jekyll in the future
fs.writeFileSync(runtime.cacheDir + '/nodemon.config.json', JSON.stringify(nodemon, null, '  '), 'utf-8')
fs.writeFileSync(runtime.cacheDir + '/full-config-dump.json', JSON.stringify(cfg, null, '  '), 'utf-8')
fs.writeFileSync(runtime.cacheDir + '/browsersync.config.js', 'module.exports = require("' + runtime.lanyonDir + '/index.js").browsersync', 'utf-8')
fs.writeFileSync(runtime.cacheDir + '/webpack.config.js', 'module.exports = require("' + runtime.lanyonDir + '/index.js").webpack', 'utf-8')

if (cmdName.match(/^build/)) {
  if (!shell.test('-d', runtime.assetsBuildDir)) {
    shell.mkdir('-p', runtime.assetsBuildDir)
    shell.exec('cd ' + path.dirname(runtime.cacheDir) + ' && git ignore ' + path.relative(runtime.projectDir, runtime.assetsBuildDir))
  }
  if (!shell.test('-d', runtime.cacheDir)) {
    shell.mkdir('-p', runtime.cacheDir)
    shell.exec('cd ' + path.dirname(runtime.cacheDir) + ' && git ignore ' + path.relative(runtime.projectDir, runtime.cacheDir))
  }

  if (runtime.prebuild) {
    console.log('--> Running prebuild: ' + runtime.prebuild)
    shell.exec('cd ' + runtime.projectDir + ' && ' + runtime.prebuild)
  }
}

var env = process.env
env.NODE_ENV = runtime.lanyonEnv
env.JEKYLL_ENV = runtime.lanyonEnv
env.LANYON_PROJECT = runtime.projectDir // <-- to preserve the cwd over multiple nested executes, if it wasn't initially set

cmd = cmd.replace(/\[lanyon]/g, 'node ' + __filename)
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

console.log('--> Running cmd: ' + cmd)
var child = spawn('sh', ['-c', cmd], {
  'stdio': 'inherit',
  'env': env,
  'cwd': runtime.cacheDir
})

child.on('exit', function (code) {
  if (code !== 0) {
    console.error('Child exited with code ' + code)
    process.exit(1)
  }
  console.log('Done. ')
})
