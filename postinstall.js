var shell = require('shelljs')
var semver = require('semver')
var chalk = require('chalk')
var path = require('path')
var debug = require('depurar')('lanyon')
var fs = require('fs')
var _ = require('lodash')
var lanyonDir = __dirname
var binDir = path.join(lanyonDir, 'vendor', 'bin')
var gemDir = path.join(lanyonDir, 'vendor', 'gems')
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

function satisfied (app) {
  process.stdout.write('==> Checking: \'' + app + '\' \'' + mergedCfg.prerequisites[app].range + '\' ... ')

  if (optDisable.indexOf(app) !== -1) {
    console.log(no + ' (disabled via LANYON_DISABLE)')
    return false
  }

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

  try {
    if (semver.satisfies(appVersion, mergedCfg.prerequisites[app].range)) {
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

var optDisable = (process.env.LANYON_DISABLE || '').split(/\s+/)
var rubyExe = 'ruby'
var rubyExeSuffix = ''
var gemExe = 'gem'
var bundlerExe = 'bundler'
var jekyllExe = 'jekyll'

shell.mkdir('-p', binDir)

if (!satisfied('node')) {
  shell.exit(1)
}

if (satisfied('docker')) {
  // rubyExe = 'docker run -v $PWD:/srv/jekyll jekyll/jekyll ruby'
  jekyllExe = 'docker run --interactive --tty --volume $PWD:/srv/jekyll --publish "' + mergedCfg.ports.content + ':4000" jekyll/jekyll:pages bundler install --path /srv/jekyll/vendor/bundler; bundler update; bundler exec jekyll'
  // jekyllExe = 'docker run --rm -it -p ' + mergedCfg.ports.content + ':4000 -v $PWD:/site madduci/docker-github-pages'
} else {
  if (!satisfied('ruby')) {
    // rbenv does not offer installing of rubies by default, it will also require the install plugin:
    if (satisfied('rbenv') && shell.exec('rbenv install --help', { 'silent': true }).code === 0) {
      fatalExe('export PATH=\'$HOME/.rbenv/bin:$HOME/.rbenv/shims:$PATH\' && eval \'$(rbenv init -)\' && rbenv install --skip-existing \'' + mergedCfg.prerequisites.ruby.preferred + '\'')
      rubyExe = 'export PATH=\'$HOME/.rbenv/bin:$HOME/.rbenv/shims:$PATH\' && eval \'$(rbenv init -)\' && rbenv shell \'' + mergedCfg.prerequisites.ruby.preferred + '\' && ruby'
      gemExe = '$HOME/.rbenv/versions/' + mergedCfg.prerequisites.ruby.preferred + '/bin/gem'
    } else {
      if (!satisfied('rvm')) {
        fatalExe('curl -sSL https://get.rvm.io | bash -s \'' + mergedCfg.prerequisites.rvm.preferred + '\'')
      }
      // Install ruby
      rubyExeSuffix = '"'
      fatalExe('bash -c "export PATH=\'$HOME/.rvm/bin:$PATH\' && source $HOME/.rvm/scripts/rvm && rvm install \'' + mergedCfg.prerequisites.ruby.preferred + '\'' + rubyExeSuffix)
      rubyExe = 'bash -c "export PATH=\'$HOME/.rvm/bin:$PATH\' && source $HOME/.rvm/scripts/rvm && rvm \'' + mergedCfg.prerequisites.ruby.preferred + '\' exec'
    }
  }

  if (!satisfied('bundler')) {
    fatalExe(rubyExe + ' ' + gemExe + ' install bundler -v \'' + mergedCfg.prerequisites.bundler.preferred + '\'' + rubyExeSuffix)
  }

  process.stdout.write('==> Configuring: Bundler ... ')
  fatalExe(rubyExe + ' ' + bundlerExe + ' config build.nokogiri --use-system-libraries' + rubyExeSuffix)

  process.stdout.write('==> Installing: Gems ... ')
  var buf = 'source \'https://rubygems.org\'\n'
  for (var name in mergedCfg.gems) {
    var version = mergedCfg.gems[name]
    buf += 'gem \'' + name + '\', \'' + version + '\'\n'
  }
  fs.writeFileSync(path.join(lanyonDir, 'Gemfile'), buf, 'utf-8')
  fatalExe(rubyExe + ' ' + bundlerExe + ' install --path \'' + gemDir + '\'' + rubyExeSuffix + ' || ' + rubyExe + ' ' + bundlerExe + ' update' + rubyExeSuffix)

  jekyllExe = rubyExe + ' ' + bundlerExe + ' exec jekyll'
}

process.stdout.write('==> Installing: ruby shim ... ')
fs.writeFileSync(path.join(binDir, 'ruby'), rubyExe.trim() + ' "$@"' + rubyExeSuffix, { 'encoding': 'utf-8', 'mode': '755' })
console.log(yes)

process.stdout.write('==> Installing: jekyll shim ... ')
fs.writeFileSync(path.join(binDir, 'jekyll'), jekyllExe.trim() + ' "$@"' + rubyExeSuffix, { 'encoding': 'utf-8', 'mode': '755' })
console.log(yes)
