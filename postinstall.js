var chalk = require('chalk')
var path = require('path')
var utils = require('./utils')
var shell = require('shelljs')
var debug = require('depurar')('lanyon')
var os = require('os')
var fs = require('fs')

var yes = chalk.green('✓ ')
// var no = chalk.red('✗ ')

module.exports = function (runtime, cb) {
  var envPrefix = ''
  var passEnv = {}
  var rubyProvider = ''

  if (!utils.satisfied(runtime, 'node')) {
    shell.exit(1)
  }

  if (utils.satisfied(runtime, 'docker')) {
    rubyProvider = 'docker'
    // ' --interactive',
    // ' --tty',
    var ver = require(runtime.lanyonPackageFile).version

    if (process.env.DOCKER_BUILD === '1') {
      shell.exec('docker build -t kevinvz/lanyon:' + ver + ' .')
      shell.exec('docker push kevinvz/lanyon:' + ver + '')
    }

    runtime.prerequisites.sh.exe = utils.dockerCmd(runtime, '', 'sh')
    runtime.prerequisites.ruby.exe = utils.dockerCmd(runtime, '', 'ruby')
    runtime.prerequisites.jekyll.exe = utils.dockerCmd(runtime, '', 'bundler exec jekyll')
  } else {
    if (utils.satisfied(runtime, 'ruby', 'vendor/bin/ruby -v', 'ruby-shim')) {
      rubyProvider = 'shim'
      runtime.prerequisites.ruby.exe = 'vendor/bin/ruby'
      runtime.prerequisites.ruby.versionCheck = runtime.prerequisites.ruby.exe + ' -v' + runtime.prerequisites.ruby.exeSuffix
      runtime.prerequisites.ruby.writeShim = false
    } else if (utils.satisfied(runtime, 'ruby', undefined, 'system')) {
      rubyProvider = 'system'
      runtime.prerequisites.gem.exe = '$(which gem)'
      runtime.prerequisites.bundler.exe = '$(which bundler)'
    } else {
      var rubyCfg = runtime.prerequisites.ruby
      // rbenv does not offer installing of rubies by default, it will also require the install plugin:
      if (utils.satisfied(runtime, 'rbenv') && shell.exec('rbenv install --help', { 'silent': false }).code === 0) {
        rubyProvider = 'rbenv'
        utils.fatalExe('bash -c "rbenv install --skip-existing \'' + rubyCfg.preferred + '\'"')
        runtime.prerequisites.ruby.exe = 'bash -c "eval $(rbenv init -) && rbenv shell \'' + rubyCfg.preferred + '\' &&'
        runtime.prerequisites.ruby.exeSuffix = '"'
        runtime.prerequisites.ruby.versionCheck = runtime.prerequisites.ruby.exe + 'ruby -v' + runtime.prerequisites.ruby.exeSuffix
      } else if (utils.satisfied(runtime, 'rvm')) {
        rubyProvider = 'rvm'
        utils.fatalExe('bash -c "rvm install \'' + rubyCfg.preferred + '\'"')
        runtime.prerequisites.ruby.exe = 'bash -c "rvm \'' + rubyCfg.preferred + '\' exec'
        runtime.prerequisites.ruby.exeSuffix = '"'
        runtime.prerequisites.ruby.versionCheck = runtime.prerequisites.ruby.exe + ' ruby -v' + runtime.prerequisites.ruby.exeSuffix
      } else {
        console.error('Ruby version not satisfied, and exhausted ruby version installer helpers (rvm, rbenv, brew)')
        process.exit(1)
      }
    }

    if (!utils.satisfied(runtime, 'ruby', runtime.prerequisites.ruby.versionCheck, 'verify')) {
      console.error('Ruby should have been installed but still not satisfied')
      process.exit(1)
    }

    runtime.prerequisites.bundler.exe = runtime.prerequisites.ruby.exe + ' ' + runtime.prerequisites.bundler.exe
    if (!utils.satisfied(runtime, 'bundler', runtime.prerequisites.bundler.exe + ' -v' + runtime.prerequisites.ruby.exeSuffix)) {
      var bunderInstaller = []

      bunderInstaller.push(runtime.prerequisites.ruby.exe + ' ' + runtime.prerequisites.gem.exe + ' install')
      if (rubyProvider === 'system') {
        bunderInstaller.push(' --bindir vendor/bin')
        bunderInstaller.push(' --install-dir vendor/gem_home')
      }
      bunderInstaller.push(' --no-rdoc')
      bunderInstaller.push(' --no-ri')
      bunderInstaller.push(' bundler')
      bunderInstaller.push(' -v \'' + runtime.prerequisites.bundler.preferred + '\'')
      bunderInstaller.push(runtime.prerequisites.ruby.exeSuffix)

      utils.fatalExe(bunderInstaller.join(''))

      if (rubyProvider === 'system') {
        runtime.prerequisites.bundler.exe = 'vendor/bin/bundler'
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

        runtime.prerequisites.bundler.exe = envPrefix + runtime.prerequisites.bundler.exe
      }
    }

    process.stdout.write('--> Configuring: Bundler ... ')
    if (os.platform() === 'darwin' && shell.exec('brew -v', { 'silent': true }).code === 0) {
      utils.fatalExe('brew install libxml2; ' + runtime.prerequisites.bundler.exe + ' config build.nokogiri --use-system-libraries --with-xml2-include=$(brew --prefix libxml2)/include/libxml2' + runtime.prerequisites.ruby.exeSuffix)
    } else {
      utils.fatalExe(runtime.prerequisites.bundler.exe + ' config build.nokogiri --use-system-libraries' + runtime.prerequisites.ruby.exeSuffix)
    }

    runtime.prerequisites.jekyll.exe = runtime.prerequisites.bundler.exe + ' exec jekyll'

    process.stdout.write('--> Installing: Gems ... ')
    utils.fatalExe(runtime.prerequisites.bundler.exe + ' install --binstubs=\'vendor/bin\' --path \'vendor/bundler\'' + runtime.prerequisites.ruby.exeSuffix + ' || ' + runtime.prerequisites.bundler.exe + ' update' + runtime.prerequisites.ruby.exeSuffix)
  }

  runtime.prerequisites.forEach(function (prerequisite) {

  })

  if (runtime.prerequisites.sh.writeShim) {
    var dashShim = envPrefix + runtime.prerequisites.sh.exe.trim() + ' $*' + runtime.prerequisites.sh.exeSuffix + '\n'
    var dashShimPath = path.join(runtime.binDir, 'sh')
    process.stdout.write('--> Installing: sh shim to: ' + dashShimPath + ' ... ')
    fs.writeFileSync(dashShimPath, dashShim, { 'encoding': 'utf-8', 'mode': '755' })
    console.log(yes)
  }

  if (runtime.prerequisites.ruby.writeShim) {
    var rubyShim = envPrefix + runtime.prerequisites.ruby.exe.trim() + ' $*' + runtime.prerequisites.ruby.exeSuffix + '\n'
    var rubyShimPath = path.join(runtime.binDir, 'ruby')
    process.stdout.write('--> Installing: ruby shim to: ' + rubyShimPath + ' ... ')
    fs.writeFileSync(rubyShimPath, rubyShim, { 'encoding': 'utf-8', 'mode': '755' })
    console.log(yes)
  }

  if (runtime.prerequisites.bundler.writeShim) {
    var bundlerShim = runtime.prerequisites.bundler.exe.trim() + ' $*' + runtime.prerequisites.ruby.exeSuffix + '\n'
    var bundlerShimPath = path.join(runtime.binDir, 'bundler')
    process.stdout.write('--> Installing: bundler shim to: ' + bundlerShimPath + ' ... ')
    fs.writeFileSync(bundlerShimPath, bundlerShim, { 'encoding': 'utf-8', 'mode': '755' })
    console.log(yes)
  }

  if (runtime.prerequisites.jekyll.writeShim) {
    var jekyllShim = runtime.prerequisites.jekyll.exe.trim() + ' $*' + runtime.prerequisites.ruby.exeSuffix + '\n'
    var jekyllShimPath = path.join(runtime.binDir, 'jekyll')
    debug(jekyllShim)
    process.stdout.write('--> Installing: jekyll shim to: ' + jekyllShimPath + ' ... ')
    fs.writeFileSync(jekyllShimPath, jekyllShim, { 'encoding': 'utf-8', 'mode': '755' })
    console.log(yes)
  }

  cb(null)
}
