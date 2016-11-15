var shell = require('shelljs')
var semver = require('semver')
var chalk = require('chalk')
var path = require('path')
var debug = require('depurar')('lanyon')
var fs = require('fs')
var _ = require('lodash')
var lanyonDir = __dirname
var binDir = path.join(lanyonDir, 'deps', 'bin')
var gemDir = path.join(lanyonDir, 'deps', 'gems')
var projectDir = process.env.PROJECT_DIR || '../..'
var projectPackageFile = path.join(projectDir, '/package.json')
try {
  var projectPackage = require(projectPackageFile)
} catch (e) {
  projectPackage = {}
}
var lanyonPackage = require('./package.json')
var mergedCfg = _.defaults(projectPackage.lanyon || {}, lanyonPackage.lanyon)
var yes = chalk.green('✓ ')
var no = chalk.red('✗ ')
debug({mergedCfg: mergedCfg})

function fatalExe (cmd) {
  var opts = { 'silent': false }

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

function satisfied (app) {
  process.stdout.write('==> Checking: \'' + app + '\' \'' + mergedCfg[app + 'Satisfactory'] + '\' ... ')
  var cmd = app + ' -v'

  if (app === 'bundler') {
    cmd = rubyExe + ' ' + bundlerExe + ' -v'
  }

  var appVersionFull = shell.exec(cmd, { 'silent': true }).stdout.trim()
  var parts = appVersionFull.split(/[,p\s]+/)
  var appVersion = parts[1]

  if (app === 'node') {
    appVersion = parts[0]
  } else if (app === 'bundler') {
    appVersion = parts[2]
  } else if (app === 'docker') {
    appVersion = parts[2]
  }

  if (semver.satisfies(appVersion, mergedCfg[app + 'Satisfactory'])) {
    console.log(yes + appVersion + ' (' + appVersionFull + ')')
    return true
  }

  console.log(no + appVersion + ' (' + appVersionFull + ')')
  return false
}

var rubyExe = 'ruby'
var gemExe = 'gem'
var bundlerExe = 'bundler'
var jekyllExe = 'jekyll'

shell.mkdir('-p', binDir)

if (!satisfied('node')) {
  shell.exit(1)
}

if (satisfied('docker')) {
  rubyExe = 'docker run -v $PWD:/srv/jekyll -p "' + mergedCfg.portContent + ':4000" jekyll/jekyll ruby'
  jekyllExe = 'docker run -v $PWD:/srv/jekyll -p "' + mergedCfg.portContent + ':4000" jekyll/jekyll jekyll'
} else {
  if (!satisfied('ruby')) {
    if (satisfied('rbenv')) {
      fatalExe('export PATH="$HOME/.rbenv/bin:$HOME/.rbenv/shims:$PATH" && eval "$(rbenv init -)" && rbenv install --skip-existing \'' + mergedCfg.rubyDesired + '\'')
      rubyExe = 'export PATH="$HOME/.rbenv/bin:$HOME/.rbenv/shims:$PATH" && eval "$(rbenv init -)" && rbenv shell \'' + mergedCfg.rubyDesired + '\' && ruby'
      gemExe = '$HOME/.rbenv/versions/' + mergedCfg.rubyDesired + '/bin/gem'
    } else {
      if (!satisfied('rvm')) {
        fatalExe('curl -sSL https://get.rvm.io | bash -s \'' + mergedCfg.rvmDesired + '\'')
      }
      fatalExe('export PATH="$HOME/.rvm/bin:$PATH" && . $HOME/.rvm/scripts/rvm && rvm install \'' + mergedCfg.rubyDesired + '\'')
      rubyExe = 'export PATH="$HOME/.rvm/bin:$PATH" && . $HOME/.rvm/scripts/rvm && rvm \'' + mergedCfg.rubyDesired + '\' exec'
    }
  }

  if (!satisfied('bundler')) {
    fatalExe(rubyExe + ' ' + gemExe + ' install bundler -v \'' + mergedCfg.bundlerDesired + '\'')
  }

  process.stdout.write('==> Configuring: Bundler ... ')
  fatalExe(rubyExe + ' ' + bundlerExe + ' config build.nokogiri --use-system-libraries')

  process.stdout.write('==> Installing: Gems ... ')
  var buf = 'source \'https://rubygems.org\'\n'
  for (var name in mergedCfg.gems) {
    var version = mergedCfg.gems[name]
    buf += 'gem \'' + name + '\', \'' + version + '\'\n'
  }
  fs.writeFileSync(path.join(lanyonDir, 'Gemfile'), buf, 'utf-8')
  fatalExe(rubyExe + ' ' + bundlerExe + ' install --path \'' + gemDir + '\' || ' + rubyExe + ' ' + bundlerExe + ' update')
}

process.stdout.write('==> Installing: ruby shim ... ')
fs.writeFileSync(path.join(binDir, 'ruby'), rubyExe.trim() + ' "$@"', { 'encoding': 'utf-8', 'mode': '755' })
console.log(yes)

process.stdout.write('==> Installing: jekyll shim ... ')
fs.writeFileSync(path.join(binDir, 'jekyll'), jekyllExe.trim() + ' "$@"', { 'encoding': 'utf-8', 'mode': '755' })
console.log(yes)
