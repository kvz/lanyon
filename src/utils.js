const semver = require('semver')
const chalk = require('chalk')
const fs = require('fs')
const _ = require('lodash')
const path = require('path')
const yaml = require('js-yaml')
const shell = require('shelljs')
const no = chalk.red('✗ ')
const yes = chalk.green('✓ ')
const spawnSync = require('spawn-sync')

module.exports.preferLocalPackage = (args, filename, appDir, name, entry, version) => {
  let localModulePackage
  let absoluteEntry
  try {
    localModulePackage = require(`${appDir}/node_modules/${name}/package.json`)
    absoluteEntry = fs.realpathSync(`${appDir}/node_modules/${name}/${entry}`)
  } catch (e) {
    localModulePackage = {}
    absoluteEntry = false
  } finally {
    if (localModulePackage.version && absoluteEntry) {
      if (filename === absoluteEntry) {
        console.log(`--> Booting symlinked ${name} v${localModulePackage.version}`)
      } else {
        console.log(`--> Booting local ${name} v${localModulePackage.version}`)
        const exe = args.shift()
        for (const i in args) {
          // Replace the current entry, e.g. /usr/local/frey/lib/cli.js with the local package
          if (args[i] === filename) {
            args[i] = absoluteEntry
          }
        }
        spawnSync(exe, args, { stdio: 'inherit' })
        process.exit(0)
      }
    } else {
      console.log(`--> Booting local ${name} v${version}`)
    }
  }
}

module.exports.dockerCmd = ({cacheDir, projectDir, lanyonVersion}, cmd, flags) => {
  if (!flags) {
    flags = ''
  }
  return [
    'docker run',
    ` ${flags}`,
    ' --rm',
    ` --workdir ${cacheDir}`,
    ' --user $(id -u)',
    ` --volume ${cacheDir}:${cacheDir}`,
    ` --volume ${projectDir}:${projectDir}`,
    ` kevinvz/lanyon:${lanyonVersion}`,
    ` ${cmd}`,
  ].join('')
}

module.exports.upwardDirContaining = (find, cwd, not) => {
  if (!cwd) {
    cwd = process.env.PWD || process.cwd()
  }
  const parts = cwd.split('/')
  while (parts.length) {
    const newParts = parts
    const ppath = `${newParts.join('/')}/${find}`
    if (shell.test('-f', ppath) || shell.test('-d', ppath)) {
      if (not === undefined || not !== path.basename(path.dirname(ppath))) {
        return path.dirname(ppath)
      }
    }
    parts.pop()
  }
  return false
}

module.exports.initProject = ({assetsBuildDir, gitRoot, cacheDir, binDir}) => {
  if (!shell.test('-d', assetsBuildDir)) {
    shell.mkdir('-p', assetsBuildDir)
    shell.exec(`cd ${path.dirname(gitRoot)} && git ignore ${path.relative(gitRoot, assetsBuildDir)}`)
  }
  if (!shell.test('-d', cacheDir)) {
    shell.mkdir('-p', cacheDir)
    shell.exec(`cd ${path.dirname(gitRoot)} && git ignore ${path.relative(gitRoot, cacheDir)}`)
  }
  if (!shell.test('-d', binDir)) {
    shell.mkdir('-p', binDir)
    shell.exec(`cd ${path.dirname(gitRoot)} && git ignore ${path.relative(gitRoot, binDir)}`)
  }
}

