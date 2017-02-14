'use strict';

var _templateObject = _taggedTemplateLiteralLoose(['\n        cd "', '" && (\n          ', ' ', ' install ', '\n            --no-rdoc\n            --no-ri\n          bundler -v \'', '\'\n          ', '\n        )\n      '], ['\n        cd "', '" && (\n          ', ' ', ' install ', '\n            --no-rdoc\n            --no-ri\n          bundler -v \'', '\'\n          ', '\n        )\n      ']),
    _templateObject2 = _taggedTemplateLiteralLoose(['\n        cd "', '" && (\n          brew install libxml2;\n          ', ' config build.nokogiri\n            --use-system-libraries\n            --with-xml2-include=$(brew --prefix libxml2 | sed \'s@_[0-9]*$@@\')/include/libxml2\n          ', '\n        )\n      '], ['\n        cd "', '" && (\n          brew install libxml2;\n          ', ' config build.nokogiri\n            --use-system-libraries\n            --with-xml2-include=$(brew --prefix libxml2 | sed \'s@_[0-9]*$@@\')/include/libxml2\n          ', '\n        )\n      ']),
    _templateObject3 = _taggedTemplateLiteralLoose(['\n        cd "', '" && (\n          ', ' config build.nokogiri\n            --use-system-libraries\n          ', '\n        )\n      '], ['\n        cd "', '" && (\n          ', ' config build.nokogiri\n            --use-system-libraries\n          ', '\n        )\n      ']),
    _templateObject4 = _taggedTemplateLiteralLoose(['\n      cd "', '" && (\n        ', ' install\n          --binstubs=\'', '\'\n          --path=\'vendor/bundler\'\n          ', '\n        ||\n        ', ' update\n        ', '\n      )\n    '], ['\n      cd "', '" && (\n        ', ' install\n          --binstubs=\'', '\'\n          --path=\'vendor/bundler\'\n          ', '\n        ||\n        ', ' update\n        ', '\n      )\n    ']),
    _templateObject5 = _taggedTemplateLiteralLoose(['\n    #!/bin/sh -ex\n    cd "', '"\n    (npm run build:production || npm run web:build:production) && (npm run deploy || npm run web:deploy)\n  '], ['\n    #!/bin/sh -ex\n    cd "', '"\n    (npm run build:production || npm run web:build:production) && (npm run deploy || npm run web:deploy)\n  ']);

