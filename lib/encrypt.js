'use strict';

// const utils = require('./utils')
var scrolex = require('scrolex');

if (require.main === module) {
  scrolex.failure('Please only used this module via require, or: src/cli.js ' + process.argv[1]);
  process.exit(1);
}

module.exports = function (runtime, cb) {
  scrolex.exe('[ -f env.sh ] || (touch env.sh && chmod 600 env.sh && git ignore env.sh)', { cwd: runtime.gitRoot, components: 'lanyon>encrypt' });

  if (!runtime.ghPagesEnv.GHPAGES_URL) {
    return cb(new Error('GHPAGES_URL was not set. Did you source env.sh first?'));
  }

  for (var key in runtime.ghPagesEnv) {
    if (runtime.ghPagesEnv[key]) {
      scrolex.exe('travis encrypt --skip-version-check --add env.global ' + key + '=$' + key, { cwd: runtime.gitRoot, components: 'lanyon>encrypt' });
    }
  }

  cb(null);
};
;

var _temp = function () {
  if (typeof __REACT_HOT_LOADER__ === 'undefined') {
    return;
  }
}();

;
//# sourceMappingURL=encrypt.js.map