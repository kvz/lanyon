var shell = require('shelljs')
var semver = require('semver')
var chalk = require('chalk')
var path = require('path')
var debug = require('depurar')('lanyon')
var fs = require('fs')
var _ = require('lodash')
var lanyonDir = __dirname
var binDir = path.join(lanyonDir, 'vendor', 'bin')
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

function satisfied (app, cmd, checkOn) {
  process.stdout.write('==> Checking: \'' + app + '\' \'' + mergedCfg.prerequisites[app].range + '\' ... ')

  if (checkOn === undefined) {
    checkOn = app
  }

  if (optDisable.indexOf(checkOn) !== -1) {
    console.log(no + ' (disabled via LANYON_DISABLE)')
    return false
  }

  if (!cmd) {
    cmd = app + ' -v'

    if (app === 'bundler') {
      cmd = rubyExe + ' ' + bundlerExe + ' -v'
    }
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
var rubyExe = '$(ruby)'
var rubyExeSuffix = ''
var gemExe = '$(which gem)'
var bundlerExe = '$(which bundler)'
var jekyllExe = '$(which jekyll)'
var jekyllExeSuffix = ''

shell.mkdir('-p', binDir)

if (!satisfied('node')) {
  shell.exit(1)
}

if (satisfied('docker')) {
  // ' --interactive',
  // ' --tty',

  if (process.env.DOCKER_TOKEN) {
    shell.exec('docker build -t kevinvz/lanyon .')
    shell.exec('docker push kevinvz/lanyon')
  }

  rubyExe = [
    'docker run',
    ' --rm',
    ' --volume $PWD:/srv',
    ' --volume ' + path.resolve(projectDir + '/_site') + ':' + path.resolve(projectDir + '/_site'),
    ' --publish ' + mergedCfg.ports.content + ':4000',
    ' kevinvz/lanyon',
    ' ruby'
  ].join('')

  jekyllExe = [
    'docker run',
    ' --rm',
    ' --volume $PWD:/srv',
    ' --volume ' + path.resolve(projectDir + '/_site') + ':' + path.resolve(projectDir + '/_site'),
    ' --publish ' + mergedCfg.ports.content + ':4000',
    ' kevinvz/lanyon',
    ' bundler exec jekyll'
  ].join('')
} else {
  if (satisfied('ruby', 'vendor/bin/ruby -v', 'vendor')) {
    rubyExe = 'vendor/bin/ruby -v'
  } else if (!satisfied('ruby', undefined, 'system')) {
    var rubyCfg = mergedCfg.prerequisites.ruby
    // rbenv does not offer installing of rubies by default, it will also require the install plugin:
    if (satisfied('rbenv') && shell.exec('rbenv install --help', { 'silent': true }).code === 0) {
      fatalExe('rbenv install --skip-existing \'' + rubyCfg.preferred + '\'')
      rubyExe = 'rbenv shell \'' + rubyCfg.preferred + '\' && ruby'
    } else if (satisfied('rvm')) {
      fatalExe('bash -c "rvm install \'' + rubyCfg.preferred + '\'"')
      rubyExe = 'bash -c "rvm \'' + rubyCfg.preferred + '\' exec ruby'
      rubyExeSuffix = '"'
    } else if (satisfied('brew')) {
      fatalExe('brew install \'ruby' + rubyCfg._brew + '\'')

      var env = [
        'env',
        'LDFLAGS=-L/usr/local/opt/' + rubyCfg._brew + '/lib',
        'CPPFLAGS=-I/usr/local/opt/' + rubyCfg._brew + '/include',
        'PKG_CONFIG_PATH=/usr/local/opt/' + rubyCfg._brew + '/lib/pkgconfig',
        'PATH=' + '/usr/local/lib/ruby/gems/' + rubyCfg._brewGemDir + '/bin:$PATH',
        'GEM_HOME=' + '/usr/local/lib/ruby/gems/' + rubyCfg._brewGemDir,
        'GEM_PATH=' + '/usr/local/lib/ruby/gems/' + rubyCfg._brewGemDir
      ]
      rubyExe = env.join(' ') + ' /usr/local/opt/ruby' + rubyCfg._brew + '/bin/ruby'
      gemExe = '/usr/local/opt/ruby' + rubyCfg._brew + '/bin/gem'
    } else {
      console.error('Ruby version not satisfied, and exhausted ruby version installer helpers (rvm, rbenv, brew)')
      process.exit(1)
    }
  }

  if (!satisfied('ruby', rubyExe + ' -v' + rubyExeSuffix, 'verify')) {
    console.error('Ruby should have been installed but still not satisfied')
    process.exit(1)
  }

  if (satisfied('bundler', 'vendor/bin/bundler -v')) {
    bundlerExe = 'vendor/bin/bundler'
  } else if (!satisfied('bundler')) {
    fatalExe(rubyExe + ' ' + gemExe + ' install bundler -n \'vendor/bin\' -v \'' + mergedCfg.prerequisites.bundler.preferred + '\'' + rubyExeSuffix)
    bundlerExe = 'vendor/bin/bundler'
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
  fatalExe(rubyExe + ' ' + bundlerExe + ' install --path \'vendor/bundler\'' + rubyExeSuffix + ' || ' + rubyExe + ' ' + bundlerExe + ' update' + rubyExeSuffix)

  jekyllExe = rubyExe + ' ' + bundlerExe + ' exec jekyll'
}

if (rubyExe.indexOf('vendor/bin/ruby') === -1) {
  process.stdout.write('==> Installing: ruby shim ... ')
  fs.writeFileSync(path.join(binDir, 'ruby'), rubyExe.trim() + ' $@' + rubyExeSuffix, { 'encoding': 'utf-8', 'mode': '755' })
  console.log(yes)
}

if (jekyllExe.indexOf('vendor/bin/jekyll') === -1) {
  process.stdout.write('==> Installing: jekyll shim ... ')
  fs.writeFileSync(path.join(binDir, 'jekyll'), jekyllExe.trim() + ' $@' + jekyllExeSuffix + rubyExeSuffix, { 'encoding': 'utf-8', 'mode': '755' })
  console.log(yes)
}
