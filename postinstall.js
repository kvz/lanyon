var shell = require('shelljs')
var semver = require('semver')
var chalk = require('chalk')
var path = require('path')
var fs = require('fs')
var yes = chalk.green('✓ ')
var no = chalk.red('✗ ')

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

var config = require('./package.json').lanyon

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

var bundlerPath = path.join(__dirname, 'deps', 'bin', 'bundler')
var bundlerVersionFull = shell.exec(bundlerPath + ' -v', { 'silent': true }).stdout.trim()
var parts = bundlerVersionFull.split(/[\s]+/)
var bundlerVersion = parts[2]
var bundlerDir = path.dirname(bundlerPath)

var rubyExe = 'ruby'

process.stdout.write('==> Checking Node \'' + config.nodeSatisfactory + '\' ... ')
if (semver.satisfies(nodeVersion, config.nodeSatisfactory)) {
  console.log(yes + nodeVersion + ' (' + nodeVersionFull + ')')
} else {
  console.log(no + nodeVersion + ' (' + nodeVersionFull + ')')
  shell.exit(1)
}

process.stdout.write('==> Checking Ruby \'' + config.rubySatisfactory + '\' ... ')
if (semver.satisfies(rubyVersion, config.rubySatisfactory)) {
  console.log(yes + rubyVersion + ' (' + rubyVersionFull + ')')
} else {
  console.log(no + rubyVersion + ' (' + rubyVersionFull + ')')
  process.stdout.write('--> Checking rbenv \'' + config.rbenvSatisfactory + '\' ... ')
  if (semver.satisfies(rbenvVersion, config.rbenvSatisfactory)) {
    console.log(yes + rbenvVersion + ' (' + rbenvVersionFull + ')')
    fatalExe('export PATH="$HOME/.rbenv/bin:$PATH" && eval "$(rbenv init -)" && rbenv install \'' + config.rubyDesired + '\'')
    rubyExe = 'export PATH="$HOME/.rbenv/bin:$PATH" && eval "$(rbenv init -)" && rbenv local \'' + config.rubyDesired + '\' && ruby'
  } else {
    console.log(no + rbenvVersion + ' (' + rbenvVersionFull + ')')
    process.stdout.write('--> Checking rvm \'' + config.rbenvSatisfactory + '\' ... ')
    if (semver.satisfies(rvmVersion, config.rvmSatisfactory)) {
      console.log(yes + rvmVersion + ' (' + rvmVersionFull + ')')
    } else {
      console.log(no + rvmVersion + ' (' + rvmVersionFull + ')')
      process.stdout.write('--> Installing rvm \'' + config.rvmSatisfactory + '\' ... ')
      fatalExe('curl -sSL https://get.rvm.io | bash -s \'' + config.rvmDesired + '\'')
      console.log(yes)
    }
    fatalExe('export PATH="$PATH:$HOME/.rvm/bin" && . $HOME/.rvm/scripts/rvm && rvm install \'' + config.rubyDesired + '\'')
    rubyExe = 'export PATH="$PATH:$HOME/.rvm/bin" && . $HOME/.rvm/scripts/rvm && rvm \'' + config.rubyDesired + '\' exec'
  }
}

process.stdout.write('==> Checking Bundler \'' + config.bundlerSatisfactory + '\' ... ')
if (semver.satisfies(bundlerVersion, config.bundlerSatisfactory)) {
  console.log(yes + bundlerVersion + ' (' + bundlerVersionFull + ')')
} else {
  console.log(no + bundlerVersion + ' (' + bundlerVersionFull + ')')
  shell.mkdir('-p', bundlerDir)
  fatalExe(rubyExe + ' ' + 'gem install bundler -v \'' + config.bundlerDesired + '\' -n ' + bundlerDir)
}

process.stdout.write('==> Configuring Bundler ... ')
fatalExe(rubyExe + ' ' + bundlerPath + ' config build.nokogiri --use-system-libraries')
console.log(yes)

process.stdout.write('==> Installing Gems ... ')

var buf = 'source \'https://rubygems.org\'\n'
for (var name in config.gems) {
  var version = config.gems[name]
  buf += 'gem \'' + name + '\', \'' + version + '\'\n'
}
fs.writeFileSync(path.join(__dirname, 'Gemfile'), buf, 'utf-8')

fatalExe(rubyExe + ' ' + bundlerPath + ' install --path \'' + path.join(__dirname, 'deps', 'gems') + '\' || ' + rubyExe + ' ' + bundlerPath + ' update')
console.log(yes)

fs.writeFileSync(path.join(__dirname, 'deps', 'bin', 'ruby'), rubyExe.trim() + ' "$@"', { 'encoding': 'utf-8', 'mode': '755' })
