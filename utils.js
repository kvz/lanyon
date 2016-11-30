var semver = require('semver')
var chalk = require('chalk')
var fs = require('fs')
var path = require('path')
var shell = require('shelljs')
var no = chalk.red('✗ ')
var yes = chalk.green('✓ ')

module.exports.dockerCmd = function (runtime, flags, cmd) {
  return [
    'docker run',
    ' ' + flags,
    ' --rm',
    ' --workdir ' + runtime.cacheDir,
    ' --user $(id -u)',
    ' --volume ' + runtime.cacheDir + ':' + runtime.cacheDir,
    ' --volume ' + runtime.projectDir + ':' + runtime.projectDir,
    ' kevinvz/lanyon:' + runtime.lanyonVersion + '',
    ' ' + cmd
  ].join('')
}

module.exports.initProject = function (runtime) {
  if (!shell.test('-d', runtime.assetsBuildDir)) {
    shell.mkdir('-p', runtime.assetsBuildDir)
    shell.exec('cd ' + path.dirname(runtime.cacheDir) + ' && git ignore ' + path.relative(runtime.projectDir, runtime.assetsBuildDir))
  }
  if (!shell.test('-d', runtime.cacheDir)) {
    shell.mkdir('-p', runtime.cacheDir)
    shell.exec('cd ' + path.dirname(runtime.cacheDir) + ' && git ignore ' + path.relative(runtime.projectDir, runtime.cacheDir))
  }
  if (!shell.test('-d', runtime.binDir)) {
    shell.mkdir('-p', runtime.binDir)
    shell.exec('cd ' + path.dirname(runtime.binDir) + ' && git ignore ' + path.relative(runtime.projectDir, runtime.binDir))
  }
}

module.exports.writeConfig = function (cfg) {
  fs.writeFileSync(cfg.runtime.cacheDir + '/jekyll.config.yml', '', 'utf-8') // <-- nothing yet but a good place to weak Jekyll in the future
  fs.writeFileSync(cfg.runtime.cacheDir + '/nodemon.config.json', JSON.stringify(cfg.nodemon, null, '  '), 'utf-8')
  fs.writeFileSync(cfg.runtime.cacheDir + '/full-config-dump.json', JSON.stringify(cfg, null, '  '), 'utf-8')
  fs.writeFileSync(cfg.runtime.cacheDir + '/browsersync.config.js', 'module.exports = require("' + cfg.runtime.lanyonDir + '/config.js").browsersync', 'utf-8')
  fs.writeFileSync(cfg.runtime.cacheDir + '/webpack.config.js', 'module.exports = require("' + cfg.runtime.lanyonDir + '/config.js").webpack', 'utf-8')
  shell.cp(path.join(cfg.runtime.lanyonDir, 'Dockerfile', path.join(cfg.runtime.cacheDir, 'Dockerfile')))
  var buf = 'source \'https://rubygems.org\'\n'
  for (var name in cfg.runtime.gems) {
    var version = cfg.runtime.gems[name]
    buf += 'gem \'' + name + '\', \'' + version + '\'\n'
  }
  fs.writeFileSync(path.join(cfg.runtime.cacheDir, 'Gemfile'), buf, 'utf-8')
}

module.exports.fatalExe = function (cmd) {
  var opts = { 'silent': true }

  process.stdout.write('--> Executing: ' + cmd + ' ... ')

  var p = shell.exec(cmd, opts)
  if (p.code !== 0) {
    console.log(no)
    console.error('Failed to execute: ' + cmd)
    console.error(p.stdout)
    console.error(p.stderr)
    shell.exit(1)
  }

  console.log(yes)

  return p.stdout.trim()
}

module.exports.satisfied = function (runtime, app, cmd, checkOn) {
  var tag = ''
  if (checkOn === undefined) {
    checkOn = app
  } else {
    tag = checkOn + '/'
  }

  process.stdout.write('--> Checking: ' + tag + app + ' \'' + runtime.prerequisites[app].range + '\' ... ')

  if (runtime.rubyProvidersSkip.indexOf(checkOn) !== -1) {
    console.log(no + ' (disabled via LANYON_SKIP)')
    return false
  }

  if (!cmd) {
    cmd = app + ' -v'
  }

  var appVersionFull = shell.exec(cmd, { 'silent': false }).stdout.trim()
  var parts = appVersionFull.split(/[,p\s-]+/)
  var appVersion = parts[1]

  if (app === 'node') {
    appVersion = parts[0]
  } else if (app === 'bundler') {
    appVersion = parts[2]
  } else if (app === 'docker') {
    appVersion = parts[2]
  }

  try {
    if (semver.satisfies(appVersion, runtime.prerequisites[app].range)) {
      console.log(yes + appVersion + ' (' + appVersionFull + ')')
      return true
    }
  } catch (e) {
    console.log(no + appVersion + ' (' + appVersionFull + ')' + e)
    return false
  }

  console.log(no + appVersion + ' (' + appVersionFull + ')')
  return false
}
