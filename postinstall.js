var shell = require('shelljs')
var semver = require('semver')
var chalk = require('chalk')
var path = require('path')
var fs = require('fs')
var yes = chalk.green('✓ ')
var no = chalk.red('✗ ')

function fatalExe (cmd) {
  var opts = { 'silent': true }
  var p = shell.exec(cmd, opts)

  if (p.code !== 0) {
    console.log(no)
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

var rvmVersionFull = shell.exec('rvm -v', { 'silent': true }).stdout.trim()
var parts = rvmVersionFull.split(/[\s]+/)
var rvmVersion = parts[1]

var bundlerPath = __dirname + '/deps/bin/bundler'
var bundlerVersionFull = shell.exec(bundlerPath + ' -v', { 'silent': true }).stdout.trim()
var parts = bundlerVersionFull.split(/[\s]+/)
var bundlerVersion = parts[2]
var bundlerDir = path.dirname(bundlerPath)

process.stdout.write('==> Checking Node \'' + config.nodeSatisfactory + '\' ... ')
if (semver.satisfies(nodeVersion, config.nodeSatisfactory)) {
  console.log(yes + nodeVersion + ' (' + nodeVersionFull + ')')
} else {
  console.log(no + nodeVersion + ' (' + nodeVersionFull + ')')
}

process.stdout.write('==> Checking Ruby \'' + config.rubySatisfactory + '\' ... ')
if (semver.satisfies(rubyVersion, config.rubySatisfactory)) {
  console.log(yes + rubyVersion + ' (' + rubyVersionFull + ')')
} else {
  console.log(no + rubyVersion + ' (' + rubyVersionFull + ')')
  process.stdout.write('--> Checking rvm \'' + config.rvmSatisfactory + '\' ... ')
  if (semver.satisfies(rvmVersion, config.rvmSatisfactory)) {
    console.log(yes + rvmVersion + ' (' + rvmVersionFull + ')')
  } else {
    console.log(no + rvmVersion + ' (' + rvmVersionFull + ')')
    if (shell.test('-f', '/etc/apt/sources.list').code === 0) {
      process.stdout.write('--> Setting up GPG for rvm ' + config.rvmSatisfactory + ' ... ')
      fatalExe('gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3')
      console.log(yes)
    }
    process.stdout.write('--> Installing rvm \'' + config.rvmSatisfactory + '\' ... ')
    fatalExe('curl -sSL https://get.rvm.io | bash -s \'' + config.rvmDesired + '\'')
    console.log(yes)
  }
  fatalExe(config.rvmCmd + ' install \'' + config.rubyDesired + '\' && rvm use --default \'' + config.rubyDesired + '\' && ruby -v')
}

process.stdout.write('==> Checking Bundler \'' + config.bundlerSatisfactory + '\' ... ')
if (semver.satisfies(bundlerVersion, config.bundlerSatisfactory)) {
  console.log(yes + bundlerVersion + ' (' + bundlerVersionFull + ')')
} else {
  console.log(no + bundlerVersion + ' (' + bundlerVersionFull + ')')
  shell.mkdir('-p', bundlerDir)
  fatalExe('gem install bundler -v \'' + config.bundlerDesired + '\' -n ' + bundlerDir)
}

process.stdout.write('==> Configuring Bundler ... ')
fatalExe(bundlerPath + ' config build.nokogiri --use-system-libraries')
console.log(yes)

process.stdout.write('==> Installing Gems ... ')

var buf = 'source \'https://rubygems.org\'\n'
for (var name in config.gems) {
  var version = config.gems[name]
  buf += 'gem \'' + name + '\', \'' + version + '\'\n'
}
fs.writeFileSync(__dirname + '/Gemfile', buf, 'utf-8')

fatalExe(bundlerPath + ' install --path \'' + __dirname + '/deps/gems\' || ' + bundlerPath + ' update')
console.log(yes)
