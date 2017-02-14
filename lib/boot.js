'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

require('babel-polyfill');
module.exports = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(whichPackage) {
    var _this = this;

    var _, config, utils, fs, scrolex, runtime, scripts, cmdName, cmd;

    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _ = require('lodash');
            config = require('./config');
            utils = require('./utils');
            fs = require('fs');
            scrolex = require('scrolex');
            runtime = config.runtime;
            scripts = {
              'build:assets': 'webpack --config [cacheDir]/webpack.config.js',
              'build:content:incremental': 'jekyll build --incremental --source [projectDir] --destination [contentBuildDir] --verbose --config [projectDir]/_config.yml,[cacheDir]/jekyll.config.yml,[cacheDir]/jekyll.lanyon_assets.yml',
              'build:content:watch': 'nodemon --config [cacheDir]/nodemon.config.json --exec "[lanyon] build:content:incremental' + '"',
              'build:content': 'jekyll build --source [projectDir] --destination [contentBuildDir] --verbose --config [projectDir]/_config.yml,[cacheDir]/jekyll.config.yml,[cacheDir]/jekyll.lanyon_assets.yml',
              // @todo: useless until we have: https://github.com/imagemin/imagemin-cli/pull/11 and https://github.com/imagemin/imagemin/issues/226
              // 'build:images'             : 'imagemin [projectDir]/assets/images --out-dir=[projectDir]/assets/build/images',
              'build': '[lanyon] build:assets && [lanyon] build:content', // <-- parrallel won't work for production builds, jekyll needs to copy assets into _site
              'container:connect': utils.dockerCmd(runtime, 'sh', '--interactive --tty'),
              'deploy': require('./deploy'),
              'encrypt': require('./encrypt'),
              'help': 'jekyll build --help',
              'list:ghpgems': 'bundler exec github-pages versions --gem',
              'install': require('./install'),
              'serve': 'browser-sync start --config [cacheDir]/browsersync.config.js',
              'start': '[lanyon] build:assets && [lanyon] build:content:incremental && parallelshell "[lanyon] build:content:watch" "[lanyon] serve"'
            };


            if (runtime.trace) {
              scripts['build:content:incremental'] += ' --trace';
              scripts['build:content'] += ' --trace';
            }

            cmdName = process.argv[2];
            cmd = scripts[cmdName];


            scrolex.persistOpts({
              announce: true,
              addCommandAsComponent: true,
              components: 'lanyon>' + cmdName,
              env: _extends({}, process.env, {
                NODE_ENV: runtime.lanyonEnv,
                JEKYLL_ENV: runtime.lanyonEnv,
                LANYON_PROJECT: runtime.projectDir })
            });

            if (require.main === module) {
              scrolex.failure('Please only used this module via require');
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
              ['prebuild', 'prebuild:production', 'prebuild:development'].forEach(function () {
                var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee(hook) {
                  var needEnv, squashedHooks;
                  return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          if (!runtime[hook]) {
                            _context.next = 7;
                            break;
                          }

                          needEnv = hook.split(':')[1];

                          if (!(!needEnv || runtime.lanyonEnv === needEnv)) {
                            _context.next = 7;
                            break;
                          }

                          squashedHooks = runtime[hook];

                          if (_.isArray(runtime[hook])) {
                            squashedHooks = runtime[hook].join(' && ');
                          }
                          _context.next = 7;
                          return scrolex.exe(squashedHooks, {
                            cwd: runtime.projectDir
                          });

                        case 7:
                        case 'end':
                          return _context.stop();
                      }
                    }
                  }, _callee, _this);
                }));

                return function (_x2) {
                  return _ref2.apply(this, arguments);
                };
              }());
            }

            // Write all config files to cacheDir
            scrolex.stick('Writing configs');
            utils.writeConfig(config);

            // Run cmd arg

            if (!_.isFunction(cmd)) {
              _context3.next = 25;
              break;
            }

            scrolex.stick('Running ' + cmdName + ' function');
            cmd(runtime, function (err) {
              if (err) {
                scrolex.failure(cmdName + ' function exited with error ' + err);
                process.exit(1);
              }
              scrolex.stick(cmdName + ' done');
            });
            _context3.next = 30;
            break;

          case 25:
            if (!_.isString(cmd)) {
              _context3.next = 29;
              break;
            }

            return _context3.delegateYield(regeneratorRuntime.mark(function _callee2() {
              var npmBins, _loop, name;

              return regeneratorRuntime.wrap(function _callee2$(_context2) {
                while (1) {
                  switch (_context2.prev = _context2.next) {
                    case 0:
                      cmd = cmd.replace(/\[lanyon]/g, 'node ' + __dirname + '/cli.js'); // eslint-disable-line no-path-concat
                      cmd = cmd.replace(/\[lanyonDir]/g, runtime.lanyonDir);
                      cmd = cmd.replace(/\[contentBuildDir]/g, runtime.contentBuildDir);
                      cmd = cmd.replace(/\[projectDir]/g, runtime.projectDir);
                      cmd = cmd.replace(/\[cacheDir]/g, runtime.cacheDir);

                      npmBins = {
                        'browser-sync': '/node_modules/browser-sync/bin/browser-sync.js',
                        'webpack': '/node_modules/webpack/bin/webpack.js',
                        // 'imagemin'     : '/node_modules/imagemin-cli/cli.js',
                        'nodemon': '/node_modules/nodemon/bin/nodemon.js',
                        'npm-run-all': '/node_modules/npm-run-all/bin/npm-run-all/index.js',
                        'parallelshell': '/node_modules/parallelshell/index.js'
                      };

                      _loop = function _loop(name) {
                        var tests = [runtime.lanyonDir + npmBins[name], runtime.gitRoot + npmBins[name], runtime.projectDir + npmBins[name], runtime.projectDir + '/..' + npmBins[name]];

                        var found = false;
                        tests.forEach(function (test) {
                          if (fs.existsSync(test)) {
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

                      for (name in npmBins) {
                        _loop(name);
                      }

                      cmd = cmd.replace(/(\s|^)jekyll(\s|$)/, '$1' + runtime.binDir + '/jekyll$2');
                      cmd = cmd.replace(/(\s|^)bundler(\s|$)/, '$1' + runtime.binDir + '/bundler$2');

                      _context2.next = 12;
                      return scrolex.exe(cmd, {
                        cwd: runtime.cacheDir,
                        stdio: cmdName.match(/^container:/) ? 'inherit' : 'pipe',
                        mode: cmd.indexOf(__dirname) === -1 && !cmdName.match(/^container:/) ? process.env.SCROLEX_MODE || 'singlescroll' : 'passthru'
                      });

                    case 12:
                    case 'end':
                      return _context2.stop();
                  }
                }
              }, _callee2, _this);
            })(), 't0', 27);

          case 27:
            _context3.next = 30;
            break;

          case 29:
            scrolex.failure('"' + cmdName + '" is not a valid Lanyon command. Pick from: ' + Object.keys(scripts).join(', ') + '.');

          case 30:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  function boot(_x) {
    return _ref.apply(this, arguments);
  }

  return boot;
}();
;

var _temp = function () {
  if (typeof __REACT_HOT_LOADER__ === 'undefined') {
    return;
  }
}();

;
//# sourceMappingURL=boot.js.map