var utils = require('./utils')

module.exports = function (runtime, cb) {
  if (runtime.onTravis) {
    if (runtime.ghPagesEnv.GHPAGES_BOTNAME) {
      console.log('--> Setting up GHPAGES_BOTNAME')
      utils.passthru(runtime, 'git config --global user.name "' + runtime.ghPagesEnv.GHPAGES_BOTNAME + '"', { cwd: runtime.contentBuildDir })
    }
    if (runtime.ghPagesEnv.GHPAGES_BOTEMAIL) {
      console.log('--> Setting up GHPAGES_BOTNAME')
      utils.passthru(runtime, 'git config --global user.email "' + runtime.ghPagesEnv.GHPAGES_BOTEMAIL + '"', { cwd: runtime.contentBuildDir })
    }
  }

  if (!runtime.ghPagesEnv.GHPAGES_URL) {
    return cb(new Error('GHPAGES_URL was not set. Did you source env.sh? Did you encrypt it with Travis?'))
  }

  utils.passthru(runtime, '[ -d .git ] || git init', { cwd: runtime.contentBuildDir })
  utils.passthru(runtime, 'echo "This branch is just a deploy target. Do not edit. You changes will be lost." |tee README.md', { cwd: runtime.contentBuildDir })
  utils.passthru(runtime, 'git checkout -B gh-pages', { cwd: runtime.contentBuildDir })
  utils.passthru(runtime, 'git add --all .', { cwd: runtime.contentBuildDir })
  utils.passthru(runtime, 'git commit -nm "Update website by $USER" || true', { cwd: runtime.contentBuildDir })
  utils.passthru(runtime, 'git remote add origin ' + runtime.ghPagesEnv.GHPAGES_URL + ' 2> /dev/null || true', { cwd: runtime.contentBuildDir })
  utils.passthru(runtime, 'git push origin gh-pages:refs/heads/gh-pages || git push origin gh-pages:refs/heads/gh-pages --force > /dev/null', { cwd: runtime.contentBuildDir })
  cb(null)
}
