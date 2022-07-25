const path                    = require('path')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const webpack                 = require('webpack')
const TerserJSPlugin          = require('terser-webpack-plugin')
const MiniCssExtractPlugin    = require('mini-css-extract-plugin')
const CssMinimizerPlugin      = require('css-minimizer-webpack-plugin')
const HtmlWebpackPlugin       = require('html-webpack-plugin')

module.exports = function ({ runtime }) {
  const assetDirs = [
    `${runtime.assetsSourceDir}`,
  ].concat((runtime.extraAssetsSourceDirs || []))

  const moduleDirs = [
    runtime.assetsSourceDir,
    'node_modules',
    path.join(runtime.npmRoot, 'node_modules'),
    path.join(runtime.lanyonDir, 'node_modules'),
  ].concat(runtime.extraAssetsSourceDirs || [])

  const browsers = runtime.browsers || ['> 1%', 'ie 10', 'ie 8', 'safari 4']

  const webpackRules = () => {
    const rules = []

    rules.push({
      test: /\.woff2?(\?v=\d+\.\d+\.\d+)?$/,
      type: 'asset',
    })

    rules.push({
      test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
      type: 'asset',
    })

    rules.push({
      test: /\.(png|webp|gif|jpe?g|ttf(\?v=\d+\.\d+\.\d+)?)$/,
      type: 'asset',
    })

    rules.push({
      test: /\.(eot|cur)(\?v=\d+\.\d+\.\d+)?$/,
      type: 'asset/resource',
    })

    rules.push({
      test: /\.worker\.js$/,
      use : [
        'worker-loader',
      ],
    })

    rules.push({
      test: /([\\/]bootstrap-sass[\\/]assets[\\/]javascripts[\\/]|[\\/]jquery\..*\.js$)/,
      use : [
        {
          loader : 'imports-loader',
          options: {
            imports: [
              'default jquery $',
            ],
            // Disabled for Webpack5
            // this: '>window',
          },
        },
      ],
    })

    rules.push({
      test: /\.(sa|sc|c)ss$/,
      use : [
        MiniCssExtractPlugin.loader,
        {
          loader : 'cache-loader',
          options: {
            cacheDirectory: `${runtime.cacheDir}/cache-loader`,
          },
        },
        'css-loader',
        {
          loader : 'postcss-loader',
          options: {
            postcssOptions: {
              sourceMap: true,
              ident    : 'postcss',
              plugins  : [
                ['postcss-preset-env', { browsers }],
              ],
            },
          },
        },
        {
          loader : 'sass-loader',
          options: {
            sassOptions: {
              // We can't do anything about deprecations in dependency code
              quietDeps: true,
            },
          },
        },
      ],
    })

    rules.push({
      test   : /\.tsx?$/,
      use    : 'ts-loader',
      exclude: /node_modules/,
    })

    rules.push({
      test   : /\.(js|jsx)$/,
      include: assetDirs,
      exclude: [
        /[\\/](node_modules|js-untouched)[\\/]/,
      ],
      use: [
        'thread-loader',
        {
          loader : 'babel-loader',
          options: {
            babelrc         : false,
            cacheCompression: false,
            cacheDirectory  : `${runtime.cacheDir}/babel-loader`,
            presets         : [
              [require.resolve('@babel/preset-env'), {
                targets: { browsers },
              }],
              require.resolve('@babel/preset-react'),
            ],
            plugins: [
              [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
              require.resolve('@babel/plugin-proposal-class-properties'),
              require.resolve('react-hot-loader/babel'),
              require.resolve('nanohtml'),
            ],
          },
        },
      ],
    })

    return rules
  }

  const webpackPlugins = () => {
    const plugins = []

    const defines = {
      'process.env.LANYON_ENV': JSON.stringify(runtime.lanyonEnv),
      'process.env.NODE_ENV'  : JSON.stringify(process.env.NODE_ENV),
      'process.env.ENDPOINT'  : JSON.stringify(process.env.ENDPOINT),
    }

    if (runtime.customEnv) {
      for (const [key, value] of Object.entries(runtime.customEnv)) {
        defines[`process.env.${key}`] = JSON.stringify(value)
      }
    }

    plugins.push(new webpack.DefinePlugin(defines))

    runtime.entries.forEach(entry => {
      const withoutExtension = entry.replace(/\.(t|j)sx?$/, '')

      plugins.push(new HtmlWebpackPlugin({
        inject         : false,
        cache          : true,
        scriptLoading  : 'blocking', // worth an experiment: 'defer'
        filename       : `${runtime.projectDir}/_includes/_generated_assets/${withoutExtension}-${runtime.lanyonEnv}-head.html`,
        chunks         : [entry],
        templateContent: runtime.headAssetTemplate ? runtime.headAssetTemplate  : ({ htmlWebpackPlugin }) => `${htmlWebpackPlugin.tags.headTags}`,
      }))
      plugins.push(new HtmlWebpackPlugin({
        inject         : false,
        cache          : true,
        scriptLoading  : 'blocking', // worth an experiment: 'defer'
        filename       : `${runtime.projectDir}/_includes/_generated_assets/${withoutExtension}-${runtime.lanyonEnv}-body.html`,
        chunks         : [entry],
        templateContent: runtime.bodyAssetTemplate ? runtime.bodyAssetTemplate : ({ htmlWebpackPlugin }) => `${htmlWebpackPlugin.tags.bodyTags}`,
      }))
    })
    // plugins.push({
    //   apply: (compiler) => {
    //     compiler.hooks.afterEmit.tap('AfterEmitPlugin', async (compilation) => {
    //       const files = await globby(`${runtime.cacheDir}/_generated_assets/*`)
    //       const targetDir = `${runtime.projectDir}/_includes/_generated_assets/`

    //       console.log({ files, targetDir })
    //     })
    //   },
    // })
    plugins.push(new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename     : runtime.isDev ? `[name].css` : `[name].[contenthash].css`,
      chunkFilename: runtime.isDev ? `[name].css` : `[name].[contenthash].[chunkhash].chunk.css`,
      ignoreOrder  : true, // <-- add this to avoid: "Order in extracted chunk undefined" ¯\_(ツ)_/¯ https://github.com/redbadger/website-honestly/issues/128
    }))

    if (runtime.isDev) {
      plugins.push(new webpack.HotModuleReplacementPlugin())
    }

    if (runtime.analyze) {
      plugins.push(new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        logLevel    : 'info',
        openAnalyzer: true,
      }))
    }

    return plugins
  }

  const webpackCfg = {
    mode        : runtime.isDev ? 'development' : 'production',
    bail        : true,
    module      : { rules: webpackRules() },
    plugins     : webpackPlugins(),
    // Disabled for Webpack5
    node        : false,
    recordsPath : runtime.recordsPath,
    target      : 'web',
    optimization: {
      minimize   : !runtime.isDev,
      minimizer  : !runtime.isDev ? [new TerserJSPlugin({}), new CssMinimizerPlugin({})] : [],
      splitChunks: !runtime.isDev
        ? {
          chunks: 'all',
        }
        : false,
    },
    output: {
      publicPath   : runtime.publicPath,
      path         : runtime.assetsBuildDir,
      filename     : runtime.isDev ? `[name].js` : `[name].[contenthash].js`,
      chunkFilename: runtime.isDev ? `[name].js` : `[name].[contenthash].[chunkhash].chunk.js`,
    },
    devtool: (function dynamicDevtool () {
      // https://webpack.js.org/guides/build-performance/#devtool
      if (runtime.isDev) {
        return 'eval-cheap-module-source-map'
      }

      return 'source-map'
    }()),
    resolveLoader: {
      modules: [
        path.join(runtime.lanyonDir, 'node_modules'),
        path.join(runtime.npmRoot, 'node_modules'),
        path.join(runtime.projectDir, 'node_modules'),
      ],
    },
    resolve: {
      modules         : moduleDirs,
      descriptionFiles: ['package.json'],
      mainFields      : ['browser', 'main'],
      mainFiles       : ['index'],
      aliasFields     : ['browser'],
      extensions      : ['.tsx', '.ts', '.js'],
      enforceExtension: false,
      fallback        : {
        stream: require.resolve('stream-browserify'),
      },
      // Disabled for Webpack5
      // enforceModuleExtension: false,
      alias: runtime.alias,
    },
    entry: (function dynamicEntries () {
      const entries = {}

      runtime.entries.forEach(entry => {
        entries[entry] = []
        if (runtime.isDev) {
          // Push HMR to all entrypoints
          entries[entry].push('webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=true&overlay=true')
        }

        // Add .js if we do not have a valid extension (js/ts) already for the entrypoint
        const entryWithExt = ['.js', '.ts'].includes(path.extname(entry)) ? entry : `${entry}.js`

        entries[entry].push(path.join(runtime.assetsSourceDir, entryWithExt))
      })

      return entries
    }()),
  }

  return webpackCfg
}
