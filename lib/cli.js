#!/usr/bin/env node
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var utils = require('./utils');
var whichPackage = utils.preferLocalPackage(process.argv, __filename, process.cwd(), 'lanyon', 'lib/cli.js', require('../package.json').version);
var _ = require('lodash');
var config = require('./config');
var shell = require('shelljs');
var scrolex = require('scrolex');
var runtime = config.runtime;
// var debug         = require('depurar')('lanyon')

var scripts = {
  'build:assets': 'webpack --config [cacheDir]/webpack.config.js',
  'build:content:incremental': 'jekyll build --incremental --source [projectDir] --destination [contentBuildDir] --verbose --config [projectDir]/_config.yml,[cacheDir]/jekyll.config.yml,[cacheDir]/jekyll.lanyon_assets.yml',
  'build:content:watch': 'nodemon --config [cacheDir]/nodemon.config.json --exec "[lanyon] build:content:incremental' + '"',
  'build:content': 'jekyll build --source [projectDir] --destination [contentBuildDir] --verbose --config [projectDir]/_config.yml,[cacheDir]/jekyll.config.yml,[cacheDir]/jekyll.lanyon_assets.yml',
  // @todo: useless until we have: https://github.com/imagemin/imagemin-cli/pull/11 and https://github.com/imagemin/imagemin/issues/226
  'build:images': 'imagemin [projectDir]/assets/images --out-dir=[projectDir]/assets/build/images',
  'build': '[lanyon] build:assets && [lanyon] build:content', // <-- parrallel won't work for production builds, jekyll needs to copy assets into _site
  'container:connect': utils.dockerCmd(runtime, 'sh', '--interactive --tty'),
  'deploy': require(__dirname + '/deploy'),
  'encrypt': require(__dirname + '/encrypt'),
  'help': 'jekyll build --help',
  'list:ghpgems': 'bundler exec github-pages versions --gem',
  'install': require(__dirname + '/install'),
  'serve': 'browser-sync start --config [cacheDir]/browsersync.config.js',
  'start': '[lanyon] build:assets && [lanyon] build:content:incremental && parallelshell "[lanyon] build:content:watch" "[lanyon] serve"'
};

if (runtime.trace) {
  scripts['build:content:incremental'] += ' --trace';
  scripts['build:content'] += ' --trace';
}

var cmdName = process.argv[2];
var cmd = scripts[cmdName];

scrolex.persistOpts({
  announce: true,
  addCommandAsComponent: true,
  components: 'lanyon>' + cmdName,
  env: _extends({}, process.env, {
    NODE_ENV: runtime.lanyonEnv,
    JEKYLL_ENV: runtime.lanyonEnv,
    LANYON_PROJECT: runtime.projectDir })
});

if (require.main !== module) {
  scrolex.failure('Please only used this module the commandline: node src/cli.js');
  process.exit(1);
}

scrolex.stick('Booting ' + whichPackage.type + ' Lanyon->' + cmdName + '. Version: ' + whichPackage.version + ' on PID: ' + process.pid + ' from: ' + __filename);
scrolex.stick('Detected cacheDir as "' + runtime.cacheDir + '"');
scrolex.stick('Detected gitRoot as "' + runtime.gitRoot + '"');
scrolex.stick('Detected npmRoot as "' + runtime.npmRoot + '"');

// Create asset dirs and git ignores
if (cmdName.match(/^build|install|start/)) {
  utils.initProject(runtime);
}

// Run Hooks
if (cmdName.match(/^build:(assets|content)/)) {
  ['prebuild', 'prebuild:production', 'prebuild:development'].forEach(function (hook) {
    if (runtime[hook]) {
      var needEnv = hook.split(':')[1];
      if (!needEnv || runtime.lanyonEnv === needEnv) {
        var squashedHooks = runtime[hook];
        if (_.isArray(runtime[hook])) {
          squashedHooks = runtime[hook].join(' && ');
        }
        scrolex.exe(squashedHooks, {
          cwd: runtime.projectDir
        });
        // scrolex.stick(`${hook} done`)
      }
    }
  });
}

