module.exports = function ({ runtime }) {
  const dockerComposeCfg = {
    version : '2',
    services: {
      'lanyon-container': {
        tty        : false,
        stdin_open : false,
        restart    : 'on-failure',
        environment: [
          `JEKYLL_ENV=${runtime.lanyonEnv}"`,
          'TERM=xterm',
        ],
        image  : `${runtime.dockerImage}`,
        // We need this container to remain online, that `exec` can tap into, so all the synced
        // files will still be there. Hence we run a dummy Jekyll command that never finished:
        command: [
          'watch',
          'jekyll',
          'build',
          '--watch',
          '--source',
          '/tmp',
          '--destination',
          '/tmp/_site',
        ],
      },
    },
  }

  return dockerComposeCfg
}
