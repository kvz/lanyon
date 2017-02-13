'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

require('babel-polyfill');
// const utils = require('./utils')
var scrolex = require('scrolex').persistOpts({
  announce: true,
  addCommandAsComponent: true,
  components: 'lanyon>encrypt'
});

if (require.main === module) {
  scrolex.failure('Please only used this module via require, or: src/cli.js ' + process.argv[1]);
  process.exit(1);
}

module.exports = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(runtime, cb) {
    var key;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return scrolex.exe('[ -f env.sh ] || (touch env.sh && chmod 600 env.sh && git ignore env.sh)', { cwd: runtime.gitRoot, components: 'lanyon>encrypt' });

          case 2:
            if (runtime.ghPagesEnv.GHPAGES_URL) {
              _context.next = 4;
              break;
            }

            return _context.abrupt('return', cb(new Error('GHPAGES_URL was not set. Did you source env.sh first?')));

          case 4:
            _context.t0 = regeneratorRuntime.keys(runtime.ghPagesEnv);

          case 5:
            if ((_context.t1 = _context.t0()).done) {
              _context.next = 12;
              break;
            }

            key = _context.t1.value;

            if (!runtime.ghPagesEnv[key]) {
              _context.next = 10;
              break;
            }

            _context.next = 10;
            return scrolex.exe('travis encrypt --skip-version-check --add env.global ' + key + '=$' + key, { cwd: runtime.gitRoot, components: 'lanyon>encrypt' });

          case 10:
            _context.next = 5;
            break;

          case 12:

            cb(null);

          case 13:
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

  __REACT_HOT_LOADER__.register(scrolex, 'scrolex', 'src/encrypt.js');
}();

;
//# sourceMappingURL=encrypt.js.map