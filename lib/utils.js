'use strict';

var _templateObject = _taggedTemplateLiteralLoose(['\n    docker run\n      ', '\n      --rm\n      --workdir ', '\n      --user $(id -u)\n      --volume ', ':', '\n      --volume ', ':', '\n    kevinvz/lanyon:', '\n    ', '\n  '], ['\n    docker run\n      ', '\n      --rm\n      --workdir ', '\n      --user $(id -u)\n      --volume ', ':', '\n      --volume ', ':', '\n    kevinvz/lanyon:', '\n    ', '\n  ']),
    _templateObject2 = _taggedTemplateLiteralLoose(['\n    FROM ruby:2.3.3-alpine\n    RUN mkdir -p /jekyll\n    WORKDIR /jekyll\n    COPY Gemfile /jekyll/\n    RUN true \\\n      && apk --update add make gcc g++ \\\n      && bundler install --path /jekyll/vendor/bundler \\\n      && bundler update \\\n      && apk del make gcc g++ \\\n      && rm -rf /var/cache/apk/* \\\n      && true\n  '], ['\n    FROM ruby:2.3.3-alpine\n    RUN mkdir -p /jekyll\n    WORKDIR /jekyll\n    COPY Gemfile /jekyll/\n    RUN true \\\\\n      && apk --update add make gcc g++ \\\\\n      && bundler install --path /jekyll/vendor/bundler \\\\\n      && bundler update \\\\\n      && apk del make gcc g++ \\\\\n      && rm -rf /var/cache/apk/* \\\\\n      && true\n  ']);

function _taggedTemplateLiteralLoose(strings, raw) { strings.raw = raw; return strings; }

var semver = require('semver');
var fs = require('fs');
// const _        = require('lodash')
var path = require('path');
var scrolex = require('scrolex');
var yaml = require('js-yaml');
var shell = require('shelljs');
var spawnSync = require('spawn-sync');
var oneLine = require('common-tags/lib/oneLine');
var stripIndent = require('common-tags/lib/stripIndent');

if (require.main === module) {
  scrolex.failure('Please only used this module via require');
  process.exit(1);
}

module.exports.preferLocalPackage = function (args, filename, appDir, name, entry, version) {
  var localModulePackage = void 0;
  var absoluteEntry = void 0;
  try {
    localModulePackage = require(appDir + '/node_modules/' + name + '/package.json');
    absoluteEntry = fs.realpathSync(appDir + '/node_modules/' + name + '/' + entry);
  } catch (e) {
    localModulePackage = {};
    absoluteEntry = false;
  }

  if (localModulePackage.version && absoluteEntry) {
    if (filename === absoluteEntry) {
      return { type: 'symlinked', version: localModulePackage.version };
    } else {
      // We're entering globally and replacing this with a local instance
      var exe = args.shift();
      for (var i in args) {
        // Replace the current entry, e.g. /usr/local/frey/lib/cli.js with the local package
        if (args[i] === filename) {
          args[i] = absoluteEntry;
        }
      }
      spawnSync(exe, args, { stdio: 'inherit' });
      process.exit(0);
      // return { type: 'local', version: localModulePackage.version }
    }
  } else {
    return { type: 'local', version: version };
  }
};

module.exports.dockerCmd = function (_ref, cmd, flags) {
  var cacheDir = _ref.cacheDir,
      projectDir = _ref.projectDir,
      lanyonVersion = _ref.lanyonVersion;

  if (!flags) {
    flags = '';
  }
  return oneLine(_templateObject, flags, cacheDir, cacheDir, cacheDir, projectDir, projectDir, lanyonVersion, cmd);
};

module.exports.upwardDirContaining = function (find, cwd, not) {
  if (!cwd) {
    cwd = process.env.PWD || process.cwd();
  }
  var parts = cwd.split('/');
  while (parts.length) {
    var newParts = parts;
    var ppath = newParts.join('/') + '/' + find;
    if (shell.test('-f', ppath) || shell.test('-d', ppath)) {
      if (not === undefined || not !== path.basename(path.dirname(ppath))) {
        return path.dirname(ppath);
      }
    }
    parts.pop();
  }
  return false;
};

