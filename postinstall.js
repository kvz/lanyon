var chalk = require('chalk')
var path = require('path')
var utils = require('./utils')
var shell = require('shelljs')
var os = require('os')
var fs = require('fs')
// var debug = require('depurar')('lanyon')

var yes = chalk.green('✓ ')
// var no = chalk.red('✗ ')

module.exports = function (runtime, cb) {
  var envPrefix = ''
  var passEnv = {}
  var rubyProvider = ''

  if (!utils.satisfied(runtime, 'node')) {
    shell.exit(1)
  }

  // Detmine optimal rubyProvider and adjust shim configuration
  if (utils.satisfied(runtime, 'docker')) {
    rubyProvider = 'docker'

    if (process.env.DOCKER_BUILD === '1') {
      shell.exec('docker build -t kevinvz/lanyon:' + runtime.lanyonVersion + ' .')
      shell.exec('docker push kevinvz/lanyon:' + runtime.lanyonVersion + '')
    }
    runtime.prerequisites.sh.exe = utils.dockerCmd(runtime, 'sh', '--interactive --tty')
    runtime.prerequisites.ruby.exe = utils.dockerCmd(runtime, 'ruby')
    runtime.prerequisites.jekyll.exe = utils.dockerCmd(runtime, 'bundler exec jekyll')
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

    // Verify Ruby
    if (!utils.satisfied(runtime, 'ruby', runtime.prerequisites.ruby.versionCheck, 'verify')) {
      console.error('Ruby should have been installed but still not satisfied')
      process.exit(1)
    }

    // Install Bundler
    runtime.prerequisites.bundler.exe = runtime.prerequisites.ruby.exe + ' ' + runtime.prerequisites.bundler.exe
    if (!utils.satisfied(runtime, 'bundler', runtime.prerequisites.bundler.exe + ' -v' + runtime.prerequisites.ruby.exeSuffix)) {
      var bunderInstaller = []

      bunderInstaller.push('cd')
      bunderInstaller.push(runtime.cacheDir)
      bunderInstaller.push(runtime.prerequisites.ruby.exe + ' ' + runtime.prerequisites.gem.exe + ' install')
      if (rubyProvider === 'system') {
        bunderInstaller.push('--bindir vendor/bin')
        bunderInstaller.push('--install-dir vendor/gem_home')
      }
      bunderInstaller.push('--no-rdoc')
      bunderInstaller.push('--no-ri')
      bunderInstaller.push('bundler')
      bunderInstaller.push('-v \'' + runtime.prerequisites.bundler.preferred + '\'' + runtime.prerequisites.ruby.exeSuffix)

      utils.fatalExe(bunderInstaller)

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

    // Configure Bundler (nokogiri)
    process.stdout.write('--> Configuring: Bundler ... ')
    if (os.platform() === 'darwin' && shell.exec('brew -v', { 'silent': true }).code === 0) {
      utils.fatalExe([
        'cd',
        runtime.cacheDir,
        '(',
        'brew install libxml2;',
        runtime.prerequisites.bundler.exe,
        'config build.nokogiri',
        '--use-system-libraries',
        '--with-xml2-include=$(brew --prefix libxml2)/include/libxml2' + runtime.prerequisites.ruby.exeSuffix,
        ')'
      ])
    } else {
      utils.fatalExe([
        'cd',
        runtime.cacheDir,
        runtime.prerequisites.bundler.exe,
        'config build.nokogiri',
        '--use-system-libraries' + runtime.prerequisites.ruby.exeSuffix
      ])
    }

    runtime.prerequisites.jekyll.exe = runtime.prerequisites.bundler.exe + ' exec jekyll'

    // Install Gems from Gemfile bundle
    process.stdout.write('--> Installing: Gems ... ')
    utils.fatalExe([
      'cd',
      runtime.cacheDir,
      '(',
      runtime.prerequisites.bundler.exe,
      'install',
      '--binstubs=\'vendor/bin\'',
      '--path \'vendor/bundler\'' + runtime.prerequisites.ruby.exeSuffix,
      '||',
      runtime.prerequisites.bundler.exe,
      'update' + runtime.prerequisites.ruby.exeSuffix,
      ')'
    ])
  }

  // Write shims
  for (var name in runtime.prerequisites) {
    var p = runtime.prerequisites[name]
    if (p.writeShim) {
      var shim = envPrefix + p.exe.trim() + ' $*' + p.exeSuffix + '\n'
      var shimPath = path.join(runtime.binDir, name)
      process.stdout.write('--> Installing: ' + name + ' shim to: ' + shimPath + ' ... ')
      fs.writeFileSync(shimPath, shim, { 'encoding': 'utf-8', 'mode': '755' })
      console.log(yes)
    }
  }

  cb(null)
}
