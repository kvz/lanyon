'use strict';

var utils = require('./utils');
var shell = require('shelljs');
var fs = require('fs');
var globby = require('globby');

module.exports = function (runtime, cb) {
  if (runtime.onTravis) {
    if (runtime.ghPagesEnv.GHPAGES_BOTNAME) {
      console.log('--> Setting up GHPAGES_BOTNAME');
      utils.passthru(runtime, 'git config --global user.name "' + runtime.ghPagesEnv.GHPAGES_BOTNAME + '"', { cwd: runtime.contentBuildDir });
    }
    if (runtime.ghPagesEnv.GHPAGES_BOTEMAIL) {
      console.log('--> Setting up GHPAGES_BOTNAME');
      utils.passthru(runtime, 'git config --global user.email "' + runtime.ghPagesEnv.GHPAGES_BOTEMAIL + '"', { cwd: runtime.contentBuildDir });
    }
  }

  if (!runtime.ghPagesEnv.GHPAGES_URL) {
    return cb(new Error('GHPAGES_URL was not set. Did you source env.sh? Did you encrypt it with Travis?'));
  }

  if (!globby.sync(runtime.contentBuildDir + '/assets/build/app*.js').length) {
    return cb(new Error('I refuse to deploy if there is no ' + runtime.contentBuildDir + '/assets/build/app*.js - build:production first!'));
  }
  if (shell.test('-f', runtime.contentBuildDir + '/env.sh')) {
    return cb(new Error('I refuse to deploy if while ' + runtime.contentBuildDir + '/env.sh exists - secure your build first!'));
  }
  if (!shell.test('-d', runtime.contentBuildDir + '/.git')) {
    utils.passthru(runtime, 'git init', { cwd: runtime.contentBuildDir });
  }

  fs.writeFileSync(runtime.contentBuildDir + '/README.md', 'This branch is just a deploy target. Do not edit. You changes will be lost.', 'utf-8');
  utils.passthru(runtime, 'git checkout -B gh-pages', { cwd: runtime.contentBuildDir });
  utils.passthru(runtime, 'git add --all .', { cwd: runtime.contentBuildDir });
  utils.passthru(runtime, 'git commit -nm "Update website by $USER" || true', { cwd: runtime.contentBuildDir });
  utils.passthru(runtime, 'git remote add origin ' + runtime.ghPagesEnv.GHPAGES_URL + ' 2> /dev/null || true', { cwd: runtime.contentBuildDir });
  // required to update the token:
  utils.passthru(runtime, 'git remote set-url origin ' + runtime.ghPagesEnv.GHPAGES_URL, { cwd: runtime.contentBuildDir });
  utils.passthru(runtime, 'git push origin gh-pages:refs/heads/gh-pages 2> /dev/null || git push origin gh-pages:refs/heads/gh-pages --force > /dev/null', { cwd: runtime.contentBuildDir });
  cb(null);
};
;

var _temp = function () {
  if (typeof __REACT_HOT_LOADER__ === 'undefined') {
    return;
  }
}();

;