module.exports.initProject = function (_ref2) {
  var assetsBuildDir = _ref2.assetsBuildDir,
      gitRoot = _ref2.gitRoot,
      cacheDir = _ref2.cacheDir,
      binDir = _ref2.binDir;

  if (!shell.test('-d', assetsBuildDir)) {
    shell.mkdir('-p', assetsBuildDir);
    shell.exec('cd "' + path.dirname(gitRoot) + '" && git ignore "' + path.relative(gitRoot, assetsBuildDir) + '"');
  }
  if (!shell.test('-d', cacheDir)) {
    shell.mkdir('-p', cacheDir);
    shell.exec('cd "' + path.dirname(gitRoot) + '" && git ignore "' + path.relative(gitRoot, cacheDir) + '"');
  }
  if (!shell.test('-d', binDir)) {
    shell.mkdir('-p', binDir);
    shell.exec('cd "' + path.dirname(gitRoot) + '" && git ignore "' + path.relative(gitRoot, binDir) + '"');
  }
};

module.exports.writeConfig = function (cfg) {
  if (!shell.test('-f', cfg.runtime.cacheDir + '/jekyll.lanyon_assets.yml')) {
    fs.writeFileSync(cfg.runtime.cacheDir + '/jekyll.lanyon_assets.yml', '# this file should be overwritten by the Webpack AssetsPlugin', 'utf-8');
  }
  fs.writeFileSync(cfg.runtime.cacheDir + '/jekyll.config.yml', yaml.safeDump(cfg.jekyll), 'utf-8');
  fs.writeFileSync(cfg.runtime.cacheDir + '/nodemon.config.json', JSON.stringify(cfg.nodemon, null, '  '), 'utf-8');
  fs.writeFileSync(cfg.runtime.cacheDir + '/full-config-dump.json', JSON.stringify(cfg, null, '  '), 'utf-8');
  fs.writeFileSync(cfg.runtime.cacheDir + '/browsersync.config.js', 'module.exports = require("' + cfg.runtime.lanyonDir + '/lib/config.js").browsersync', 'utf-8');
  fs.writeFileSync(cfg.runtime.cacheDir + '/webpack.config.js', 'module.exports = require("' + cfg.runtime.lanyonDir + '/lib/config.js").webpack', 'utf-8');
  fs.writeFileSync(cfg.runtime.recordsPath, JSON.stringify({}, null, '  '), 'utf-8');

  var dBuf = stripIndent(_templateObject2);
  fs.writeFileSync(cfg.runtime.cacheDir + '/Dockerfile', dBuf, 'utf-8');

  var gBuf = 'source \'https://rubygems.org\'\n';
  for (var name in cfg.runtime.gems) {
    gBuf += 'gem \'' + name + '\', \'' + cfg.runtime.gems[name] + '\'\n';
  }
  fs.writeFileSync(path.join(cfg.runtime.cacheDir, 'Gemfile'), gBuf, 'utf-8');
};

module.exports.satisfied = function (_ref3, app, cmd, checkOn) {
  var prerequisites = _ref3.prerequisites,
      rubyProvidersSkip = _ref3.rubyProvidersSkip;

  var tag = '';
  if (checkOn === undefined) {
    checkOn = app;
  } else {
    tag = checkOn + '/';
  }

  if (rubyProvidersSkip.indexOf(checkOn) !== -1) {
    scrolex.failure('' + tag + app + ' \'' + prerequisites[app].range + ' disabled via LANYON_SKIP');
    return false;
  }

  if (!cmd) {
    cmd = app + ' -v';
  }

  var p = shell.exec(cmd, { 'silent': true });
  var appVersionFull = p.stdout.trim() || p.stderr.trim();
  var parts = appVersionFull.split(/[,p\s-]+/);
  var appVersion = parts[1];

  if (app === 'node') {
    appVersion = parts[0];
  } else if (app === 'bundler') {
    appVersion = parts[2];
  } else if (app === 'docker') {
    appVersion = parts[2];
  }

  try {
    if (semver.satisfies(appVersion, prerequisites[app].range)) {
      scrolex.stick('' + tag + app + ' \'' + prerequisites[app].range + ' available');
      return true;
    }
  } catch (e) {
    scrolex.failure('' + tag + app + ' \'' + prerequisites[app].range + ' unavailable. output: ' + appVersionFull + '. ' + e);
    return false;
  }

  scrolex.failure('' + tag + app + ' \'' + prerequisites[app].range + ' unavailable. output: ' + appVersionFull);
  return false;
};
;

var _temp = function () {
  if (typeof __REACT_HOT_LOADER__ === 'undefined') {
    return;
  }
}();

;
//# sourceMappingURL=utils.js.map