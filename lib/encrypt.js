'use strict';

var utils = require('./utils');

module.exports = function (runtime, cb) {
  utils.passthru(runtime, '[ -f env.sh ] || (touch env.sh && chmod 600 env.sh && git ignore env.sh)', { cwd: runtime.gitRoot });

  if (!runtime.ghPagesEnv.GHPAGES_URL) {
    return cb(new Error('GHPAGES_URL was not set. Did you source env.sh first?'));
  }

  for (var key in runtime.ghPagesEnv) {
    if (runtime.ghPagesEnv[key]) {
      utils.passthru(runtime, 'travis encrypt --skip-version-check --add env.global ' + key + '=$' + key, { cwd: runtime.gitRoot });
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