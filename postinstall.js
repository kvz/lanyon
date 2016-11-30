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
  var allApps = [ 'system', 'docker', 'rbenv', 'rvm', 'ruby-shim' ]
  if (runtime.enginesOnly === 'auto-all') {
    runtime.enginesOnly = ''
  }

  if (runtime.enginesOnly) {
    runtime.enginesSkip = []
    allApps.forEach(function (app) {
      if (app !== runtime.enginesOnly) {
        runtime.enginesSkip.push(app)
      }
    })
  }
  // debug({runtime.enginesSkip: runtime.enginesSkip, runtime.enginesOnly: runtime.enginesOnly})
  // process.exit(0)

  var rubyExe = 'ruby'
  var rubyVerify = 'ruby -v'
  var rubyExeSuffix = ''
  var rubyWriteShim = true
  var bundlerWriteShim = true
  var jekyllWriteShim = true
  var dashWriteShim = true
  var gemExe = 'gem'
  var bundlerExe = 'bundler'
  var dashExeSuffix = ''
  var dashExe = 'sh'
  var jekyllExe = 'jekyll'
  var envPrefix = ''
  var passEnv = {}
  var rubyFrom = ''

  shell.mkdir('-p', runtime.binDir)

  if (!utils.satisfied('node')) {
    shell.exit(1)
  }

  if (utils.satisfied('docker')) {
    rubyFrom = 'docker'
    // ' --interactive',
    // ' --tty',
    var ver = require(runtime.lanyonPackageFile).version

    if (process.env.DOCKER_BUILD === '1') {
      fs.writeFileSync(path.join(runtime.lanyonDir, 'Gemfile'), fs.readFileSync(path.join(runtime.cacheDir, 'Gemfile'), 'utf-8'), 'utf-8')
      shell.exec('cd ' + runtime.lanyonDir + ' && docker build -t kevinvz/lanyon:' + ver + ' .')
      shell.exec('cd ' + runtime.lanyonDir + ' && docker push kevinvz/lanyon:' + ver + '')
    }

    dashExe = [
      'docker run',
      ' -it',
      ' --rm',
      ' --workdir ' + runtime.cacheDir,
      ' --user $(id -u)',
      ' --volume ' + runtime.cacheDir + ':' + runtime.cacheDir,
      ' --volume ' + runtime.projectDir + ':' + runtime.projectDir,
      ' kevinvz/lanyon:' + ver + '',
      ' sh'
    ].join('')

    rubyExe = [
      'docker run',
      ' --rm',
      ' --workdir ' + runtime.cacheDir,
      ' --user $(id -u)',
      ' --volume ' + runtime.cacheDir + ':' + runtime.cacheDir,
      ' --volume ' + runtime.projectDir + ':' + runtime.projectDir,
      ' kevinvz/lanyon:' + ver + '',
      ' ruby'
    ].join('')

    jekyllExe = [
      'docker run',
      ' --rm',
      ' --workdir ' + runtime.cacheDir,
      ' --user $(id -u)',
      ' --volume ' + runtime.cacheDir + ':' + runtime.cacheDir,
      ' --volume ' + runtime.projectDir + ':' + runtime.projectDir,
      ' kevinvz/lanyon:' + ver + '',
      ' bundler exec jekyll'
    ].join('')
  } else {
    if (utils.satisfied('ruby', 'vendor/bin/ruby -v', 'ruby-shim')) {
      rubyFrom = 'shim'
      rubyExe = 'vendor/bin/ruby'
      rubyVerify = rubyExe + ' -v' + rubyExeSuffix
      rubyWriteShim = false
    } else if (utils.satisfied('ruby', undefined, 'system')) {
      rubyFrom = 'system'
      gemExe = '$(which gem)'
      bundlerExe = '$(which bundler)'
    } else {
      var rubyCfg = runtime.prerequisites.ruby
      // rbenv does not offer installing of rubies by default, it will also require the install plugin:
      if (utils.satisfied('rbenv') && shell.exec('rbenv install --help', { 'silent': false }).code === 0) {
        rubyFrom = 'rbenv'
        utils.fatalExe('bash -c "rbenv install --skip-existing \'' + rubyCfg.preferred + '\'"')
        rubyExe = 'bash -c "eval $(rbenv init -) && rbenv shell \'' + rubyCfg.preferred + '\' &&'
        rubyExeSuffix = '"'
        rubyVerify = rubyExe + 'ruby -v' + rubyExeSuffix
      } else if (utils.satisfied('rvm')) {
        rubyFrom = 'rvm'
        utils.fatalExe('bash -c "rvm install \'' + rubyCfg.preferred + '\'"')
        rubyExe = 'bash -c "rvm \'' + rubyCfg.preferred + '\' exec'
        rubyExeSuffix = '"'
        rubyVerify = rubyExe + ' ruby -v' + rubyExeSuffix
      } else {
        console.error('Ruby version not satisfied, and exhausted ruby version installer helpers (rvm, rbenv, brew)')
        process.exit(1)
      }
    }

    if (!utils.satisfied('ruby', rubyVerify, 'verify')) {
      console.error('Ruby should have been installed but still not satisfied')
      process.exit(1)
    }

    bundlerExe = rubyExe + ' ' + bundlerExe
    if (!utils.satisfied('bundler', bundlerExe + ' -v' + rubyExeSuffix)) {
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

      utils.fatalExe(bunderInstaller.join(''))

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

    process.stdout.write('--> Configuring: Bundler ... ')
    if (os.platform() === 'darwin' && shell.exec('brew -v', { 'silent': true }).code === 0) {
      utils.fatalExe('brew install libxml2; ' + bundlerExe + ' config build.nokogiri --use-system-libraries --with-xml2-include=$(brew --prefix libxml2)/include/libxml2' + rubyExeSuffix)
    } else {
      utils.fatalExe(bundlerExe + ' config build.nokogiri --use-system-libraries' + rubyExeSuffix)
    }

    jekyllExe = bundlerExe + ' exec jekyll'

    process.stdout.write('--> Installing: Gems ... ')
    utils.fatalExe(bundlerExe + ' install --binstubs=\'vendor/bin\' --path \'vendor/bundler\'' + rubyExeSuffix + ' || ' + bundlerExe + ' update' + rubyExeSuffix)
  }

  if (dashWriteShim) {
    var dashShim = envPrefix + dashExe.trim() + ' $*' + dashExeSuffix + '\n'
    var dashShimPath = path.join(runtime.binDir, 'dash')
    process.stdout.write('--> Installing: dash shim to: ' + dashShimPath + ' ... ')
    fs.writeFileSync(dashShimPath, dashShim, { 'encoding': 'utf-8', 'mode': '755' })
    console.log(yes)
  }

  if (rubyWriteShim) {
    var rubyShim = envPrefix + rubyExe.trim() + ' $*' + rubyExeSuffix + '\n'
    var rubyShimPath = path.join(runtime.binDir, 'ruby')
    process.stdout.write('--> Installing: ruby shim to: ' + rubyShimPath + ' ... ')
    fs.writeFileSync(rubyShimPath, rubyShim, { 'encoding': 'utf-8', 'mode': '755' })
    console.log(yes)
  }

  if (bundlerWriteShim) {
    var bundlerShim = bundlerExe.trim() + ' $*' + rubyExeSuffix + '\n'
    var bundlerShimPath = path.join(runtime.binDir, 'bundler')
    process.stdout.write('--> Installing: bundler shim to: ' + bundlerShimPath + ' ... ')
    fs.writeFileSync(bundlerShimPath, bundlerShim, { 'encoding': 'utf-8', 'mode': '755' })
    console.log(yes)
  }

  if (jekyllWriteShim) {
    var jekyllShim = jekyllExe.trim() + ' $*' + rubyExeSuffix + '\n'
    var jekyllShimPath = path.join(runtime.binDir, 'jekyll')
    debug(jekyllShim)
    process.stdout.write('--> Installing: jekyll shim to: ' + jekyllShimPath + ' ... ')
    fs.writeFileSync(jekyllShimPath, jekyllShim, { 'encoding': 'utf-8', 'mode': '755' })
    console.log(yes)
  }

  cb(null)
}
