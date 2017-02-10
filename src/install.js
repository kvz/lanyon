require('babel-polyfill')
const path        = require('path')
const utils       = require('./utils')
const shell       = require('shelljs')
const os          = require('os')
const fs          = require('fs')
// var debug      = require('depurar')('lanyon')
const scrolex     = require('scrolex')
const _           = require('lodash')
const oneLine     = require('common-tags/lib/oneLine')
const stripIndent = require('common-tags/lib/stripIndent')

scrolex.persistOpts({
  announce             : true,
  addCommandAsComponent: true,
  components           : `lanyon>install`,
})

if (require.main === module) {
  scrolex.failure(`Please only used this module via require, or: src/cli.js ${process.argv[1]}`)
  process.exit(1)
}

module.exports = async (runtime, cb) => {
  // Set prerequisite defaults
  let deps = _.cloneDeep(runtime.prerequisites)
  for (const name in deps) {
    if (!deps[name].exeSuffix) {
      deps[name].exeSuffix = ''
    }
    if (!deps[name].exe) {
      deps[name].exe = name
    }
    if (!deps[name].versionCheck) {
      deps[name].versionCheck = `${deps[name].exe} -v`
    }
  }

  let envPrefix    = ''
  const passEnv    = {}
  let rubyProvider = ''

  if (runtime.lanyonReset) {
    scrolex.stick('Removing existing shims')
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
    scrolex.stick(`Found a working shim - determined to be a "${rubyProvider}" rubyProvider`)
    deps.ruby.exe          = fs.readFileSync(`${runtime.binDir}/ruby`, 'utf-8').trim().replace(' $*', '')
    deps.ruby.writeShim    = false
    deps.ruby.versionCheck = `${deps.ruby.exe} -v${deps.ruby.exeSuffix}`
    deps.gem.exe           = fs.readFileSync(`${runtime.binDir}/gem`, 'utf-8').trim().replace(' $*', '')
    deps.gem.writeShim     = false
    deps.bundler.exe       = `${runtime.binDir}/bundler` // <-- not a lanyon shim, it's a real gem bin
    deps.bundler.writeShim = false
  } else if (utils.satisfied(runtime, 'ruby', undefined, 'system')) {
    rubyProvider = 'system'
    deps.gem.exe     = shell.which('gem').stdout
    deps.bundler.exe = shell.which('bundler').stdout
  } else if (utils.satisfied(runtime, 'docker')) {
    rubyProvider = 'docker'
    if (process.env.DOCKER_BUILD === '1') {
      const cache = process.env.DOCKER_RESET === '1' ? ' --no-cache' : ''
      await scrolex.exe(`cd .lanyon && docker build${cache} -t kevinvz/lanyon:${runtime.lanyonVersion} .`)
      await scrolex.exe(`cd .lanyon && docker push kevinvz/lanyon:${runtime.lanyonVersion}`)
    }
    deps.sh.exe     = utils.dockerCmd(runtime, 'sh', '--interactive --tty')
    deps.ruby.exe   = utils.dockerCmd(runtime, 'ruby')
    deps.jekyll.exe = utils.dockerCmd(runtime, 'bundler exec jekyll')
  } else if (utils.satisfied(runtime, 'rbenv') && shell.exec('rbenv install --help', { 'silent': true }).code === 0) {
    // rbenv does not offer installing of rubies by default, it will also require the install plugin --^
    rubyProvider = 'rbenv'
    await scrolex.exe(`bash -c "rbenv install --skip-existing '${deps.ruby.preferred}'"`)
    deps.ruby.exe          = `bash -c "eval $(rbenv init -) && rbenv shell '${deps.ruby.preferred}' &&`
    deps.ruby.exeSuffix    = '"'
    deps.ruby.versionCheck = `${deps.ruby.exe}ruby -v${deps.ruby.exeSuffix}`
  } else if (utils.satisfied(runtime, 'rvm')) {
    rubyProvider = 'rvm'
    await scrolex.exe(`bash -c "rvm install '${deps.ruby.preferred}'"`)
    deps.ruby.exe          = `bash -c "rvm '${deps.ruby.preferred}' exec`
    deps.ruby.exeSuffix    = '"'
    deps.ruby.versionCheck = `${deps.ruby.exe} ruby -v${deps.ruby.exeSuffix}`
  } else {
    scrolex.failure('Ruby version not satisfied, and exhausted ruby version installer helpers (rvm, rbenv, brew)')
    process.exit(1)
  }

  // Verify Ruby
  if (!utils.satisfied(runtime, 'ruby', deps.ruby.versionCheck, 'verify')) {
    scrolex.failure('Ruby should have been installed but still not satisfied')
    process.exit(1)
  }

  if (rubyProvider !== 'docker') {
    // Install Bundler
    deps.bundler.exe = `${deps.ruby.exe} ${deps.bundler.exe}`
    if (!utils.satisfied(runtime, 'bundler', `${deps.bundler.exe} -v${deps.ruby.exeSuffix}`)) {
      let localGemArgs = ''
      if (rubyProvider === 'system') {
        localGemArgs = `--binDir='${runtime.binDir}' --install-dir='vendor/gem_home'`
      }

      await scrolex.exe(oneLine`
        cd "${runtime.cacheDir}" && (
          ${deps.ruby.exe} ${deps.gem.exe} install ${localGemArgs}
            --no-rdoc
            --no-ri
          bundler -v '${deps.bundler.preferred}'${deps.ruby.exeSuffix}
          ${deps.ruby.exeSuffix}
        )
      `)

      if (rubyProvider === 'system') {
        deps.bundler.exe = `${runtime.binDir}/bundler`
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

        deps.bundler.exe = envPrefix + deps.bundler.exe
      }
    }

    // Configure Bundler (nokogiri)
    if (os.platform() === 'darwin' && shell.exec('brew -v', { 'silent': true }).code === 0) {
      await scrolex.exe(oneLine`
        cd "${runtime.cacheDir}" && (
          brew install libxml2;
          ${deps.bundler.exe} config build.nokogiri
            --use-system-libraries
            --with-xml2-include=$(brew --prefix libxml2 | sed 's@_[0-9]*$@@')/include/libxml2
          ${deps.ruby.exeSuffix}
        )
      `)
    } else {
      await scrolex.exe(oneLine`
        cd "${runtime.cacheDir}" && (
          ${deps.bundler.exe} config build.nokogiri
            --use-system-libraries
          ${deps.ruby.exeSuffix}
        )
      `)
    }

    deps.jekyll.exe = `${deps.bundler.exe} exec jekyll`

    // Install Gems from Gemfile bundle
    await scrolex.exe(oneLine`
      cd "${runtime.cacheDir}" && (
        ${deps.bundler.exe} install
          --binstubs='${runtime.binDir}'
          --path='vendor/bundler'
          ${deps.ruby.exeSuffix}
        ||
        ${deps.bundler.exe} update
        ${deps.ruby.exeSuffix}
      )
    `)
  }

  // Write shims
  for (const name in deps) {
    const dep = deps[name]
    if (dep.writeShim) {
      let shim = `${envPrefix + dep.exe.trim()} $*${deps.ruby.exeSuffix}\n`
      if (name === 'dash') {
        shim = `${envPrefix + dep.exe.trim()} $*${deps.dash.exeSuffix}\n`
      }
      var shimPath = path.join(runtime.binDir, name)
      fs.writeFileSync(shimPath, shim, { 'encoding': 'utf-8', 'mode': '755' })
      scrolex.stick(`Installed: ${name} shim to: ${shimPath} ..`)
    }
  }

  shimPath = path.join(runtime.binDir, 'deploy')
  scrolex.stick(`Installed: deploy shim to: ${shimPath} ..`)
  fs.writeFileSync(shimPath, stripIndent`
    #!/bin/sh -ex
    cd "${runtime.projectDir}"
    (npm run build:production || npm run web:build:production) && (npm run deploy || npm run web:deploy)
  `, { 'encoding': 'utf-8', 'mode': '755' })

  cb(null)
}
