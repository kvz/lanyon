'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

require('babel-polyfill');
var fs = require('fs');
var globby = require('globby');
var scrolex = require('scrolex').persistOpts({
  announce: true,
  addCommandAsComponent: true,
  components: 'lanyon>deploy'
});

if (require.main === module) {
  scrolex.failure('Please only used this module via require, or: src/cli.js ' + process.argv[1]);
  process.exit(1);
}

module.exports = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(runtime, cb) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!runtime.onTravis) {
              _context.next = 9;
              break;
            }

            if (!runtime.ghPagesEnv.GHPAGES_BOTNAME) {
              _context.next = 5;
              break;
            }

            scrolex.stick('Setting up GHPAGES_BOTNAME');
            _context.next = 5;
            return scrolex.exe('git config --global user.name "' + runtime.ghPagesEnv.GHPAGES_BOTNAME + '"', { cwd: runtime.contentBuildDir });

          case 5:
            if (!runtime.ghPagesEnv.GHPAGES_BOTEMAIL) {
              _context.next = 9;
              break;
            }

            scrolex.stick('Setting up GHPAGES_BOTNAME');
            _context.next = 9;
            return scrolex.exe('git config --global user.email "' + runtime.ghPagesEnv.GHPAGES_BOTEMAIL + '"', { cwd: runtime.contentBuildDir });

          case 9:
            if (runtime.ghPagesEnv.GHPAGES_URL) {
              _context.next = 11;
              break;
            }

            return _context.abrupt('return', cb(new Error('GHPAGES_URL was not set. Did you source env.sh? Did you encrypt it with Travis?')));

          case 11:
            if (globby.sync(runtime.contentBuildDir + '/assets/build/app*.js').length) {
              _context.next = 13;
              break;
            }

            return _context.abrupt('return', cb(new Error('I refuse to deploy if there is no ' + runtime.contentBuildDir + '/assets/build/app*.js - build:production first!')));

          case 13:
            if (!fs.existsSync(runtime.contentBuildDir + '/env.sh')) {
              _context.next = 15;
              break;
            }

            return _context.abrupt('return', cb(new Error('I refuse to deploy if while ' + runtime.contentBuildDir + '/env.sh exists - secure your build first!')));

          case 15:
            if (fs.existsSync(runtime.contentBuildDir + '/.git')) {
              _context.next = 18;
              break;
            }

            _context.next = 18;
            return scrolex.exe('git init', { cwd: runtime.contentBuildDir });

          case 18:

            fs.writeFileSync(runtime.contentBuildDir + '/README.md', 'This branch is just a deploy target. Do not edit. You changes will be lost.', 'utf-8');
            _context.next = 21;
            return scrolex.exe('git checkout -B gh-pages', { cwd: runtime.contentBuildDir });

          case 21:
            _context.next = 23;
            return scrolex.exe('git add --all .', { cwd: runtime.contentBuildDir });

          case 23:
            _context.next = 25;
            return scrolex.exe('git commit -nm "Update website by $USER" || true', { cwd: runtime.contentBuildDir });

          case 25:
            _context.next = 27;
            return scrolex.exe('git remote add origin ' + runtime.ghPagesEnv.GHPAGES_URL + ' 2> /dev/null || true', { cwd: runtime.contentBuildDir });

          case 27:
            _context.next = 29;
            return scrolex.exe('git remote set-url origin ' + runtime.ghPagesEnv.GHPAGES_URL, { cwd: runtime.contentBuildDir });

          case 29:
            _context.next = 31;
            return scrolex.exe('git push origin gh-pages:refs/heads/gh-pages 2> /dev/null || git push origin gh-pages:refs/heads/gh-pages --force > /dev/null', { cwd: runtime.contentBuildDir });

          case 31:
            cb(null);

          case 32:
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

  __REACT_HOT_LOADER__.register(scrolex, 'scrolex', 'src/deploy.js');
}();

;
//# sourceMappingURL=deploy.js.map