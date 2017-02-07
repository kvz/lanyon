const chalk  = require('chalk')
const path   = require('path')
const utils  = require('./utils')
const shell  = require('shelljs')
const os     = require('os')
const fs     = require('fs')
// var debug = require('depurar')('lanyon')
const yes    = chalk.green('✓ ')
// var no    = chalk.red('✗ ')
const Scrolex = require('scrolex')

module.exports = (runtime, cb) => {
  let envPrefix    = ''
  const passEnv    = {}
  let rubyProvider = ''

  if (runtime.lanyonReset) {
    console.log('--> Removing existing shims')
    shell.rm('-f', `${runtime.binDir}/*`)
  }

  if (!utils.satisfied(runtime, 'node')) {
    shell.exit(1)
  }

  // Detmine optimal rubyProvider and adjust shim configuration
  if (utils.satisfied(runtime, 'ruby', `${runtime.binDir}/ruby -v`, 'ruby-shim')) {
    const buff = fs.readFileSync(`${runtime.binDir}/ruby`, 'utf-8').trim()
    if (buff.indexOf('docker') !== -1) {
      rubyProvider = 'docker'
    } else if (buff.indexOf('rvm') !== -1) {
      rubyProvider = 'rvm'
    } else if (buff.indexOf('rbenv') !== -1) {
      rubyProvider = 'rbenv'
    } else {
      rubyProvider = 'system'
    }
    console.log(`--> Found a working shim - determined to be a "${rubyProvider}" rubyProvider`)
    runtime.prerequisites.ruby.exe          = fs.readFileSync(`${runtime.binDir}/ruby`, 'utf-8').trim().replace(' $*', '')
    runtime.prerequisites.ruby.writeShim    = false
    runtime.prerequisites.ruby.versionCheck = `${runtime.prerequisites.ruby.exe} -v${runtime.prerequisites.ruby.exeSuffix}`
    runtime.prerequisites.gem.exe           = fs.readFileSync(`${runtime.binDir}/gem`, 'utf-8').trim().replace(' $*', '')
    runtime.prerequisites.gem.writeShim     = false
    runtime.prerequisites.bundler.exe       = `${runtime.binDir}/bundler` // <-- not a lanyon shim, it's a real gem bin
    runtime.prerequisites.bundler.writeShim = false
  } else if (utils.satisfied(runtime, 'ruby', undefined, 'system')) {
    rubyProvider = 'system'
    runtime.prerequisites.gem.exe     = shell.which('gem')
    runtime.prerequisites.bundler.exe = shell.which('bundler')
  } else if (utils.satisfied(runtime, 'docker')) {
    rubyProvider = 'docker'
    if (process.env.DOCKER_BUILD === '1') {
      const cache = process.env.DOCKER_RESET === '1' ? ' --no-cache' : ''
      Scrolex.exe(`cd .lanyon && docker build${cache} -t kevinvz/lanyon:${runtime.lanyonVersion} .`, { components: 'lanyon>postinstall>docker>build' })
      Scrolex.exe(`cd .lanyon && docker push kevinvz/lanyon:${runtime.lanyonVersion}`, { components: 'lanyon>postinstall>docker>push' })
    }
    runtime.prerequisites.sh.exe     = utils.dockerCmd(runtime, 'sh', '--interactive --tty')
    runtime.prerequisites.ruby.exe   = utils.dockerCmd(runtime, 'ruby')
    runtime.prerequisites.jekyll.exe = utils.dockerCmd(runtime, 'bundler exec jekyll')
  } else if (utils.satisfied(runtime, 'rbenv') && shell.exec('rbenv install --help', { 'silent': false }).code === 0) {
    // rbenv does not offer installing of rubies by default, it will also require the install plugin --^
    rubyProvider = 'rbenv'
    Scrolex.exe(`bash -c "rbenv install --skip-existing '${runtime.prerequisites.ruby.preferred}'"`, { components: 'lanyon>postinstall>rbenv>install' })
    runtime.prerequisites.ruby.exe          = `bash -c "eval $(rbenv init -) && rbenv shell '${runtime.prerequisites.ruby.preferred}' &&`
    runtime.prerequisites.ruby.exeSuffix    = '"'
    runtime.prerequisites.ruby.versionCheck = `${runtime.prerequisites.ruby.exe}ruby -v${runtime.prerequisites.ruby.exeSuffix}`
  } else if (utils.satisfied(runtime, 'rvm')) {
    rubyProvider = 'rvm'
    Scrolex.exe(`bash -c "rvm install '${runtime.prerequisites.ruby.preferred}'"`, { components: 'lanyon>postinstall>rvm>install' })
    runtime.prerequisites.ruby.exe          = `bash -c "rvm '${runtime.prerequisites.ruby.preferred}' exec`
    runtime.prerequisites.ruby.exeSuffix    = '"'
    runtime.prerequisites.ruby.versionCheck = `${runtime.prerequisites.ruby.exe} ruby -v${runtime.prerequisites.ruby.exeSuffix}`
  } else {
    console.error('Ruby version not satisfied, and exhausted ruby version installer helpers (rvm, rbenv, brew)')
    process.exit(1)
  }

  // Verify Ruby
  if (!utils.satisfied(runtime, 'ruby', runtime.prerequisites.ruby.versionCheck, 'verify')) {
    console.error('Ruby should have been installed but still not satisfied')
    process.exit(1)
  }

  if (rubyProvider !== 'docker') {
    // Install Bundler
    runtime.prerequisites.bundler.exe = `${runtime.prerequisites.ruby.exe} ${runtime.prerequisites.bundler.exe}`
    if (!utils.satisfied(runtime, 'bundler', `${runtime.prerequisites.bundler.exe} -v${runtime.prerequisites.ruby.exeSuffix}`)) {
      const bunderInstaller = []

      bunderInstaller.push(`cd ${runtime.cacheDir}`)
      bunderInstaller.push('&&')
      bunderInstaller.push(`${runtime.prerequisites.ruby.exe} ${runtime.prerequisites.gem.exe} install`)
      if (rubyProvider === 'system') {
        bunderInstaller.push(`--binDir ${runtime.binDir}`)
        bunderInstaller.push('--install-dir vendor/gem_home')
      }
      bunderInstaller.push('--no-rdoc')
      bunderInstaller.push('--no-ri')
      bunderInstaller.push('bundler')
      bunderInstaller.push(`-v '${runtime.prerequisites.bundler.preferred}'${runtime.prerequisites.ruby.exeSuffix}`)

      Scrolex.exe(bunderInstaller, { components: 'lanyon>postinstall>bundler>install' })

      if (rubyProvider === 'system') {
        runtime.prerequisites.bundler.exe = `${runtime.binDir}/bundler`
        passEnv.GEM_HOME = 'vendor/gem_home'
        passEnv.GEM_PATH = 'vendor/gem_home'

        if (Object.keys(passEnv).length > 0) {
          const vals = []
          for (const key in passEnv) {
            const val = passEnv[key]
            vals.push(`${key}=${val}`)
          }
          envPrefix = `env ${vals.join(' ')} `
        }

        runtime.prerequisites.bundler.exe = envPrefix + runtime.prerequisites.bundler.exe
      }
    }

    // Configure Bundler (nokogiri)
    if (os.platform() === 'darwin' && shell.exec('brew -v', { 'silent': true }).code === 0) {
      Scrolex.exe([
        'cd',
        runtime.cacheDir,
        '&&',
        '(',
        'brew install libxml2;',
        runtime.prerequisites.bundler.exe,
        'config build.nokogiri',
        '--use-system-libraries',
        `--with-xml2-include=$(brew --prefix libxml2 | sed 's@_[0-9]*$@@')/include/libxml2${runtime.prerequisites.ruby.exeSuffix}`,
        ')',
      ].join(' '), { components: 'lanyon>postinstall>bundler>configure' })
    } else {
      Scrolex.exe([
        'cd',
        runtime.cacheDir,
        '&&',
        runtime.prerequisites.bundler.exe,
        'config build.nokogiri',
        `--use-system-libraries${runtime.prerequisites.ruby.exeSuffix}`,
      ].join(' '), { components: 'lanyon>postinstall>bundler>configure' })
    }

    runtime.prerequisites.jekyll.exe = `${runtime.prerequisites.bundler.exe} exec jekyll`

    // Install Gems from Gemfile bundle
    Scrolex.exe([
      'cd',
      runtime.cacheDir,
      '&&',
      '(',
      runtime.prerequisites.bundler.exe,
      'install',
      `--binstubs='${runtime.binDir}'`,
      `--path 'vendor/bundler'${runtime.prerequisites.ruby.exeSuffix}`,
      '||',
      runtime.prerequisites.bundler.exe,
      `update${runtime.prerequisites.ruby.exeSuffix}`,
      ')',
    ].join(' '), { components: 'lanyon>postinstall>gems>install' })
  }

  // Write shims
  for (const name in runtime.prerequisites) {
    const p = runtime.prerequisites[name]
    if (p.writeShim) {
      let shim = `${envPrefix + p.exe.trim()} $*${runtime.prerequisites.ruby.exeSuffix}\n`
      if (name === 'dash') {
        shim = `${envPrefix + p.exe.trim()} $*${runtime.prerequisites.dash.exeSuffix}\n`
      }
      var shimPath = path.join(runtime.binDir, name)
      process.stdout.write(`--> Installing: ${name} shim to: ${shimPath} ... `)
      fs.writeFileSync(shimPath, shim, { 'encoding': 'utf-8', 'mode': '755' })
      console.log(yes)
    }
  }

  shimPath = path.join(runtime.binDir, 'deploy')
  process.stdout.write(`--> Installing: deploy shim to: ${shimPath} ... `)
  fs.writeFileSync(shimPath, `#!/bin/sh -ex\ncd "${runtime.projectDir}"\n(npm run build:production || npm run web:build:production) && (npm run deploy || npm run web:deploy)`, { 'encoding': 'utf-8', 'mode': '755' })
  console.log(yes)

  cb(null)
}
