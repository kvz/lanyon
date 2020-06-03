const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')
// const BowerWebpackPlugin      = require('bower-webpack-plugin')

module.exports = function ({ runtime, webpack }) {
  let bundler = null
  if (runtime.attachHMR) {
    bundler = require('webpack')(webpack)
  }
  const browsersyncCfg = {
    server: {
      port   : runtime.ports.content,
      baseDir: (function dynamicWebRoots () {
        let webRoots = [runtime.contentBuildDir]
        if (runtime.extraWebroots) {
          webRoots = webRoots.concat(runtime.extraWebroots)
        }

        // Turn into absolute paths (e.g. `crmdummy` -> `/Users/kvz/code/content/_site/crmdummy` )
        for (const i in webRoots) {
          if (webRoots[i].substr(0, 1) !== '/' && webRoots[i].substr(0, 1) !== '~') {
            webRoots[i] = `${runtime.contentBuildDir}/${webRoots[i]}`
          }
        }

        return webRoots
      }()),
      middleware: (function dynamicMiddlewares () {
        const middlewares = []

        if (runtime.attachHMR) {
          middlewares.push(webpackDevMiddleware(bundler, {
            publicPath: runtime.publicPath,
            hot       : true,
            inline    : true,
            stats     : { colors: true },
          }))
          middlewares.push(webpackHotMiddleware(bundler))
        }

        if (!middlewares.length) {
          return false
        }

        return middlewares
      }()),
      // serveStatic: runtime.themeDir
    },
    watchOptions: {
      ignoreInitial: true,
      ignored      : [
        // no need to watch '*.js' here, webpack will take care of it for us,
        // including full page reloads if HMR won't work
        '*.js',
        '.git',
        'assets/build/**',
        '.lanyon',
      ],
    },
    reloadDebounce: 300, // Wait for a specified window of event-silence before sending any reload events.
    files         : runtime.contentBuildDir,
    logLevel      : process.env.LANYON_DEBUG === '1' ? 'debug' : 'info',
  }

  return browsersyncCfg
}
