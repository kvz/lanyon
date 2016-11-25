#!/usr/bin/env node
process.env.DEBUG = process.env.LANYON_DEBUG
var spawn = require('child_process').spawn
var fs = require('fs')
var shell = require('shelljs')
var cfg = require('.')
var runtime = cfg.runtime
var nodemon = cfg.nodemon
var debug = require('depurar')('lanyon')
var rimraf = require('rimraf')

var scripts = {
  'build:assets': 'webpack',
  'build:content:incremental': 'jekyll build --incremental --source [projectDir] --destination [contentBuildDir] --config [projectDir]/_config.yml,[lanyonDir]/_config.dev.yml',
  'build:content': 'jekyll build --source [projectDir] --destination [contentBuildDir] --config [projectDir]/_config.yml,[lanyonDir]/_config.dev.yml',
  'build': 'parallelshell "[lanyon] build:content" "[lanyon] build:assets"',
  'console': 'docker run -i -t kevinvz/lanyon sh',
  'help': 'jekyll build --help',
  'postinstall': 'node [lanyonDir]/postinstall.js',
  'serve': 'browser-sync start --config [lanyonDir]/browsersync.config.js',
  'start': '[lanyon] build:content:incremental && parallelshell "[lanyon] rebuild:content" "[lanyon] serve"',
  'rebuild:content': 'nodemon --config [lanyonDir]/nodemon.config.json --exec "[lanyon] build:content:incremental' + '"'
}

var cmdName = process.argv[2]
var cmd = scripts[cmdName]

if (!cmd) {
  console.error('"' + cmdName + '" is not a valid Lanyon command. Pick from: ' + Object.keys(scripts).join(', ') + '.')
}

function isDev () {
  return runtime.lanyonEnv === 'development'
}

fs.writeFileSync(runtime.lanyonDir + '/nodemon.config.json', JSON.stringify(nodemon, null, '  '), 'utf-8')
fs.writeFileSync(runtime.lanyonDir + 'fullthing.json', JSON.stringify(cfg, null, '  '), 'utf-8')
debug(cfg)

if (cmdName.match(/^build/)) {
  shell.mkdir('-p', runtime.assetsBuildDir)

  if (!isDev()) {
    rimraf.sync(runtime.assetsBuildDir + '/' + '!(images|favicon.ico)')
  }
}

var env = process.env
env.DEBUG = runtime.lanyonDebugStr
env.NODE_ENV = runtime.lanyonEnv
env.JEKYLL_ENV = runtime.lanyonEnv
env.LANYON_PROJECT = runtime.projectDir // <-- to preserve the cwd over multiple nested executes, if it wasn't initially set

cmd = cmd.replace(/\[lanyon]/g, 'node ' + __filename)
cmd = cmd.replace(/\[lanyonDir]/g, runtime.lanyonDir)
cmd = cmd.replace(/\[contentBuildDir]/g, runtime.contentBuildDir)
cmd = cmd.replace(/\[projectDir]/g, runtime.projectDir)
cmd = cmd.replace(/^browser-sync /, runtime.lanyonDir + '/node_modules/.bin/browser-sync ')
cmd = cmd.replace(/^webpack /, runtime.lanyonDir + '/node_modules/.bin/webpack ')
cmd = cmd.replace(/^nodemon /, runtime.lanyonDir + '/node_modules/.bin/nodemon ')
cmd = cmd.replace(/^npm-run-all /, runtime.lanyonDir + '/node_modules/.bin/npm-run-all ')
cmd = cmd.replace(/^jekyll /, runtime.lanyonDir + '/vendor/bin/jekyll ')

console.log(cmd)
var child = spawn('sh', ['-c', cmd], {
  'stdio': 'inherit',
  'env': env,
  'cwd': __dirname
})

child.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Child exited with code ${code}`)
    process.exit(1)
  }
  console.log(`Done. `)
})
