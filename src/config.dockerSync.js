const utils = require('./utils')

module.exports = function ({ runtime, jekyll }) {
  const volumePaths = utils.volumePaths({ runtime })
  const volumeSyncCfg = {}
  for (const key in volumePaths) {
    volumeSyncCfg[key.replace(/\//g, '')] = {
      src          : volumePaths[key],
      sync_userid  : 1000,
      sync_excludes: [
        'node_modules',
        '.git',
      ].concat(jekyll.exclude),
    }
  }

  const dockerSyncCfg = {
    version: '2',
    options: {
      verbose: true,
    },
    syncs: volumeSyncCfg,
  }

  return dockerSyncCfg
}
