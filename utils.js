var semver = require('semver')
var chalk = require('chalk')
var shell = require('shelljs')
var no = chalk.red('✗ ')
var yes = chalk.green('✓ ')

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

module.exports.satisfied = function (app, cmd, checkOn) {
  var tag = ''
  if (checkOn === undefined) {
    checkOn = app
  } else {
    tag = checkOn + '/'
  }

  process.stdout.write('--> Checking: ' + tag + app + ' \'' + runtime.prerequisites[app].range + '\' ... ')

  if (optSkip.indexOf(checkOn) !== -1) {
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