module.exports.writeConfig = cfg => {
  if (!shell.test('-f', `${cfg.runtime.cacheDir}/jekyll.lanyon_assets.yml`)) {
    fs.writeFileSync(`${cfg.runtime.cacheDir}/jekyll.lanyon_assets.yml`, '# this file should be overwritten by the Webpack AssetsPlugin', 'utf-8')
  }
  fs.writeFileSync(`${cfg.runtime.cacheDir}/jekyll.config.yml`, yaml.safeDump(cfg.jekyll), 'utf-8')
  fs.writeFileSync(`${cfg.runtime.cacheDir}/nodemon.config.json`, JSON.stringify(cfg.nodemon, null, '  '), 'utf-8')
  fs.writeFileSync(`${cfg.runtime.cacheDir}/full-config-dump.json`, JSON.stringify(cfg, null, '  '), 'utf-8')
  fs.writeFileSync(`${cfg.runtime.cacheDir}/browsersync.config.js`, `module.exports = require("${cfg.runtime.lanyonDir}/lib/config.js").browsersync`, 'utf-8')
  fs.writeFileSync(`${cfg.runtime.cacheDir}/webpack.config.js`, `module.exports = require("${cfg.runtime.lanyonDir}/lib/config.js").webpack`, 'utf-8')
  fs.writeFileSync(cfg.runtime.recordsPath, JSON.stringify({}, null, '  '), 'utf-8')

  let dBuf = ''
  dBuf += 'FROM ruby:2.3.3-alpine\n'
  dBuf += 'RUN mkdir -p /jekyll\n'
  dBuf += 'WORKDIR /jekyll\n'
  dBuf += 'COPY Gemfile /jekyll/\n'
  dBuf += 'RUN true \\\n'
  dBuf += '  && apk --update add make gcc g++ \\\n'
  dBuf += '  && bundler install --path /jekyll/vendor/bundler \\\n'
  dBuf += '  && bundler update \\\n'
  dBuf += '  && apk del make gcc g++ \\\n'
  dBuf += '  && rm -rf /var/cache/apk/* \\\n'
  dBuf += '  && true\n'
  fs.writeFileSync(`${cfg.runtime.cacheDir}/Dockerfile`, dBuf, 'utf-8')

  let gBuf = 'source \'https://rubygems.org\'\n'
  for (const name in cfg.runtime.gems) {
    const version = cfg.runtime.gems[name]
    gBuf += `gem '${name}', '${version}'\n`
  }
  fs.writeFileSync(path.join(cfg.runtime.cacheDir, 'Gemfile'), gBuf, 'utf-8')
}

module.exports.passthru = ({cacheDir}, cmd, opts) => {
  if (_.isArray(cmd)) {
    cmd = cmd.join(' ')
  }

  opts = _.defaults(opts, {
    'stdio': 'inherit', // ignore
    'cwd'  : cacheDir,
  })

  const p = spawnSync('sh', ['-c', cmd], opts)
  if (p.error || p.status !== 0) {
    console.error(`Error while executing "${cmd}". `)
    process.exit(1)
  }
}

module.exports.fatalExe = cmd => {
  if (_.isArray(cmd)) {
    cmd = cmd.join(' ')
  }
  const opts = { 'silent': true }

  process.stdout.write(`--> Executing: ${cmd} ... `)

  const p = shell.exec(cmd, opts)
  if (p.code !== 0) {
    console.log(no)
    console.error(`Failed to execute: ${cmd}`)
    console.error(p.stdout)
    console.error(p.stderr)
    shell.exit(1)
  }

  console.log(yes)

  return p.stdout.trim()
}

module.exports.satisfied = ({prerequisites, rubyProvidersSkip}, app, cmd, checkOn) => {
  let tag = ''
  if (checkOn === undefined) {
    checkOn = app
  } else {
    tag = `${checkOn}/`
  }

  process.stdout.write(`--> Checking: ${tag}${app} '${prerequisites[app].range}' ... `)

  if (rubyProvidersSkip.indexOf(checkOn) !== -1) {
    console.log(`${no} (disabled via LANYON_SKIP)`)
    return false
  }

  if (!cmd) {
    cmd = `${app} -v`
  }

  const appVersionFull = shell.exec(cmd, { 'silent': false }).stdout.trim()
  const parts = appVersionFull.split(/[,p\s-]+/)
  let appVersion = parts[1]

  if (app === 'node') {
    appVersion = parts[0]
  } else if (app === 'bundler') {
    appVersion = parts[2]
  } else if (app === 'docker') {
    appVersion = parts[2]
  }

  try {
    if (semver.satisfies(appVersion, prerequisites[app].range)) {
      console.log(`${yes + appVersion} (${appVersionFull})`)
      return true
    }
  } catch (e) {
    console.log(`${no + cmd} returned: "${appVersionFull}". ${e}`)
    return false
  }

  console.log(`${no + appVersion} (${appVersionFull})`)
  return false
}
