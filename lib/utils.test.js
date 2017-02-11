'use strict';

// To allow tests to pass on older platforms: https://travis-ci.org/kvz/lanyon/jobs/200631620#L1079
// require('babel-register')({
//   // This will override `node_modules` ignoring - you can alternatively pass
//   // an array of strings to be explicitly matched or a regex / glob
//   ignore: false,
// })

var utils = require('./utils');
// const debug      = require('depurar')('sut')
var sut = utils;
var cacheDir = 'CACHEDIR';
var projectDir = 'PROJECTDIR';
var lanyonVersion = 'LANYONVERSION';

describe('utils', function () {
  describe('dockerCmd', function () {
    it('should add custom flags', function () {
      var res = sut.dockerCmd({ cacheDir: cacheDir, projectDir: projectDir, lanyonVersion: lanyonVersion }, 'CMD', 'FLAGS');
      expect(res).toMatchSnapshot();
    });
  });
});
;

var _temp = function () {
  if (typeof __REACT_HOT_LOADER__ === 'undefined') {
    return;
  }

  __REACT_HOT_LOADER__.register(sut, 'sut', 'src/utils.test.js');

  __REACT_HOT_LOADER__.register(cacheDir, 'cacheDir', 'src/utils.test.js');

  __REACT_HOT_LOADER__.register(projectDir, 'projectDir', 'src/utils.test.js');

  __REACT_HOT_LOADER__.register(lanyonVersion, 'lanyonVersion', 'src/utils.test.js');
}();

;
//# sourceMappingURL=utils.test.js.map