// Write all config files to cacheDir
scrolex.stick('Writing configs');
utils.writeConfig(config);

// Run cmd arg
if (_.isFunction(cmd)) {
  scrolex.stick('Running ' + cmdName + ' function');
  cmd(runtime, function (err) {
    if (err) {
      scrolex.failure(cmdName + ' function exited with error ' + err);
      process.exit(1);
    }
    scrolex.stick(cmdName + ' done');
  });
} else if (_.isString(cmd)) {
  (function () {
    cmd = cmd.replace(/\[lanyon]/g, 'node ' + __filename); // eslint-disable-line no-path-concat
    cmd = cmd.replace(/\[lanyonDir]/g, runtime.lanyonDir);
    cmd = cmd.replace(/\[contentBuildDir]/g, runtime.contentBuildDir);
    cmd = cmd.replace(/\[projectDir]/g, runtime.projectDir);
    cmd = cmd.replace(/\[cacheDir]/g, runtime.cacheDir);

    var npmBins = {
      'browser-sync': '/node_modules/browser-sync/bin/browser-sync.js',
      'webpack': '/node_modules/webpack/bin/webpack.js',
      'imagemin': '/node_modules/imagemin-cli/cli.js',
      'nodemon': '/node_modules/nodemon/bin/nodemon.js',
      'npm-run-all': '/node_modules/npm-run-all/bin/npm-run-all/index.js',
      'parallelshell': '/node_modules/parallelshell/index.js'
    };

    var _loop = function _loop(name) {
      var tests = [runtime.lanyonDir + npmBins[name], runtime.gitRoot + npmBins[name], runtime.projectDir + npmBins[name], runtime.projectDir + '/..' + npmBins[name]];

      var found = false;
      tests.forEach(function (test) {
        if (shell.test('-f', test)) {
          npmBins[name] = test;
          found = true;
        }
      });

      if (!found) {
        throw new Error('Cannot find dependency "' + name + '" in "' + tests.join('", "') + '"');
      }
      var pat = new RegExp('(\\s|^)' + name + '(\\s|$)');
      cmd = cmd.replace(pat, '$1node ' + npmBins[name] + '$2');
    };

    for (var name in npmBins) {
      _loop(name);
    }

    cmd = cmd.replace(/(\s|^)jekyll(\s|$)/, '$1' + runtime.binDir + '/jekyll$2');
    cmd = cmd.replace(/(\s|^)bundler(\s|$)/, '$1' + runtime.binDir + '/bundler$2');

    scrolex.exe(cmd, {
      cwd: runtime.cacheDir,
      stdio: cmdName.match(/^container:/) ? 'inherit' : 'pipe',
      mode: cmd.indexOf(__filename) === -1 && !cmdName.match(/^container:/) ? process.env.SCROLEX_MODE || 'singlescroll' : 'passthru'
    });
  })();
} else {
  scrolex.failure('"' + cmdName + '" is not a valid Lanyon command. Pick from: ' + Object.keys(scripts).join(', ') + '.');
}
;

var _temp = function () {
  if (typeof __REACT_HOT_LOADER__ === 'undefined') {
    return;
  }

  __REACT_HOT_LOADER__.register(whichPackage, 'whichPackage', 'src/cli.js');

  __REACT_HOT_LOADER__.register(runtime, 'runtime', 'src/cli.js');

  __REACT_HOT_LOADER__.register(scripts, 'scripts', 'src/cli.js');

  __REACT_HOT_LOADER__.register(cmdName, 'cmdName', 'src/cli.js');

  __REACT_HOT_LOADER__.register(cmd, 'cmd', 'src/cli.js');
}();

;
//# sourceMappingURL=cli.js.map