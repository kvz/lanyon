const fs      = require('fs')
const globby  = require('globby')
const scrolex = require('scrolex').persistOpts({
  announce             : true,
  addCommandAsComponent: true,
  components           : `lanyon>deploy`,
})

if (require.main === module) {
  scrolex.failure(`Please only used this module via require, or: src/cli.js ${process.argv[1]}`)
  process.exit(1)
}

module.exports = async (runtime, cb) => {
  if (runtime.onTravis) {
    if (runtime.ghPagesEnv.GHPAGES_BOTNAME) {
      scrolex.stick('Setting up GHPAGES_BOTNAME')
      await scrolex.exe(`git config --global user.name "${runtime.ghPagesEnv.GHPAGES_BOTNAME}"`, { cwd: runtime.contentBuildDir })
    }
    if (runtime.ghPagesEnv.GHPAGES_BOTEMAIL) {
      scrolex.stick('Setting up GHPAGES_BOTNAME')
      await scrolex.exe(`git config --global user.email "${runtime.ghPagesEnv.GHPAGES_BOTEMAIL}"`, { cwd: runtime.contentBuildDir })
    }
  }

  if (!runtime.ghPagesEnv.GHPAGES_URL) {
    return cb(new Error('GHPAGES_URL was not set. Did you source env.sh? Did you encrypt it with Travis?'))
  }

  if (!globby.sync(`${runtime.contentBuildDir}/assets/build/app*.js`).length) {
    return cb(new Error(`I refuse to deploy if there is no ${runtime.contentBuildDir}/assets/build/app*.js - build:production first!`))
  }
  if (fs.existsSync(`${runtime.contentBuildDir}/env.sh`)) {
    return cb(new Error(`I refuse to deploy if while ${runtime.contentBuildDir}/env.sh exists - secure your build first!`))
  }
  if (!fs.existsSync(`${runtime.contentBuildDir}/.git`)) {
    await scrolex.exe('git init', { cwd: runtime.contentBuildDir })
  }

  fs.writeFileSync(`${runtime.contentBuildDir}/README.md`, 'This branch is just a deploy target. Do not edit. You changes will be lost.', 'utf-8')
  await scrolex.exe('git checkout -B gh-pages', { cwd: runtime.contentBuildDir })
  await scrolex.exe('git add --all .', { cwd: runtime.contentBuildDir })
  await scrolex.exe('git commit -nm "Update website by $USER" || true', { cwd: runtime.contentBuildDir })
  await scrolex.exe(`git remote add origin ${runtime.ghPagesEnv.GHPAGES_URL} 2> /dev/null || true`, { cwd: runtime.contentBuildDir })
  // required to update the token:
  await scrolex.exe(`git remote set-url origin ${runtime.ghPagesEnv.GHPAGES_URL}`, { cwd: runtime.contentBuildDir })
  await scrolex.exe('git push origin gh-pages:refs/heads/gh-pages 2> /dev/null || git push origin gh-pages:refs/heads/gh-pages --force > /dev/null', { cwd: runtime.contentBuildDir })
  cb(null)
}
