var semver = require('semver')
var chalk = require('chalk')
var path = require('path')
var shell = require('shelljs')
var debug = require('depurar')('lanyon')
var os = require('os')
var fs = require('fs')

var runtime = require('./index').runtime
var yes = chalk.green('✓ ')
var no = chalk.red('✗ ')

debug({runtime: runtime})

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

  process.stdout.write('==> Checking: ' + tag + app + ' \'' + runtime.prerequisites[app].range + '\' ... ')

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

var optOnly = (process.env.LANYON_ONLY || '')
var optSkip = (process.env.LANYON_SKIP || '').split(/\s+/)
var allApps = [ 'system', 'docker', 'rbenv', 'rvm', 'ruby-shim' ]
if (optOnly === 'auto-all') {
  optOnly = ''
}

if (optOnly) {
  optSkip = []
  allApps.forEach(function (app) {
    if (app !== optOnly) {
      optSkip.push(app)
    }
  })
}
// debug({optSkip: optSkip, optOnly: optOnly})
// process.exit(0)

var rubyExe = 'ruby'
var rubyVerify = 'ruby -v'
var rubyExeSuffix = ''
var rubyWriteShim = true
var bundlerWriteShim = true
var jekyllWriteShim = true
var gemExe = 'gem'
var bundlerExe = 'bundler'
var jekyllExe = 'jekyll'
var envPrefix = ''
var passEnv = {}
var rubyFrom = ''

shell.mkdir('-p', runtime.binDir)

if (!satisfied('node')) {
  shell.exit(1)
}

process.stdout.write('==> Writing: Gemfile ... ')
var buf = 'source \'https://rubygems.org\'\n'
for (var name in runtime.gems) {
  var version = runtime.gems[name]
  buf += 'gem \'' + name + '\', \'' + version + '\'\n'
}
fs.writeFileSync(path.join(runtime.lanyonDir, 'Gemfile'), buf, 'utf-8')
console.log(yes)

if (satisfied('docker')) {
  rubyFrom = 'docker'
  // ' --interactive',
  // ' --tty',
  var ver = require(runtime.lanyonPackageFile).version

  if (process.env.DOCKER_BUILD === '1') {
    shell.rm('-f', 'Gemfile.lock')
    shell.exec('docker build -t kevinvz/lanyon:' + ver + ' .')
    shell.exec('docker push kevinvz/lanyon:' + ver + '')
  }

  rubyExe = [
    'docker run',
    ' --rm',
    ' --workdir ' + runtime.lanyonDir,
    ' --user $(id -u)',
    ' --volume ' + runtime.lanyonDir + ':' + runtime.lanyonDir,
    ' --volume ' + runtime.projectDir + ':' + runtime.projectDir,
    ' kevinvz/lanyon:' + ver + '',
    ' ruby'
  ].join('')

  jekyllExe = [
    'docker run',
    ' --rm',
    ' --workdir ' + runtime.lanyonDir,
    ' --user $(id -u)',
    ' --volume ' + runtime.lanyonDir + ':' + runtime.lanyonDir,
    ' --volume ' + runtime.projectDir + ':' + runtime.projectDir,
    ' kevinvz/lanyon:' + ver + '',
    ' bundler exec jekyll'
  ].join('')
} else {
  if (satisfied('ruby', 'vendor/bin/ruby -v', 'ruby-shim')) {
    rubyFrom = 'shim'
    rubyExe = 'vendor/bin/ruby'
    rubyVerify = rubyExe + ' -v' + rubyExeSuffix
    rubyWriteShim = false
  } else if (satisfied('ruby', undefined, 'system')) {
    rubyFrom = 'system'
    gemExe = '$(which gem)'
    bundlerExe = '$(which bundler)'
  } else {
    var rubyCfg = runtime.prerequisites.ruby
    // rbenv does not offer installing of rubies by default, it will also require the install plugin:
    if (satisfied('rbenv') && shell.exec('rbenv install --help', { 'silent': false }).code === 0) {
      rubyFrom = 'rbenv'
      fatalExe('bash -c "rbenv install --skip-existing \'' + rubyCfg.preferred + '\'"')
      rubyExe = 'bash -c "eval $(rbenv init -) && rbenv shell \'' + rubyCfg.preferred + '\' &&'
      rubyExeSuffix = '"'
      rubyVerify = rubyExe + 'ruby -v' + rubyExeSuffix
    } else if (satisfied('rvm')) {
      rubyFrom = 'rvm'
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
    var bunderInstaller = []

    bunderInstaller.push(rubyExe + ' ' + gemExe + ' install')
    if (rubyFrom === 'system') {
      bunderInstaller.push(' --bindir vendor/bin')
      bunderInstaller.push(' --install-dir vendor/gem_home')
    }
    bunderInstaller.push(' --no-rdoc')
    bunderInstaller.push(' --no-ri')
    bunderInstaller.push(' bundler')
    bunderInstaller.push(' -v \'' + runtime.prerequisites.bundler.preferred + '\'')
    bunderInstaller.push(rubyExeSuffix)

    fatalExe(bunderInstaller.join(''))

    // rubyExeSuffix = ''

    if (rubyFrom === 'system') {
      bundlerExe = 'vendor/bin/bundler'
      passEnv.GEM_HOME = 'vendor/gem_home'
      passEnv.GEM_PATH = 'vendor/gem_home'

      if (Object.keys(passEnv).length > 0) {
        var vals = []
        for (var key in passEnv) {
          var val = passEnv[key]
          vals.push(key + '=' + val)
        }
        envPrefix = 'env ' + vals.join(' ') + ' '
      }

      bundlerExe = envPrefix + bundlerExe
    }
  }

  process.stdout.write('==> Configuring: Bundler ... ')
  if (os.platform() === 'darwin' && shell.exec('brew -v', { 'silent': true }).code === 0) {
    fatalExe('brew install libxml2; ' + bundlerExe + ' config build.nokogiri --use-system-libraries --with-xml2-include=$(brew --prefix libxml2)/include/libxml2' + rubyExeSuffix)
  } else {
    fatalExe(bundlerExe + ' config build.nokogiri --use-system-libraries' + rubyExeSuffix)
  }

  jekyllExe = bundlerExe + ' exec jekyll'

  process.stdout.write('==> Installing: Gems ... ')
  fatalExe(bundlerExe + ' install --binstubs=\'vendor/bin\' --path \'vendor/bundler\'' + rubyExeSuffix + ' || ' + bundlerExe + ' update' + rubyExeSuffix)
}

if (rubyWriteShim) {
  process.stdout.write('==> Installing: ruby shim ... ')
  var rubyShim = envPrefix + rubyExe.trim() + ' $*' + rubyExeSuffix + '\n'
  fs.writeFileSync(path.join(runtime.binDir, 'ruby'), rubyShim, { 'encoding': 'utf-8', 'mode': '755' })
  console.log(yes)
}

if (bundlerWriteShim) {
  process.stdout.write('==> Installing: bundler shim ... ')
  var bundlerShim = bundlerExe.trim() + ' $*' + rubyExeSuffix + '\n'
  fs.writeFileSync(path.join(runtime.binDir, 'bundler'), bundlerShim, { 'encoding': 'utf-8', 'mode': '755' })
  console.log(yes)
}

if (jekyllWriteShim) {
  process.stdout.write('==> Installing: jekyll shim ... ')
  var jekyllShim = jekyllExe.trim() + ' $*' + rubyExeSuffix + '\n'
  fs.writeFileSync(path.join(runtime.binDir, 'jekyll'), jekyllShim, { 'encoding': 'utf-8', 'mode': '755' })
  console.log(yes)
}
