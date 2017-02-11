const semver      = require('semver')
const fs          = require('fs')
// const _        = require('lodash')
const path        = require('path')
const scrolex     = require('scrolex')
const yaml        = require('js-yaml')
const shell       = require('shelljs')
const spawnSync   = require('spawn-sync')
const oneLine     = require('common-tags/lib/oneLine')
const stripIndent = require('common-tags/lib/stripIndent')

if (require.main === module) {
  scrolex.failure(`Please only used this module via require`)
  process.exit(1)
}

module.exports.preferLocalPackage = (args, filename, appDir, name, entry, version) => {
  let localModulePackage
  let absoluteEntry
  try {
    localModulePackage = require(`${appDir}/node_modules/${name}/package.json`)
    absoluteEntry      = fs.realpathSync(`${appDir}/node_modules/${name}/${entry}`)
  } catch (e) {
    localModulePackage = {}
    absoluteEntry      = false
  }

  if (localModulePackage.version && absoluteEntry) {
    if (filename === absoluteEntry) {
      return { type: 'symlinked', version: localModulePackage.version }
    } else {
      // We're entering globally and replacing this with a local instance
      const exe = args.shift()
      for (const i in args) {
        // Replace the current entry, e.g. /usr/local/frey/lib/cli.js with the local package
        if (args[i] === filename) {
          args[i] = absoluteEntry
        }
      }
      spawnSync(exe, args, { stdio: 'inherit' })
      process.exit(0)
      // return { type: 'local', version: localModulePackage.version }
    }
  } else {
    return { type: 'local', version: version }
  }
}

module.exports.dockerCmd = ({cacheDir, projectDir, lanyonVersion}, cmd, flags) => {
  if (!flags) {
    flags = ''
  }
  return oneLine`
    docker run
      ${flags}
      --rm
      --workdir ${cacheDir}
      --user $(id -u)
      --volume ${cacheDir}:${cacheDir}
      --volume ${projectDir}:${projectDir}
    kevinvz/lanyon:${lanyonVersion}
    ${cmd}
  `
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
    shell.exec(`cd "${path.dirname(gitRoot)}" && git ignore "${path.relative(gitRoot, assetsBuildDir)}"`)
  }
  if (!shell.test('-d', cacheDir)) {
    shell.mkdir('-p', cacheDir)
    shell.exec(`cd "${path.dirname(gitRoot)}" && git ignore "${path.relative(gitRoot, cacheDir)}"`)
  }
  if (!shell.test('-d', binDir)) {
    shell.mkdir('-p', binDir)
    shell.exec(`cd "${path.dirname(gitRoot)}" && git ignore "${path.relative(gitRoot, binDir)}"`)
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

  let dBuf = stripIndent`
    FROM ruby:2.3.3-alpine
    RUN mkdir -p /jekyll
    WORKDIR /jekyll
    COPY Gemfile /jekyll/
    RUN true \\
      && apk --update add make gcc g++ \\
      && bundler install --path /jekyll/vendor/bundler \\
      && bundler update \\
      && apk del make gcc g++ \\
      && rm -rf /var/cache/apk/* \\
      && true
  `
  fs.writeFileSync(`${cfg.runtime.cacheDir}/Dockerfile`, dBuf, 'utf-8')

  let gBuf = `source 'https://rubygems.org'\n`
  for (let name in cfg.runtime.gems) {
    gBuf += `gem '${name}', '${cfg.runtime.gems[name]}'\n`
  }
  fs.writeFileSync(path.join(cfg.runtime.cacheDir, 'Gemfile'), gBuf, 'utf-8')
}

module.exports.satisfied = ({prerequisites, rubyProvidersSkip}, app, cmd, checkOn) => {
  let tag = ''
  if (checkOn === undefined) {
    checkOn = app
  } else {
    tag = `${checkOn}/`
  }

  if (rubyProvidersSkip.indexOf(checkOn) !== -1) {
    scrolex.failure(`${tag}${app} '${prerequisites[app].range} disabled via LANYON_SKIP`)
    return false
  }

  if (!cmd) {
    cmd = `${app} -v`
  }

  const p              = shell.exec(cmd, { 'silent': true })
  const appVersionFull = p.stdout.trim() || p.stderr.trim()
  const parts          = appVersionFull.split(/[,p\s-]+/)
  let appVersion       = parts[1]

  if (app === 'node') {
    appVersion = parts[0]
  } else if (app === 'bundler') {
    appVersion = parts[2]
  } else if (app === 'docker') {
    appVersion = parts[2]
  }

  try {
    if (semver.satisfies(appVersion, prerequisites[app].range)) {
      scrolex.stick(`${tag}${app} '${prerequisites[app].range} available`)
      return true
    }
  } catch (e) {
    scrolex.failure(`${tag}${app} '${prerequisites[app].range} unavailable. output: ${appVersionFull}. ${e}`)
    return false
  }

  scrolex.failure(`${tag}${app} '${prerequisites[app].range} unavailable. output: ${appVersionFull}`)
  return false
}
