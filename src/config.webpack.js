const path = require('path')
const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const SvgStoreWebpackPlugin = require('webpack-svgstore-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const Visualizer = require('webpack-visualizer-plugin')
const yaml = require('js-yaml')
const AssetsPlugin = require('assets-webpack-plugin')
const WebpackMd5Hash = require('webpack-md5-hash')
const scrolex = require('scrolex').persistOpts({
  announce             : true,
  addCommandAsComponent: true,
  components           : `lanyon>config>webpack`,
})

module.exports = function ({runtime}) {
  function getFilename (extension, isChunk, isContent) {
    let filename = `[name].${extension}`

    if (!runtime.isDev) {
      filename = `[name].[chunkhash].${extension}`
      if (isContent) {
        filename = `[name].[contenthash].${extension}`
      }
    }

    if (isChunk) {
      filename = `[name].[chunkhash].[id].chunk.${extension}`
    }

    return filename
  }

  let webpackCfg = {
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
        return 'inline-eval-cheap-source-map'
      }

      return 'source-map'
    }()),
    bail  : false, // <-- We use our own ReportErrors plugin as with bail errors details are lost. e.g.: `Error at NormalModule.onModuleBuildFailed`
    module: {
      rules: (function dynamicRules () {
        let rules = [
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
            test: /\.coffee$/,
            use : [
              {
                loader: 'coffee-loader',
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
            // https://github.com/webpack/webpack/issues/512
            test: /[\\/](bower_components)[\\/]modernizr[\\/]modernizr\.js$/,
            use : [
              // loader: 'imports?this=>window!exports?window.Modernizr',
              {
                loader : 'imports-loader',
                options: {
                  this: '>window',
                },
              },
              {
                loader : 'exports-loader',
                options: {
                  'window.Modernizr': true,
                },
              },
            ],
          },
          {
            test: /[\\/](bower_components)[\\/]svgeezy[\\/]svgeezy\.js$/,
            use : [
              // loader: 'imports?this=>window!exports?svgeezy',
              {
                loader : 'imports-loader',
                options: {
                  this: '>window',
                },
              },
              {
                loader : 'exports-loader',
                options: {
                  'svgeezy': true,
                },
              },
            ],
          },
          {
            // https://www.techchorus.net/blog/using-sass-version-of-bootstrap-with-webpack/
            test: /[\\/](bower_components)[\\/]bootstrap-sass[\\/]assets[\\/]javascripts[\\/]/,
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
                },
              },
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
                    sourceMap: true,
                  },
                },
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
                    sourceMap: true,
                  },
                },
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

        rules.push({
          test   : /\.(js|jsx)$/,
          include: [
            `${runtime.assetsSourceDir}`,
          ],
          exclude: [
            `${runtime.assetsSourceDir}/bower_components`,
            /[\\/](node_modules|bower_components|js-untouched)[\\/]/,
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
                babelrc: true,
                presets: [
                  require.resolve('babel-preset-es2015'),
                  require.resolve('babel-preset-react'),
                  require.resolve('babel-preset-stage-0'),
                ],
                plugins: [
                  require.resolve('babel-plugin-transform-class-properties'),
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
      let plugins = [
        // new BowerWebpackPlugin(),
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
        new WebpackMd5Hash(),
      ]

      plugins.push(new webpack.optimize.ModuleConcatenationPlugin())

      if (runtime.isDev) {
        plugins.push(new webpack.HotModuleReplacementPlugin())
      } else {
        plugins.push(new ExtractTextPlugin({
          filename : getFilename('css'),
          allChunks: true,
        }))
        // Avoid warning:
        // Warning: It looks like you're using a minified copy of the development build of React.
        // When deploying React apps to production, make sure to use the production build which
        // skips development warnings and is faster. See https://fb.me/react-minification for more details.
        // https://facebook.github.io/react/docs/optimizing-performance.html#use-the-production-build
        plugins.push(new webpack.DefinePlugin({
          'process.env': {
            NODE_ENV: JSON.stringify('production'),
          },
        }))
        plugins.push(new webpack.optimize.UglifyJsPlugin({
          compress: {
            warnings: false,
          },
          sourceMap: true,
          exclude  : /[\\/](node_modules|bower_components|js-untouched)[\\/]/,
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
    resolve    : {
      modules: [
        runtime.assetsSourceDir,
        path.join(runtime.assetsSourceDir, 'bower_components'),
        path.join(runtime.projectDir, 'node_modules'),
        path.join(runtime.npmRoot, 'node_modules'),
        path.join(runtime.lanyonDir, 'node_modules'),
      ],

      // Enable Bower
      // These JSON files are read in directories
      descriptionFiles: ['package.json', 'bower.json'],

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
      // alias: {
      //   jquery: path.resolve(__dirname, 'vendor/jquery-2.0.0.js'),
      // },
    },
  }

  return webpackCfg
}
