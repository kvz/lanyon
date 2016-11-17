var shell = require('shelljs')
var semver = require('semver')
var chalk = require('chalk')
var path = require('path')
var debug = require('depurar')('lanyon')
var fs = require('fs')
var _ = require('lodash')
var lanyonDir = __dirname
var binDir = path.join(lanyonDir, 'vendor', 'bin')
var projectDir = process.env.LANYON_PROJECT || '../..'
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

function satisfied (app, cmd, checkOn) {
  var tag = ''
  if (checkOn === undefined) {
    checkOn = app
  } else {
    tag = checkOn + '/'
  }

  process.stdout.write('==> Checking: ' + tag + app + ' \'' + mergedCfg.prerequisites[app].range + '\' ... ')

  if (optDisable.indexOf(checkOn) !== -1) {
    console.log(no + ' (disabled via LANYON_DISABLE)')
    return false
  }

  if (!cmd) {
    cmd = app + ' -v'
  }

  var appVersionFull = shell.exec(cmd, { 'silent': false }).stdout.trim()
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
var rubyVerify = 'ruby -v'
var rubyExeSuffix = ''
var gemExe = 'gem'
var bundlerExe = 'bundler'
var jekyllExe = 'jekyll'

shell.mkdir('-p', binDir)

if (!satisfied('node')) {
  shell.exit(1)
}

process.stdout.write('==> Writing: Gemfile ... ')
var buf = 'source \'https://rubygems.org\'\n'
for (var name in mergedCfg.gems) {
  var version = mergedCfg.gems[name]
  buf += 'gem \'' + name + '\', \'' + version + '\'\n'
}
fs.writeFileSync(path.join(lanyonDir, 'Gemfile'), buf, 'utf-8')
console.log(yes)

if (satisfied('docker')) {
  // ' --interactive',
  // ' --tty',
  var ver = lanyonPackage.version

  if (process.env.DOCKER_BUILD === '1') {
    shell.exec('docker build -t kevinvz/lanyon:' + ver + ' .')
    shell.exec('docker push kevinvz/lanyon:' + ver + '')
  }

  rubyExe = [
    'docker run',
    ' --rm',
    ' --workdir /lanyon',
    ' --user $(id -u)',
    ' --volume ' + lanyonDir + ':' + '/lanyon',
    ' --volume ' + path.resolve(projectDir) + ':' + path.resolve(projectDir),
    ' kevinvz/lanyon:' + ver + '',
    ' ruby'
  ].join('')

 //  groupadd -f -g $GROUP_ID $DOCKER_GROUP '&&' \
 // useradd -u $USER_ID -g $DOCKER_GROUP $DOCKER_USER '&&' \
 // chown $DOCKER_USER:$DOCKER_GROUP $WORK_DIR '&&' \
 // sudo -u $DOCKER_USER HOME=$HOME_DIR $COMMAND

  jekyllExe = [
    'docker run',
    ' --rm',
    ' --workdir /lanyon',
    ' --user $(id -u)',
    ' --volume ' + lanyonDir + ':' + '/lanyon',
    ' --volume ' + path.resolve(projectDir) + ':' + path.resolve(projectDir),
    ' kevinvz/lanyon:' + ver + '',
    ' bundler exec jekyll'
  ].join('')
} else {
  if (satisfied('ruby', 'vendor/bin/ruby -v', 'ruby-shim')) {
    rubyExe = 'vendor/bin/ruby'
    rubyVerify = rubyExe + ' -v' + rubyExeSuffix
  } else if (!satisfied('ruby', undefined, 'system')) {
    var rubyCfg = mergedCfg.prerequisites.ruby
    // rbenv does not offer installing of rubies by default, it will also require the install plugin:
    if (satisfied('rbenv') && shell.exec('rbenv install --help', { 'silent': true }).code === 0) {
      fatalExe('bash -c "rbenv install --skip-existing \'' + rubyCfg.preferred + '\'"')
      rubyExe = 'bash -c "eval $(rbenv init -) && rbenv shell \'' + rubyCfg.preferred + '\' &&'
      rubyExeSuffix = '"'
      rubyVerify = rubyExe + 'ruby -v' + rubyExeSuffix
    } else if (satisfied('rvm')) {
      fatalExe('bash -c "rvm install \'' + rubyCfg.preferred + '\'"')
      rubyExe = 'bash -c "rvm \'' + rubyCfg.preferred + '\' exec'
      rubyExeSuffix = '"'
      rubyVerify = rubyExe + ' ruby -v' + rubyExeSuffix
    } else {
      console.error('Ruby version not satisfied, and exhausted ruby version installer helpers (rvm, rbenv, brew)')
      process.exit(1)
    }
  }

  if (!satisfied('ruby', rubyVerify, 'verify')) {
    console.error('Ruby should have been installed but still not satisfied')
    process.exit(1)
  }

  bundlerExe = rubyExe + ' ' + bundlerExe
  if (!satisfied('bundler', bundlerExe + ' -v' + rubyExeSuffix)) {
    fatalExe(rubyExe + ' ' + gemExe + ' install bundler -n vendor/bin/ -v \'' + mergedCfg.prerequisites.bundler.preferred + '\'' + rubyExeSuffix)
    bundlerExe = 'vendor/bin/bundler'
  }

  process.stdout.write('==> Configuring: Bundler ... ')
  fatalExe(bundlerExe + ' config build.nokogiri --use-system-libraries' + rubyExeSuffix)

  jekyllExe = bundlerExe + ' exec jekyll'

  process.stdout.write('==> Installing: Gems ... ')
  fatalExe(bundlerExe + ' install --path \'vendor/bundler\'' + rubyExeSuffix + ' || ' + bundlerExe + ' update' + rubyExeSuffix)
}

if (rubyExe.indexOf('vendor/bin/ruby') === -1) {
  process.stdout.write('==> Installing: ruby shim ... ')
  fs.writeFileSync(path.join(binDir, 'ruby'), rubyExe.trim() + ' $*' + rubyExeSuffix + '\n', { 'encoding': 'utf-8', 'mode': '755' })
  console.log(yes)
}

if (bundlerExe.indexOf('vendor/bin/bundler') === -1) {
  process.stdout.write('==> Installing: bundler shim ... ')
  fs.writeFileSync(path.join(binDir, 'bundler'), bundlerExe.trim() + ' $*' + rubyExeSuffix + '\n', { 'encoding': 'utf-8', 'mode': '755' })
  console.log(yes)
}

if (jekyllExe.indexOf('vendor/bin/jekyll') === -1) {
  process.stdout.write('==> Installing: jekyll shim ... ')
  fs.writeFileSync(path.join(binDir, 'jekyll'), jekyllExe.trim() + ' $*' + rubyExeSuffix + '\n', { 'encoding': 'utf-8', 'mode': '755' })
  console.log(yes)
}
