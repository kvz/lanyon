require('babel-polyfill')
const semver      = require('semver')
const fs          = require('fs')
// const _        = require('lodash')
const path        = require('path')
const _           = require('lodash')
const yaml        = require('js-yaml')
const shell       = require('shelljs')
const spawnSync   = require('spawn-sync')
const oneLine     = require('common-tags/lib/oneLine')
const stripIndent = require('common-tags/lib/stripIndent')
const scrolex     = require('scrolex').persistOpts({
  announce             : true,
  addCommandAsComponent: true,
})

if (require.main === module) {
  scrolex.failure(`Please only used this module via require`)
  process.exit(1)
}

const utils = module.exports

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

module.exports.dockerCmd = ({cacheDir, projectDir, contentBuildDir, lanyonVersion}, cmd, flags) => {
  if (!flags) {
    flags = ''
  }

  let extraVolumes = ''
  if (contentBuildDir.indexOf(projectDir) === -1 ) {
    extraVolumes = `--volume ${contentBuildDir}:${contentBuildDir}`
  }

  return oneLine`
    docker run
      ${flags}
      --user $(id -u)
      --workdir ${cacheDir}
      --volume ${cacheDir}:${cacheDir}
      --volume ${projectDir}:${projectDir}
      ${extraVolumes}
    kevinvz/lanyon:${lanyonVersion}
    ${cmd}
  `
}

module.exports.runhooks = async (order, cmdName, runtime) => {
  let arr = []

  arr = [
    `${order}${cmdName}`,
    `${order}${cmdName}:production`,
    `${order}${cmdName}:development`,
  ]

  const collectStdout = {}
  for (let i in arr) {
    let hook = arr[i]
    if (runtime[hook]) {
      const lastPart = hook.split(':').pop()
      let needEnv    = 'both'

      if (lastPart === 'production') {
        needEnv = lastPart
      }
      if (lastPart === 'development') {
        needEnv = lastPart
      }

      if (needEnv === 'both' || runtime.lanyonEnv === needEnv) {
        let squashedHooks = runtime[hook]
        if (_.isArray(runtime[hook])) {
          squashedHooks = runtime[hook].join(' && ')
        }
        collectStdout[hook] = await scrolex.exe(squashedHooks, {
          cwd : runtime.projectDir,
          mode: (process.env.SCROLEX_MODE || 'singlescroll'),
        })
      }
    }
  }

  return collectStdout
}

module.exports.upwardDirContaining = (find, cwd, not) => {
  if (!cwd) {
    cwd = process.env.PWD || process.cwd()
  }
  const parts = cwd.split('/')
  while (parts.length) {
    const newParts = parts
    const ppath = `${newParts.join('/')}/${find}`
    if (fs.existsSync(ppath)) {
      if (not === undefined || not !== path.basename(path.dirname(ppath))) {
        return path.dirname(ppath)
      }
    }
    parts.pop()
  }
  return false
}

module.exports.initProject = ({assetsBuildDir, gitRoot, cacheDir, binDir}) => {
  if (!fs.existsSync(assetsBuildDir)) {
    shell.mkdir('-p', assetsBuildDir)
    shell.exec(`cd "${path.dirname(gitRoot)}" && git ignore "${path.relative(gitRoot, assetsBuildDir)}"`)
  }
  if (!fs.existsSync(cacheDir)) {
    shell.mkdir('-p', cacheDir)
    shell.exec(`cd "${path.dirname(gitRoot)}" && git ignore "${path.relative(gitRoot, cacheDir)}"`)
  }
  if (!fs.existsSync(binDir)) {
    shell.mkdir('-p', binDir)
    shell.exec(`cd "${path.dirname(gitRoot)}" && git ignore "${path.relative(gitRoot, binDir)}"`)
  }
}

module.exports.fsCopySync = (src, dst, { mode = '644', encoding = 'utf-8' } = {}) => {
  fs.writeFileSync(`${dst}`, fs.readFileSync(`${src}`, 'utf-8'), { mode, encoding })
}

module.exports.writeConfig = (cfg) => {
  if (!fs.existsSync(`${cfg.runtime.cacheDir}/jekyll.lanyon_assets.yml`)) {
    fs.writeFileSync(`${cfg.runtime.cacheDir}/jekyll.lanyon_assets.yml`, '# this file should be overwritten by the Webpack AssetsPlugin', 'utf-8')
  }
  utils.fsCopySync(`${cfg.runtime.lanyonDir}/Gemfile.lock`, `${cfg.runtime.cacheDir}/Gemfile.lock`)
  try {
    fs.writeFileSync(`${cfg.runtime.cacheDir}/jekyll.config.yml`, yaml.safeDump(cfg.jekyll), 'utf-8')
  } catch (e) {
    console.error({jekyll: cfg.jekyll})
    throw new Error(`Unable to write above config to ${cfg.runtime.cacheDir}/jekyll.config.yml. ${e.message}`)
  }
  fs.writeFileSync(`${cfg.runtime.cacheDir}/nodemon.config.json`, JSON.stringify(cfg.nodemon, null, '  '), 'utf-8')
  fs.writeFileSync(`${cfg.runtime.cacheDir}/full-config-dump.json`, JSON.stringify(cfg, null, '  '), 'utf-8')
  fs.writeFileSync(`${cfg.runtime.cacheDir}/browsersync.config.js`, `module.exports = require("${cfg.runtime.lanyonDir}/lib/config.js").browsersync`, 'utf-8')
  fs.writeFileSync(`${cfg.runtime.cacheDir}/webpack.config.js`, `module.exports = require("${cfg.runtime.lanyonDir}/lib/config.js").webpack`, 'utf-8')
  fs.writeFileSync(cfg.runtime.recordsPath, JSON.stringify({}, null, '  '), 'utf-8')

  let dBuf = stripIndent`
    FROM ruby:2.3.3-alpine
    RUN mkdir -p /jekyll
    WORKDIR /jekyll
    ENV BUNDLE_APP_CONFIG /jekyll
    RUN { \\
      echo '---'; \\
      echo 'BUNDLE_PATH: "/jekyll/vendor/bundler"'; \\
      echo 'BUNDLE_DISABLE_SHARED_GEMS: "true"'; \\
    } >> /jekyll/config
    COPY Gemfile /jekyll/
    COPY Gemfile.lock /jekyll/
    RUN true \\
      && apk --update add make gcc g++ \\
      && (bundler install --force --path /jekyll/vendor/bundler || bundler update) \\
      && rm -rf /var/cache/apk/* \\
      && chmod 777 /jekyll/config \\
      && true
  `
  fs.writeFileSync(`${cfg.runtime.cacheDir}/Dockerfile`, dBuf, 'utf-8')

  let gBuf = `source 'http://rubygems.org'\n`
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
  const parts          = appVersionFull.replace(/0+(\d)/g, '$1').split(/[,p\s-]+/)
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
