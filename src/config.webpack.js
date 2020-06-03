const path = require('path')
const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const SvgStoreWebpackPlugin = require('webpack-svgstore-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const Visualizer = require('webpack-visualizer-plugin')
const yaml = require('js-yaml')
const AssetsPlugin = require('assets-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const scrolex = require('scrolex').persistOpts({
  announce             : true,
  addCommandAsComponent: true,
  components           : 'lanyon>config>webpack',
})

module.exports = function ({ runtime }) {
  const browsers = runtime.browsers || ['> 1%', 'ie 10', 'ie 8', 'safari 4']
  const postCssLoader = {
    loader : 'postcss-loader',
    options: {
      sourceMap: true,
      ident    : 'postcss',
      plugins  : (loader) => [
        require('autoprefixer')({
          overrideBrowserslist: browsers,
        }),
        // require('cssnano')(),
      ],
    },
  }

  const postCssLoaderProduction = {
    loader : 'postcss-loader',
    options: {
      sourceMap: true,
      ident    : 'postcss',
      plugins  : (loader) => [
        require('autoprefixer')({
          overrideBrowserslist: browsers,
        }),
        // require('cssnano')(),
      ],
    },
  }

  function getFilename (extension, isChunk, isContent) {
    let filename = `[name].${extension}`

    // https://github.com/webpack-contrib/extract-text-webpack-plugin/issues/763
    let hashNotation = ''
    if (extension === 'css') {
      hashNotation = '[hash]'
    } else {
      hashNotation = '[contenthash]'
    }
    if (!runtime.isDev) {
      filename = `[name].${hashNotation}.${extension}`
    }

    if (isChunk) {
      filename = `[name].${hashNotation}.[id].chunk.${extension}`
    }

    return filename
  }

  const moduleDirs = [
    runtime.assetsSourceDir,
    path.join(runtime.projectDir, 'node_modules'),
    path.join(runtime.npmRoot, 'node_modules'),
    path.join(runtime.lanyonDir, 'node_modules'),
  ].concat(runtime.extraAssetsSourceDirs || [])

  const webpackCfg = {
    mode        : runtime.lanyonEnv,
    optimization: {
      minimizer: (function dynamicMinimizers () {
        const minimizers = []
        if (runtime.uglify) {
          // https://stackoverflow.com/questions/49053215/webpack-4-how-to-configure-minimize
          // we specify a custom UglifyJsPlugin here to get source maps in production
          minimizers.push(
            new UglifyJsPlugin({
              cache        : true,
              parallel     : true,
              uglifyOptions: {
                compress: false,
                ecma    : 6,
                mangle  : true,
              },
              sourceMap: true,
            })
          )
        }

        return minimizers
      }()),
    },
    entry: (function dynamicEntries () {
      var entries = {}

      runtime.entries.forEach(entry => {
        entries[entry] = [path.join(runtime.assetsSourceDir, `${entry}.js`)]

        if (entry === 'app' && runtime.isDev) {
          entries[entry].unshift('webpack-hot-middleware/client')
        }
      })

      if (runtime.common) {
        // e.g.: [ "jquery" ]
        // https://webpack.github.io/docs/code-splitting.html#split-app-and-vendor-code
        entries.common = runtime.common
      }

      return entries
    }()),
    node: {
      fs    : 'empty',
      module: 'empty',
    },
    target: 'web',
    output: {
      publicPath   : runtime.publicPath,
      path         : runtime.assetsBuildDir,
      filename     : getFilename('js'),
      chunkFilename: getFilename('js', true),
      // cssFilename  : getFilename('css'),
    },
    devtool: (function dynamicDevtool () {
      // https://webpack.js.org/configuration/devtool/#devtool
      if (runtime.isDev) {
        return 'eval-source-map'
      }

      return 'source-map'
    }()),
    bail  : false, // <-- We use our own ReportErrors plugin as with bail errors details are lost. e.g.: `Error at NormalModule.onModuleBuildFailed`
    module: {
      rules: (function dynamicRules () {
        const rules = [
          {
            test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
            use : [
              {
                loader : 'url-loader',
                options: {
                  limit   : 10000,
                  mimetype: 'application/font-woff',
                },
              },
            ],
          }, {
            test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
            use : [
              {
                loader : 'url-loader',
                options: {
                  limit   : 10000,
                  mimetype: 'application/font-woff',
                },
              },
            ],
          }, {
            test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
            use : [
              {
                loader : 'url-loader',
                options: {
                  limit   : 10000,
                  mimetype: 'application/octet-stream',
                },
              },
            ],
          }, {
            test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
            use : [
              {
                loader: 'file-loader',
              },
            ],
          }, {
            test: /\.cur(\?v=\d+\.\d+\.\d+)?$/,
            use : [
              {
                loader: 'file-loader',
              },
            ],
          }, {
            test: /\.worker\.js$/,
            use : [
              { loader: 'worker-loader' },
            ],
          }, {
            test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
            use : [
              {
                loader : 'url-loader',
                options: {
                  limit   : 10000,
                  mimetype: 'image/svg+xml',
                },
              },
            ],
          },
          {
            test: /\.(png|gif|jpe?g)$/,
            use : [
              {
                loader : 'url-loader',
                options: {
                  limit   : 8096,
                  mimetype: 'application/octet-stream',
                },
              },
            ],
          },
          {
            // https://www.techchorus.net/blog/using-sass-version-of-bootstrap-with-webpack/
            test: /[\\/]bootstrap-sass[\\/]assets[\\/]javascripts[\\/]/,
            use : [
              // loader: 'imports?this=>window',
              {
                loader : 'imports-loader',
                options: {
                  this: '>window',
                },
              },
            ],
          },
          {
            test: /[\\/]jquery\..*\.js$/,
            use : [
              // loader: 'imports?this=>window',
              {
                loader : 'imports-loader',
                options: {
                  this: '>window',
                },
              },
            ],
          },
        ]

        if (runtime.isDev) {
          rules.push({
            test: /\.css$/,
            use : [
              {
                loader: 'style-loader',
              },
              {
                loader : 'css-loader',
                options: {
                  // sourceMap: true,
                  // { importLoaders: 1 }
                },
              },
              postCssLoader,
              {
                loader: 'resolve-url-loader',
              },
            ],
          })
          rules.push({
            test: /\.scss$/,
            use : [
              {
                loader: 'style-loader',
              },
              {
                loader : 'css-loader',
                options: {
                  // sourceMap: true,
                },
              },
              postCssLoader,
              {
                loader: 'resolve-url-loader',
              },
              {
                loader : 'sass-loader',
                options: {
                  // sourceMap: true,
                },
              },
            ],
          })
          rules.push({
            test: /\.less$/,
            use : [
              {
                loader: 'style-loader',
              },
              {
                loader : 'css-loader',
                options: {
                  // sourceMap: true,
                },
              },
              postCssLoader,
              {
                loader: 'resolve-url-loader',
              },
              {
                loader : 'less-loader',
                options: {
                  // sourceMap: true,
                },
              },
            ],
          })
        } else {
          rules.push({
            test: /\.css$/,
            use : ExtractTextPlugin.extract({
              fallback: 'style-loader',
              use     : [
                {
                  loader : 'css-loader',
                  options: {
                    sourceMap    : true,
                    importLoaders: 1,
                  },
                },
                postCssLoaderProduction,
                {
                  loader : 'resolve-url-loader',
                  options: {
                    sourceMap: true,
                  },
                },
              ],
            }),
          })
          rules.push({
            test: /\.scss$/,
            use : ExtractTextPlugin.extract({
              fallback: 'style-loader',
              use     : [
                {
                  loader : 'css-loader',
                  options: {
                    importLoaders: 1,
                    sourceMap    : true,
                  },
                },
                postCssLoaderProduction,
                {
                  loader : 'resolve-url-loader',
                  options: {
                    sourceMap: true,
                  },
                },
                {
                  loader : 'sass-loader',
                  options: {
                    sourceMap: true,
                  },
                },
              ],
            }),
          })
          rules.push({
            test: /\.less$/,
            use : ExtractTextPlugin.extract({
              fallback: 'style-loader',
              use     : [
                {
                  loader : 'css-loader',
                  options: {
                    sourceMap: true,
                  },
                },
                postCssLoaderProduction,
                {
                  loader : 'resolve-url-loader',
                  options: {
                    sourceMap: true,
                  },
                },
                {
                  loader : 'less-loader',
                  options: {
                    sourceMap: true,
                  },
                },
              ],
            }),
          })
        }

        const jsDirs = [
          `${runtime.assetsSourceDir}`,
        ].concat((runtime.extraAssetsSourceDirs || []))

        // console.log({jsDirs})
        // process.exit(1)

        rules.push({
          test   : /\.(js|jsx)$/,
          include: jsDirs,
          exclude: [
            /[\\/](node_modules|js-untouched)[\\/]/,
          ],
          use: [
            // {
            //   loader : 'react-hot-loader',
            //   options: {
            //
            //   },
            // },
            {
              loader : 'babel-loader',
              options: {
                babelrc: false,
                presets: [
                  [require.resolve('@babel/preset-env'), {
                    debug  : false,
                    modules: 'commonjs',
                    loose  : false,
                  }],
                  require.resolve('@babel/preset-react'),
                ],
                plugins: [
                  [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
                  require.resolve('@babel/plugin-proposal-class-properties'),
                  require.resolve('react-hot-loader/babel'),
                  require.resolve('nanohtml'),
                ],
                // sourceRoot    : `${runtime.projectDir}`,
                cacheDirectory: `${runtime.cacheDir}/babelCache`,
              },
            },
          ],
        })
        return rules
      }()),
    },
    plugins: (function dynamicPlugins () {
      const plugins = [
        new webpack.DefinePlugin({
          'process.env.LANYON_ENV': JSON.stringify(runtime.lanyonEnv),
          'process.env.NODE_ENV'  : JSON.stringify(process.env.NODE_ENV),
          'process.env.ENDPOINT'  : JSON.stringify(process.env.ENDPOINT),
        }),
        new webpack.ProvidePlugin({
          _: 'lodash',
        }),
        new SvgStoreWebpackPlugin({
          svgoOptions: {
            plugins: [
              { removeTitle: true },
            ],
          },
          prefix: 'icon-',
        }),
        // Until loaders are updated one can use the LoaderOptionsPlugin to switch loaders into debug mode:
        new webpack.LoaderOptionsPlugin({
          debug  : runtime.isDev,
          context: runtime.projectDir,
        }),
        new AssetsPlugin({
          filename: 'jekyll.lanyon_assets.yml',
          path    : runtime.cacheDir,
          processOutput (assets) {
            scrolex.stick(`Writing asset manifest to: "${runtime.cacheDir}/jekyll.lanyon_assets.yml"`)
            try {
              return yaml.safeDump({ lanyon_assets: assets })
            } catch (e) {
              console.error({ assets })
              throw new Error(`Unable to encode above config to YAML. ${e.message}`)
            }
          },
        }),
      ]

      plugins.push(new webpack.optimize.ModuleConcatenationPlugin())

      if (runtime.isDev) {
        plugins.push(new webpack.HotModuleReplacementPlugin())
      } else {
        plugins.push(new ExtractTextPlugin({
          filename   : getFilename('css'),
          allChunks  : true,
          ignoreOrder: true, // <-- add this to avoid: "Order in extracted chunk undefined" ¯\_(ツ)_/¯ https://github.com/redbadger/website-honestly/issues/128
        }))

        // plugins.push(new webpack.NoErrorsPlugin())
        plugins.push(new OptimizeCssAssetsPlugin())
        plugins.push(new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 15 }))
        plugins.push(new webpack.optimize.MinChunkSizePlugin({ minChunkSize: 10000 }))
        plugins.push(function ReportErrors () {
          this.plugin('done', ({ compilation }) => {
            for (const asset in compilation.assets) {
              scrolex.stick(`Wrote ${runtime.assetsBuildDir}/${asset}`)
            }
            if (compilation.errors && compilation.errors.length) {
              scrolex.failure(compilation.errors)
              if (!runtime.isDev) {
                process.exit(1)
              }
            }
          })
        })
      }

      if (runtime.common) {
        plugins.push(new webpack.optimize.CommonsChunkPlugin({
          name    : 'common',
          filename: getFilename('js'),
        }))
      }

      if (!runtime.isDev && runtime.statistics) {
        // @todo: Once Vizualizer supports multiple entries, add support for that here
        // https://github.com/chrisbateman/webpack-visualizer/issues/5
        // Currently it just shows stats for all entries in one graph
        plugins.push(new Visualizer({
          filename: runtime.statistics,
        }))
      }

      return plugins
    }()),
    resolveLoader: {
      modules: [
        path.join(runtime.lanyonDir, 'node_modules'),
        path.join(runtime.npmRoot, 'node_modules'),
        path.join(runtime.projectDir, 'node_modules'),
      ],
    },
    recordsPath: runtime.recordsPath,
    stats      : {
      // Examine all modules
      maxModules         : Infinity,
      // Display bailout reasons
      optimizationBailout: true,
    },
    resolve: {
      modules: moduleDirs,

      // These JSON files are read in directories
      descriptionFiles: ['package.json'],

      // These fields in the description files are looked up when trying to resolve the package directory
      mainFields: ['browser', 'main'],

      // These files are tried when trying to resolve a directory
      mainFiles: ['index'],

      // These fields in the description files offer aliasing in this package
      // The content of these fields is an object where requests to a key are mapped to the corresponding value
      aliasFields: ['browser'],

      // These extensions are tried when resolving a file
      extensions: ['.js', '.json'],

      // If false it will also try to use no extension from above
      enforceExtension: false,

      // If false it's also try to use no module extension from above
      enforceModuleExtension: false,
      // These aliasing is used when trying to resolve a module
      alias                 : runtime.alias,
    },
  }

  return webpackCfg
}
