const utils = require('./utils')

module.exports = function ({runtime}) {
  let volumePaths = utils.volumePaths({ runtime })
  let listVolumes = []
  let volumeCfg = {}
  for (let key in volumePaths) {
    listVolumes.push(`${key}:${volumePaths[key]}`)
    volumeCfg[key.replace(/\//g, '')] = {
      external: true,
    }
  }

  let dockerComposeDevCfg = {
    'version' : '2',
    'services': {
      'lanyon-container': {
        'volumes': listVolumes,
      },
    },
    'volumes': volumeCfg,
  }

  return dockerComposeDevCfg
}