function _taggedTemplateLiteralLoose(strings, raw) { strings.raw = raw; return strings; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

require('babel-polyfill');
var path = require('path');
var utils = require('./utils');
var shell = require('shelljs');
var os = require('os');
var fs = require('fs');
// var debug      = require('depurar')('lanyon')
var _ = require('lodash');
var oneLine = require('common-tags/lib/oneLine');
var stripIndent = require('common-tags/lib/stripIndent');
var scrolex = require('scrolex').persistOpts({
  announce: true,
  addCommandAsComponent: true,
  components: 'lanyon>install'
});

if (require.main === module) {
  scrolex.failure('Please only used this module via require, or: src/cli.js ' + process.argv[1]);
  process.exit(1);
}

module.exports = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(runtime, cb) {
    var deps, name, envPrefix, passEnv, rubyProvider, buff, cache, localGemArgs, vals, key, val, _name, dep, shim, shimPath;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            // Set prerequisite defaults
            deps = _.cloneDeep(runtime.prerequisites);

            for (name in deps) {
              if (!deps[name].exeSuffix) {
                deps[name].exeSuffix = '';
              }
              if (!deps[name].exe) {
                deps[name].exe = name;
              }
              if (!deps[name].versionCheck) {
                deps[name].versionCheck = deps[name].exe + ' -v';
              }
            }

            envPrefix = '';
            passEnv = {};
            rubyProvider = '';


            if (runtime.lanyonReset) {
              scrolex.stick('Removing existing shims');
              shell.rm('-f', runtime.binDir + '/*');
            }

            if (!utils.satisfied(runtime, 'node')) {
              scrolex.failure('No satisfying node found');
              shell.exit(1);
            }

            // Detmine optimal rubyProvider and adjust shim configuration

            if (!utils.satisfied(runtime, 'ruby', runtime.binDir + '/ruby -v', 'ruby-shim')) {
              _context.next = 20;
              break;
            }

            buff = fs.readFileSync(runtime.binDir + '/ruby', 'utf-8').trim();

            if (buff.indexOf('docker') !== -1) {
              rubyProvider = 'docker';
            } else if (buff.indexOf('rvm') !== -1) {
              rubyProvider = 'rvm';
            } else if (buff.indexOf('rbenv') !== -1) {
              rubyProvider = 'rbenv';
            } else {
              rubyProvider = 'system';
            }
            scrolex.stick('Found a working shim - determined to be a "' + rubyProvider + '" rubyProvider');
            deps.ruby.exe = fs.readFileSync(runtime.binDir + '/ruby', 'utf-8').trim().replace(' $*', '');
            deps.ruby.writeShim = false;
            deps.ruby.versionCheck = deps.ruby.exe + ' -v' + deps.ruby.exeSuffix;
            deps.gem.exe = fs.readFileSync(runtime.binDir + '/gem', 'utf-8').trim().replace(' $*', '');
            deps.gem.writeShim = false;
            deps.bundler.exe = runtime.binDir + '/bundler'; // <-- not a lanyon shim, it's a real gem bin
            deps.bundler.writeShim = false;
            _context.next = 59;
            break;

          case 20:
            if (!utils.satisfied(runtime, 'ruby', undefined, 'system')) {
              _context.next = 26;
              break;
            }

            rubyProvider = 'system';
            deps.gem.exe = shell.which('gem').stdout;
            deps.bundler.exe = shell.which('bundler').stdout;
            _context.next = 59;
            break;

          case 26:
            if (!utils.satisfied(runtime, 'docker')) {
              _context.next = 39;
              break;
            }

            rubyProvider = 'docker';

            if (!(process.env.DOCKER_BUILD === '1')) {
              _context.next = 34;
              break;
            }

            cache = process.env.DOCKER_RESET === '1' ? ' --no-cache' : '';
            _context.next = 32;
            return scrolex.exe('cd "' + runtime.cacheDir + '" && docker build' + cache + ' -t kevinvz/lanyon:' + runtime.lanyonVersion + ' .');

          case 32:
            _context.next = 34;
            return scrolex.exe('cd "' + runtime.cacheDir + '" && docker push kevinvz/lanyon:' + runtime.lanyonVersion);

          case 34:
            deps.sh.exe = utils.dockerCmd(runtime, 'sh', '--interactive --tty');
            deps.ruby.exe = utils.dockerCmd(runtime, 'ruby');
            deps.jekyll.exe = utils.dockerCmd(runtime, 'bundler exec jekyll');
            _context.next = 59;
            break;

          case 39:
            if (!(utils.satisfied(runtime, 'rbenv') && shell.exec('rbenv install --help', { 'silent': true }).code === 0)) {
              _context.next = 48;
              break;
            }

            // rbenv does not offer installing of rubies by default, it will also require the install plugin --^
            rubyProvider = 'rbenv';
            _context.next = 43;
            return scrolex.exe('bash -c "rbenv install --skip-existing \'' + deps.ruby.preferred + '\'"');

          case 43:
            deps.ruby.exe = 'bash -c "eval $(rbenv init -) && rbenv shell \'' + deps.ruby.preferred + '\' &&';
            deps.ruby.exeSuffix = '"';
            deps.ruby.versionCheck = deps.ruby.exe + 'ruby -v' + deps.ruby.exeSuffix;
            _context.next = 59;
            break;

          case 48:
            if (!utils.satisfied(runtime, 'rvm')) {
              _context.next = 57;
              break;
            }

            rubyProvider = 'rvm';
            _context.next = 52;
            return scrolex.exe('bash -c "rvm install \'' + deps.ruby.preferred + '\'"');

          case 52:
            deps.ruby.exe = 'bash -c "rvm \'' + deps.ruby.preferred + '\' exec';
            deps.ruby.exeSuffix = '"';
            deps.ruby.versionCheck = deps.ruby.exe + ' ruby -v' + deps.ruby.exeSuffix;
            _context.next = 59;
            break;

          case 57:
            scrolex.failure('Ruby version not satisfied, and exhausted ruby version installer helpers (rvm, rbenv, brew)');
            process.exit(1);

          case 59:

            // Verify Ruby
            if (!utils.satisfied(runtime, 'ruby', deps.ruby.versionCheck, 'verify')) {
              scrolex.failure('Ruby should have been installed but still not satisfied');
              process.exit(1);
            }

            if (!(rubyProvider !== 'docker')) {
              _context.next = 78;
              break;
            }

            // Install Bundler
            deps.bundler.exe = deps.ruby.exe + ' ' + deps.bundler.exe;

            if (utils.satisfied(runtime, 'bundler', deps.bundler.exe + ' -v' + deps.ruby.exeSuffix)) {
              _context.next = 68;
              break;
            }

            localGemArgs = '';

            if (rubyProvider === 'system') {
              localGemArgs = '--binDir=\'' + runtime.binDir + '\' --install-dir=\'vendor/gem_home\'';
            }

            _context.next = 67;
            return scrolex.exe(oneLine(_templateObject, runtime.cacheDir, deps.ruby.exe, deps.gem.exe, localGemArgs, deps.bundler.preferred, deps.ruby.exeSuffix));

          case 67:

            if (rubyProvider === 'system') {
              deps.bundler.exe = runtime.binDir + '/bundler';
              passEnv.GEM_HOME = 'vendor/gem_home';
              passEnv.GEM_PATH = 'vendor/gem_home';

              if (Object.keys(passEnv).length > 0) {
                vals = [];

                for (key in passEnv) {
                  val = passEnv[key];

                  vals.push(key + '=' + val);
                }
                envPrefix = 'env ' + vals.join(' ') + ' ';
              }

              deps.bundler.exe = envPrefix + deps.bundler.exe;
            }

          case 68:
            if (!(os.platform() === 'darwin' && shell.exec('brew -v', { 'silent': true }).code === 0)) {
              _context.next = 73;
              break;
            }

            _context.next = 71;
            return scrolex.exe(oneLine(_templateObject2, runtime.cacheDir, deps.bundler.exe, deps.ruby.exeSuffix));

          case 71:
            _context.next = 75;
            break;

          case 73:
            _context.next = 75;
            return scrolex.exe(oneLine(_templateObject3, runtime.cacheDir, deps.bundler.exe, deps.ruby.exeSuffix));

          case 75:

            deps.jekyll.exe = deps.bundler.exe + ' exec jekyll';

            // Install Gems from Gemfile bundle
            _context.next = 78;
            return scrolex.exe(oneLine(_templateObject4, runtime.cacheDir, deps.bundler.exe, runtime.binDir, deps.ruby.exeSuffix, deps.bundler.exe, deps.ruby.exeSuffix));

          case 78:

            // Write shims
            for (_name in deps) {
              dep = deps[_name];

              if (dep.writeShim) {
                shim = envPrefix + dep.exe.trim() + ' $*' + deps.ruby.exeSuffix + '\n';

                if (_name === 'dash') {
                  shim = envPrefix + dep.exe.trim() + ' $*' + deps.dash.exeSuffix + '\n';
                }
                shimPath = path.join(runtime.binDir, _name);

                fs.writeFileSync(shimPath, shim, { 'encoding': 'utf-8', 'mode': '755' });
                scrolex.stick('Installed: ' + _name + ' shim to: ' + shimPath + ' ..');
              }
            }

            shimPath = path.join(runtime.binDir, 'deploy');
            scrolex.stick('Installed: deploy shim to: ' + shimPath + ' ..');
            fs.writeFileSync(shimPath, stripIndent(_templateObject5, runtime.projectDir), { 'encoding': 'utf-8', 'mode': '755' });

            if (runtime.lanyonUpdateGemLockfile === true) {
              utils.fsCopySync(runtime.cacheDir + '/Gemfile.lock', runtime.lanyonDir + '/Gemfile.lock');
            }

            cb(null);

          case 84:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();
;

var _temp = function () {
  if (typeof __REACT_HOT_LOADER__ === 'undefined') {
    return;
  }

  __REACT_HOT_LOADER__.register(scrolex, 'scrolex', 'src/install.js');
}();

;
//# sourceMappingURL=install.js.map