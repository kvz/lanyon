#!/usr/bin/env node
'use strict';

require('babel-polyfill');
var scrolex = require('scrolex').persistOpts({
  announce: true,
  addCommandAsComponent: true,
  components: 'lanyon>cli'
});

if (require.main !== module) {
  scrolex.failure('Please only used this module on the commandline: node src/cli.js');
  process.exit(1);
}

require('./boot')();
;

var _temp = function () {
  if (typeof __REACT_HOT_LOADER__ === 'undefined') {
    return;
  }

  __REACT_HOT_LOADER__.register(scrolex, 'scrolex', 'src/cli.js');
}();

;
//# sourceMappingURL=cli.js.map