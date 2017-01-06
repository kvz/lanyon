'use strict';

var semver = require('semver');
var chalk = require('chalk');
var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var yaml = require('js-yaml');
var shell = require('shelljs');
var no = chalk.red('✗ ');
var yes = chalk.green('✓ ');
var spawnSync = require('spawn-sync');

module.exports.preferLocalPackage = function (args, filename, appDir, name, entry, version) {
  var localModulePackage = void 0;
  var absoluteEntry = void 0;
  try {
    localModulePackage = require(appDir + '/node_modules/' + name + '/package.json');
    absoluteEntry = fs.realpathSync(appDir + '/node_modules/' + name + '/' + entry);
  } catch (e) {
    localModulePackage = {};
    absoluteEntry = false;
  } finally {
    if (localModulePackage.version && absoluteEntry) {
      if (filename === absoluteEntry) {
        console.log('--> Booting symlinked ' + name + ' v' + localModulePackage.version);
      } else {
        console.log('--> Booting local ' + name + ' v' + localModulePackage.version);
        var exe = args.shift();
        for (var i in args) {
          // Replace the current entry, e.g. /usr/local/frey/lib/cli.js with the local package
          if (args[i] === filename) {
            args[i] = absoluteEntry;
          }
        }
        spawnSync(exe, args, { stdio: 'inherit' });
        process.exit(0);
      }
    } else {
      console.log('--> Booting local ' + name + ' v' + version);
    }
  }
};

module.exports.dockerCmd = function (_ref, cmd, flags) {
  var cacheDir = _ref.cacheDir,
      projectDir = _ref.projectDir,
      lanyonVersion = _ref.lanyonVersion;

  if (!flags) {
    flags = '';
  }
  return ['docker run', ' ' + flags, ' --rm', ' --workdir ' + cacheDir, ' --user $(id -u)', ' --volume ' + cacheDir + ':' + cacheDir, ' --volume ' + projectDir + ':' + projectDir, ' kevinvz/lanyon:' + lanyonVersion, ' ' + cmd].join('');
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
    shell.exec('cd ' + path.dirname(gitRoot) + ' && git ignore ' + path.relative(gitRoot, assetsBuildDir));
  }
  if (!shell.test('-d', cacheDir)) {
    shell.mkdir('-p', cacheDir);
    shell.exec('cd ' + path.dirname(gitRoot) + ' && git ignore ' + path.relative(gitRoot, cacheDir));
  }
  if (!shell.test('-d', binDir)) {
    shell.mkdir('-p', binDir);
    shell.exec('cd ' + path.dirname(gitRoot) + ' && git ignore ' + path.relative(gitRoot, binDir));
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

  var dBuf = '';
  dBuf += 'FROM ruby:2.3.3-alpine\n';
  dBuf += 'RUN mkdir -p /jekyll\n';
  dBuf += 'WORKDIR /jekyll\n';
  dBuf += 'COPY Gemfile /jekyll/\n';
  dBuf += 'RUN true \\\n';
  dBuf += '  && apk --update add make gcc g++ \\\n';
  dBuf += '  && bundler install --path /jekyll/vendor/bundler \\\n';
  dBuf += '  && bundler update \\\n';
  dBuf += '  && apk del make gcc g++ \\\n';
  dBuf += '  && rm -rf /var/cache/apk/* \\\n';
  dBuf += '  && true\n';
  fs.writeFileSync(cfg.runtime.cacheDir + '/Dockerfile', dBuf, 'utf-8');

  var gBuf = 'source \'https://rubygems.org\'\n';
  for (var name in cfg.runtime.gems) {
    var version = cfg.runtime.gems[name];
    gBuf += 'gem \'' + name + '\', \'' + version + '\'\n';
  }
  fs.writeFileSync(path.join(cfg.runtime.cacheDir, 'Gemfile'), gBuf, 'utf-8');
};

module.exports.passthru = function (_ref3, cmd, opts) {
  var cacheDir = _ref3.cacheDir;

  if (_.isArray(cmd)) {
    cmd = cmd.join(' ');
  }

  opts = _.defaults(opts, {
    'stdio': 'inherit', // ignore
    'cwd': cacheDir
  });

  var p = spawnSync('sh', ['-c', cmd], opts);
  if (p.error || p.status !== 0) {
    console.error('Error while executing "' + cmd + '". ');
    process.exit(1);
  }
};

module.exports.fatalExe = function (cmd) {
  if (_.isArray(cmd)) {
    cmd = cmd.join(' ');
  }
  var opts = { 'silent': true };

  process.stdout.write('--> Executing: ' + cmd + ' ... ');

  var p = shell.exec(cmd, opts);
  if (p.code !== 0) {
    console.log(no);
    console.error('Failed to execute: ' + cmd);
    console.error(p.stdout);
    console.error(p.stderr);
    shell.exit(1);
  }

  console.log(yes);

  return p.stdout.trim();
};

module.exports.satisfied = function (_ref4, app, cmd, checkOn) {
  var prerequisites = _ref4.prerequisites,
      rubyProvidersSkip = _ref4.rubyProvidersSkip;

  var tag = '';
  if (checkOn === undefined) {
    checkOn = app;
  } else {
    tag = checkOn + '/';
  }

  process.stdout.write('--> Checking: ' + tag + app + ' \'' + prerequisites[app].range + '\' ... ');

  if (rubyProvidersSkip.indexOf(checkOn) !== -1) {
    console.log(no + ' (disabled via LANYON_SKIP)');
    return false;
  }

  if (!cmd) {
    cmd = app + ' -v';
  }

  var appVersionFull = shell.exec(cmd, { 'silent': false }).stdout.trim();
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
      console.log(yes + appVersion + ' (' + appVersionFull + ')');
      return true;
    }
  } catch (e) {
    console.log(no + cmd + ' returned: "' + appVersionFull + '". ' + e);
    return false;
  }

  console.log(no + appVersion + ' (' + appVersionFull + ')');
  return false;
};
;

var _temp = function () {
  if (typeof __REACT_HOT_LOADER__ === 'undefined') {
    return;
  }

  __REACT_HOT_LOADER__.register(no, 'no', 'src/utils.js');

  __REACT_HOT_LOADER__.register(yes, 'yes', 'src/utils.js');
}();

;