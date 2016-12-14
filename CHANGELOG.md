# Changelog

## Unplanned

- [ ] jRuby support https://spin.atomicobject.com/2013/04/24/bundler-jruby-complete/
- [ ] Consider shipping all of Lanyon inside a Docker container
- [ ] Utilize `passthru` more (vs `spawnSync`)
- [ ] Add `travis` to Gemfile, and run it from our local shims vs from global during `lanyon encrypt`
- [ ] Add image optimizer from `assets/images` -> `assets/build/images`

## v0.0.40

[Diff](https://github.com/kvz/lanyon/compare/v0.0.39...v0.0.40)

- [x] Add globby as a dependency

## v0.0.39

[Diff](https://github.com/kvz/lanyon/compare/v0.0.38...v0.0.39)

- [x] Fix deploy failsafe

## v0.0.38

[Diff](https://github.com/kvz/lanyon/compare/v0.0.37...v0.0.38)

- [x] No longer exclude `node_modules|bower_components|vendor` by default
- [x] Disable resolve-url-loader for less as less currently produces invalid css (in its eyes)
- [x] Make errors fatal in production
- [x] Include plain css with ExtractTextPlugin

## v0.0.37

[Diff](https://github.com/kvz/lanyon/compare/v0.0.36...v0.0.37)

- [x] Make Deploy check aware of hashed cachebuster assets
- [x] Fix less resolve-url-loader sourcemap issues

## v0.0.36

[Diff](https://github.com/kvz/lanyon/compare/v0.0.35...v0.0.36)

- [x] Move uglify loader to deps (vs devDeps)

## v0.0.35

[Diff](https://github.com/kvz/lanyon/compare/v0.0.34...v0.0.35)

- [x] Build assets first, so that Jekyll can copy it into `_site`, and also `jekyll.lanyon_assets.yml` exists in time
- [x] Add debugging notes
- [x] Add uglify as a dependency

## v0.0.34

[Diff](https://github.com/kvz/lanyon/compare/v0.0.33...v0.0.34)

- [x] More optimization for production builds
- [x] Fix svgeezy (which works with a local `svgeezy` var, not one on `window`)
- [x] Enable vizualizer support by default, writing to `assets/build/stats.html`, unless you set `lanyon.statistics` to `false` in your `package.json` 
- [x] Add support for long-term caching, and cache busting
- [x] Add vizualizer by definining `lanyon.statistics: "webpack-statistics.html"` in your `package.json`. Directory is fixed to build dir, and this does not work in `development`/HMR mode
- [x] Add support for shared code-splitted bundles by defining `lanyon.common` in your `package.json`
- [x] Add jquery to bower components
- [x] Fix coffee loader
- [x] Add resolve-url-loader so e.g. mediaplayer & select2 can find their relative assets such as `./select2.png` or `./controls.png`
- [x] Allow asset loaders to load from `bower_components`
- [x] Allow bower installed bootstrap-sass to use `window` and `jQuery`
- [x] Offer a lodash `_` plugin
- [x] Reset (a possibly corrupted) `records.json`
- [x] Fix: `Module not found: Error: Cannot resolve module 'fs'` by adding  `node: { fs: 'empty' }, target: 'node'` to webpack config
- [x] Support `prebuild*` hooks being arrays
- [x] Fix bad Git ignores
- [x] Revert plain css files to extract text plugin

## v0.0.33 (bad build)

[Diff](https://github.com/kvz/lanyon/compare/v0.0.32...v0.0.33)

- [x] Add plain css files to extract text plugin /thx @Acconut

## v0.0.32

[Diff](https://github.com/kvz/lanyon/compare/v0.0.31...v0.0.32)

- [x] Allow relative projectDir

## v0.0.31

[Diff](https://github.com/kvz/lanyon/compare/v0.0.30...v0.0.31)

- [x] Allow scanning from `LANYON_PROJECT`

## v0.0.30

[Diff](https://github.com/kvz/lanyon/compare/v0.0.29...v0.0.30)

- [x] Never settle for `lanyon` as a projectDir

## v0.0.29

[Diff](https://github.com/kvz/lanyon/compare/v0.0.28...v0.0.29)

- [x] Do `realpathSync` relative from `gitRoot`

## v0.0.28

[Diff](https://github.com/kvz/lanyon/compare/v0.0.27...v0.0.28)

- [x] Fix bad build

## v0.0.27

[Diff](https://github.com/kvz/lanyon/compare/v0.0.26...v0.0.27)

- [x] Added `utils.upwardDirContaining` for definitive pathfinding

## v0.0.26

[Diff](https://github.com/kvz/lanyon/compare/v0.0.25...v0.0.26)

- [x] Use `find-up` for finding `gitRoot` and `npmRoot`, which might not be `projectDir`
- [x] Also support `web:deploy` npm script name

## v0.0.25

[Diff](https://github.com/kvz/lanyon/compare/v0.0.24...v0.0.25)

- [x] Also traverse upwards from projectDir to find `node_modules`

## v0.0.24

[Diff](https://github.com/kvz/lanyon/compare/v0.0.23...v0.0.24)

- [x] Better module pathfinding

## v0.0.23

[Diff](https://github.com/kvz/lanyon/compare/v0.0.22...v0.0.23)

- [x] Use `gitRoot` instead of `projectDir` for flat module finding, so it works when your project is in a subdir (like `website` or `docs`)

## v0.0.22

[Diff](https://github.com/kvz/lanyon/compare/v0.0.21...v0.0.22)

- [x] Support for flat module structure where modules live in `projectDir`

## v0.0.21

[Diff](https://github.com/kvz/lanyon/compare/v0.0.20...v0.0.21)

- [x] Deploy now supports `web:build:production`

## v0.0.20

[Diff](https://github.com/kvz/lanyon/compare/v0.0.19...v0.0.20)

- [x] Prefix deps with node

## v0.0.19

[Diff](https://github.com/kvz/lanyon/compare/v0.0.18...v0.0.19)

- [x] Fix bug leading to block postinstall resets

## v0.0.18

[Diff](https://github.com/kvz/lanyon/compare/v0.0.17...v0.0.18)

- [x] Make installs idempotent
- [x] Detect rubyProvider of existing shims
- [x] Introduce a `LANYON_RESET`, that removes all shims

## v0.0.17

[Diff](https://github.com/kvz/lanyon/compare/v0.0.16...v0.0.17)

- [x] Don't rely on `.bin` symlinks as they don't appear to survive Travis CI cache

## v0.0.16

[Diff](https://github.com/kvz/lanyon/compare/v0.0.15...v0.0.16)

- [x] Use spawn-sync for older nodes

## v0.0.15

[Diff](https://github.com/kvz/lanyon/compare/v0.0.14...v0.0.15)

- [x] Pathfinding fixes, added `gitRoot`
- [x] Rename `vendor/bin` to `bin`
- [x] Refactoring of deploy & encrypt

## v0.0.14

[Diff](https://github.com/kvz/lanyon/compare/v0.0.13...v0.0.14)

- [x] Offer `lanyon deploy` for deploying onto GitHub Pages
- [x] Offer `lanyon encrypt` for encrypting GitHub Pages deploy secrets onto Travis CI
- [x] Fix broken shim quoting

## v0.0.13

[Diff](https://github.com/kvz/lanyon/compare/v0.0.12...v0.0.13)

- [x] Avoid double installs by fixing binDir references for shims

## v0.0.12

[Diff](https://github.com/kvz/lanyon/compare/v0.0.11...v0.0.12)

- [x] Utilize Webpack `--production` flag
- [x] Add Jekyll config writer (so we can ignore `node_modules` and `.lanyon`)
- [x] By default prefer system ruby over docker, for performance reasons

## v0.0.11

[Diff](https://github.com/kvz/lanyon/compare/v0.0.10...v0.0.11)

- [x] Add support for `production`-or-`development`-only hooks
- [x] Add coffeescript support
- [x] Add less support

## v0.0.10

[Diff](https://github.com/kvz/lanyon/compare/v0.0.9...v0.0.10)

- [x] Add support for configurable projectDir (so you can have a `./website` or `./docs` in your project)
- [x] Refactoring

## v0.0.9

[Diff](https://github.com/kvz/lanyon/compare/v0.0.8...v0.0.9)

- [x] Switch to a local lanyon install if available
- [x] Simplify/fix Browserify file watching
- [x] Do docker connect via shim
- [x] Store everything in `cacheDir` (projectDir/.lanyon) instead of in node_modules dir

## v0.0.8

[Diff](https://github.com/kvz/lanyon/compare/v0.0.7...v0.0.8)

- [x] Support for prebuild hook

## v0.0.7

[Diff](https://github.com/kvz/lanyon/compare/8d2286d78ea5f0e0ad2b9f021a00158774d31891...v0.0.7)

- [x] Use textextractor loader in production for scss, also check https://github.com/gowravshekar/font-awesome-webpack#extract-text-webpack-plugin
- [x] checkout http://stackoverflow.com/questions/33649761/how-do-i-load-font-awesome-using-scss-sass-in-webpack-using-relative-paths
