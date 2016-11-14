var shell = require('shelljs')
var semver = require('semver')
var chalk = require('chalk')
var path = require('path')
var debug = require('depurar')('lanyon')
var fs = require('fs')
var _ = require('lodash')
var lanyonDir = __dirname
var projectDir = process.env.PROJECT_DIR || '../..'
var projectPackageFile = path.join(projectDir, '/package.json')
var projectPackage = require(projectPackageFile)
var lanyonPackage = require('./package.json')
var mergedCfg = _.defaults(projectPackage.lanyon || {}, lanyonPackage.lanyon)
var yes = chalk.green('✓ ')
var no = chalk.red('✗ ')
debug({mergedCfg: mergedCfg})

function fatalExe (cmd) {
  var opts = { 'silent': false }
  var p = shell.exec(cmd, opts)

  if (p.code !== 0) {
    console.log(no)
    console.error('Failed to execute: ' + cmd)
    console.error(p.stdout)
    console.error(p.stderr)
    shell.exit(1)
  }

  return p.stdout.trim()
}

var nodeVersionFull = shell.exec('node -v', { 'silent': true }).stdout.trim()
var parts = nodeVersionFull.split(/[\s]+/)
var nodeVersion = parts[0]

var rubyVersionFull = shell.exec('ruby -v', { 'silent': true }).stdout.trim()
var parts = rubyVersionFull.split(/[p\s]+/)
var rubyVersion = parts[1]

var rbenvVersionFull = shell.exec('rbenv -v', { 'silent': true }).stdout.trim()
var parts = rbenvVersionFull.split(/[\s]+/)
var rbenvVersion = parts[1]

var rvmVersionFull = shell.exec('rvm -v', { 'silent': true }).stdout.trim()
var parts = rvmVersionFull.split(/[\s]+/)
var rvmVersion = parts[1]

var rubyExe = 'ruby'

process.stdout.write('==> Checking Node \'' + mergedCfg.nodeSatisfactory + '\' ... ')
if (semver.satisfies(nodeVersion, mergedCfg.nodeSatisfactory)) {
  console.log(yes + nodeVersion + ' (' + nodeVersionFull + ')')
} else {
  console.log(no + nodeVersion + ' (' + nodeVersionFull + ')')
  shell.exit(1)
}

process.stdout.write('==> Checking Ruby \'' + mergedCfg.rubySatisfactory + '\' ... ')
if (semver.satisfies(rubyVersion, mergedCfg.rubySatisfactory)) {
  console.log(yes + rubyVersion + ' (' + rubyVersionFull + ')')
} else {
  console.log(no + rubyVersion + ' (' + rubyVersionFull + ')')
  process.stdout.write('--> Checking rbenv \'' + mergedCfg.rbenvSatisfactory + '\' ... ')
  if (semver.satisfies(rbenvVersion, mergedCfg.rbenvSatisfactory)) {
    console.log(yes + rbenvVersion + ' (' + rbenvVersionFull + ')')
    fatalExe('export PATH="$HOME/.rbenv/bin:$PATH" && eval "$(rbenv init -)" && rbenv install \'' + mergedCfg.rubyDesired + '\'')
    rubyExe = 'export PATH="$HOME/.rbenv/bin:$PATH" && eval "$(rbenv init -)" && rbenv local \'' + mergedCfg.rubyDesired + '\' && ruby'
  } else {
    console.log(no + rbenvVersion + ' (' + rbenvVersionFull + ')')
    process.stdout.write('--> Checking rvm \'' + mergedCfg.rbenvSatisfactory + '\' ... ')
    if (semver.satisfies(rvmVersion, mergedCfg.rvmSatisfactory)) {
      console.log(yes + rvmVersion + ' (' + rvmVersionFull + ')')
    } else {
      console.log(no + rvmVersion + ' (' + rvmVersionFull + ')')
      process.stdout.write('--> Installing rvm \'' + mergedCfg.rvmSatisfactory + '\' ... ')
      fatalExe('curl -sSL https://get.rvm.io | bash -s \'' + mergedCfg.rvmDesired + '\'')
      console.log(yes)
    }
    fatalExe('export PATH="$HOME/.rvm/bin:$PATH" && . $HOME/.rvm/scripts/rvm && rvm install \'' + mergedCfg.rubyDesired + '\'')
    rubyExe = 'export PATH="$HOME/.rvm/bin:$PATH" && . $HOME/.rvm/scripts/rvm && rvm \'' + mergedCfg.rubyDesired + '\' exec'
  }
}

var bundlerPath = path.join(lanyonDir, 'deps', 'bin', 'bundler')
var bundlerVersionFull = shell.exec(rubyExe + ' ' + bundlerPath + ' -v', { 'silent': true }).stdout.trim()
var parts = bundlerVersionFull.split(/[\s]+/)
var bundlerVersion = parts[2]
var bundlerDir = path.dirname(bundlerPath)

process.stdout.write('==> Checking Bundler \'' + mergedCfg.bundlerSatisfactory + '\' ... ')
if (semver.satisfies(bundlerVersion, mergedCfg.bundlerSatisfactory)) {
  console.log(yes + bundlerVersion + ' (' + bundlerVersionFull + ')')
} else {
  console.log(no + bundlerVersion + ' (' + bundlerVersionFull + ')')
  shell.mkdir('-p', bundlerDir)
  fatalExe(rubyExe + ' ' + 'gem install bundler -v \'' + mergedCfg.bundlerDesired + '\' -n ' + bundlerDir)
}

process.stdout.write('==> Configuring Bundler ... ')
fatalExe(rubyExe + ' ' + bundlerPath + ' mergedCfg build.nokogiri --use-system-libraries')
console.log(yes)

process.stdout.write('==> Installing Gems ... ')

var buf = 'source \'https://rubygems.org\'\n'
for (var name in mergedCfg.gems) {
  var version = mergedCfg.gems[name]
  buf += 'gem \'' + name + '\', \'' + version + '\'\n'
}
fs.writeFileSync(path.join(lanyonDir, 'Gemfile'), buf, 'utf-8')

fatalExe(rubyExe + ' ' + bundlerPath + ' install --path \'' + path.join(lanyonDir, 'deps', 'gems') + '\' || ' + rubyExe + ' ' + bundlerPath + ' update')
console.log(yes)

fs.writeFileSync(path.join(lanyonDir, 'deps', 'bin', 'ruby'), rubyExe.trim() + ' "$@"', { 'encoding': 'utf-8', 'mode': '755' })
