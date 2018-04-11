const utils = require('./utils')

module.exports = function ({runtime, jekyll}) {
  let volumePaths = utils.volumePaths({ runtime })
  let volumeSyncCfg = {}
  for (let key in volumePaths) {
    volumeSyncCfg[key.replace(/\//g, '')] = {
      'src'          : volumePaths[key],
      'sync_userid'  : 1000,
      'sync_excludes': [
        'node_modules',
        '.git',
      ].concat(jekyll.exclude),
    }
  }

  let dockerSyncCfg = {
    'version': '2',
    'options': {
      'verbose': true,
    },
    'syncs': volumeSyncCfg,
  }

  return dockerSyncCfg
}
