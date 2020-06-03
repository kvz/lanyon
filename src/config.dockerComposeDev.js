const utils = require('./utils')

module.exports = function ({ runtime }) {
  const volumePaths = utils.volumePaths({ runtime })
  const listVolumes = []
  const volumeCfg = {}
  for (const key in volumePaths) {
    listVolumes.push(`${key}:${volumePaths[key]}`)
    volumeCfg[key.replace(/\//g, '')] = {
      external: true,
    }
  }

  const dockerComposeDevCfg = {
    version : '2',
    services: {
      'lanyon-container': {
        volumes: listVolumes,
      },
    },
    volumes: volumeCfg,
  }

  return dockerComposeDevCfg
}
