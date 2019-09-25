# Changelog

## Unplanned

- [ ] Add `travis` to Dockerfile, and run it from our local shims vs from global during `lanyon encrypt`
- [ ] Throw an error if we find legacy Jekyll residu such as `./vendors` or `.bundle`
- [ ] Maybe add https://github.com/btford/write-good and or text-lint (#8)
- [ ] Hooks are ran with every build, but not when doing HMR. We might be able to hook into the asset manifest callback to work around this for assets, while lib/cli.js calls it for content
- [ ] Consider bundlesize tracking on cli like https://github.com/rstacruz/webpack-tricks#investigating-bundle-sizes
- [ ] Wait on https://github.com/imagemin/imagemin-cli/pull/11 and https://github.com/imagemin/imagemin/issues/226 and add image building from `assets/images` -> `assets/build/images`
- [ ] Go over all `process.env.*` and make sure they are only at the head of `config.js`
- [ ] Add http://cssnano.co/

## master

Released: TBA.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.143...master).

- [ ] Add a 'real' command line parser for `lib/cli.js` like minimist
- [ ] Fix bug where failed deploy is not fatal: https://travis-ci.org/kvz/invig/builds/202931498#L627
- [ ] Make it so that you can only build e.g. a homepage via `LANYON_EXCLUDE=* LANYON_INCLUDE=home.html,_layouts/default.html`. However, we first need this Jekyll issue resolved: https://github.com/jekyll/jekyll/issues/4791#issuecomment-289021488
- [ ] Bundle node + modules in docker container also (and see if we can use them, using `open` for browsersync)
- [ ] Make travis tests pass again
- [ ] Debug browsersync's endless refresh
- [ ] Upgrade Webpack and friends
- [ ] Throw warning when not jekyll excluding: `- node_modules - .git`, like when you have `exclude: [vendor]` in your jekyll config
- [ ] Incorporate hacks in tus.io .lanyonrc, it should be able to run with an empty rc, except for hook

## v0.0.143

Released: 2019-09-25.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.142...v0.0.143).

- [x] Switch to `eval-source-map` in dev which provides better sourcemaps (#20, thanks @lakesare)

## v0.0.142

Released: 2019-09-04.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.141...v0.0.142).

- [x] Update dependencies (within major)
- [x] Make all processes less verbose, unless `LANYON_DEBUG=1`
- [x] Remove `reloadThrottle` and `reloadDelay` so that hopefully `reloadDebounce` in browsersync can persevere
- [x] Crash lanyon if it catches a `SIGUSR2` (which could be thrown by Nodemon)
- [x] Crash nodemon (and hence lanyon) if its child-process-to-be-started-on-filechange (docker->jekyll) crash
- [x] Fix `git ignore` error

## v0.0.141

Released: 2019-09-04.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.140...v0.0.141).

- [x] Allow to pass in webpack resolve alias via `runtime.alias`

## v0.0.140

Released: 2019-09-03.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.139...v0.0.140).

- [x] Don't run in verbose mode by default (but allow passing in `LANYON_EXTRA_JEKYLL_FLAGS="--trace --verbose"` if more detail is needed)

## v0.0.139

Released: 2019-09-03.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.136...v0.0.139).

- [x] Bring back stringex

## v0.0.137

Released: 2019-09-03.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.136...v0.0.137).

- [x] Upgrade to Jekyll 4
- [x] Upgrade to jekyll-feed 0.12.1 and minimal-mistakes-jekyll 4.16.6
- [x] Deprecate jekyll-algolia, github-pages

## v0.0.136

Released: 2019-08-09.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.135...v0.0.136).

- [x] Also add gem lockfile

## v0.0.135

Released: 2019-08-09.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.134...v0.0.135).

- [x] Install algolia via Gemfile & bundle update so that `jekyll algolia` becomes available

## v0.0.134

Released: 2019-08-09.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.133...v0.0.134).

- [x] Replace lunrjs with algolia

## v0.0.133

Released: 2019-08-09.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.132...v0.0.133).

- [x] Upgrade dependencies in docker image

## v0.0.132

Released: 2018-09-04.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.131...v0.0.132).

- [x] Fix Travis & Babel issues

## v0.0.131

Released: 2018-09-04.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.130...v0.0.131).

- [x] Fix Travis tests
- [x] revert: Allow to `setupContainer()` (but don't use it yet)

## v0.0.130

Released: 2018-09-04.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.129...v0.0.130).

- [x] Easier debugging of travis deploy failures

## v0.0.129

Released: 2018-09-04.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.128...v0.0.129).

- [x] Allow to `setupContainer()` (but don't use it yet)
- [x] Write files as current $USER to avoid manual chowning
- [x] Make failing hooks fatal

## v0.0.128

Released: 2018-09-04.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.127...v0.0.128).

- [x] Upgrade SASS

## v0.0.127

Released: 2018-08-22.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.126...v0.0.127).

- [x] Remove react as being bundled by lanyon /thx @Acconut

## v0.0.126

Released: 2018-08-22.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.125...v0.0.126).

- [x] Remove coffeescript support /thx @Acconut

## v0.0.125

Released: 2018-07-16.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.124...v0.0.125).

- [x] Upgrade gems and Jekyll from 3.7 -> 3.8 (which includes "Two massive performance improvements for large sites" - https://github.com/jekyll/jekyll/blob/master/History.markdown#380--2018-04-19)

## v0.0.124

Released: 2018-07-13.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.123...v0.0.124).

- [x] Drop support for: Modernizr, Svgeezy, Bower

## v0.0.123

Released: 2018-07-06.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.122...v0.0.123).

- [x] More consistent override methods

## v0.0.122

Released: 2018-07-06.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.121...v0.0.122).

- [x] Add support for PostCSS

## v0.0.121

Released: 2018-04-18.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.120...v0.0.121).

- [x] Pass a toolkit to lanyonrc with functions like dockerString

## v0.0.120

Released: 2018-04-12.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.117...v0.0.120).

- [x] Fix initProject issues

## v0.0.117

Released: 2018-04-12.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.116...v0.0.117).

- [x] Improved child process juggling

## v0.0.116

Released: 2018-04-12.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.115...v0.0.116).

- [x] Remove `shelljs` completely
- [x] Deprecate magic themeDir handling for now
- [x] Use pkill instead of killall so it works on both Linux & OSX (thanks @Acconut)
- [x] Restart lanyon container if it crashes
- [x] Cleaner kills for cleanup

## v0.0.115

Released: 2018-04-11.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.114...v0.0.115).

- [x] Figure out if incremental build is maybe actually working (is non-inc even slower?) investigate docker jekyll disk speedup
- [x] Optionally offer docker-sync for faster build times on osx https://github.com/EugenMayer/docker-sync/wiki/2.-Configuration
- [x] Simplify how hooks work

## v0.0.114

Released: 2018-04-10.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.113...v0.0.114).

- [x] Fix JEKYLL_ENV in Docker

## v0.0.113

Released: 2018-04-10.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.109...v0.0.113).

- [x] Move `--display-optimization-bailout` cli arg to webpack config instead
- [x] Make sure webpack does not immediately return
- [x] Simplify docker volumes (and avoid nesting)

## v0.0.112

Released: 2018-04-10.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.109...v0.0.112).

- [x] Allow to disable incremental

## v0.0.109

Released: 2018-04-09.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.108...v0.0.109).

- [x] Move postbuild hook into nodemon
- [x] Make nodemon respect jekyll exclude, deprecating `contentIgnore`
- [x] Don't let Lanyon call lanyon
- [x] Split up config over individual files per tool
- [x] Allow `.lanyonrc.js` in projectDir to temper with config (deprecating many env vars)
- [x] Require Node 8+ (and ditch babel)
- [x] Require Docker (and ditch rbenv, rvm, system support)

## v0.0.108

Released: 2018-03-26.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.107...v0.0.108).

- [x] Remove jQuery from Lanyon

## v0.0.107

Released: 2018-02-26.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.106...v0.0.107).

- [x] Fix `LANYON_DISABLE_JEKYLL_PLUGINS`

## v0.0.106

Released: 2017-10-24.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.105...v0.0.106).

- [x] Introduce a browsersync reloadDelay reloadDebounce reloadThrottle
- [x] Introduce a nodemon delay of 600ms

## v0.0.105

Released: 2017-10-24.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.104...v0.0.105).

- [x] Fix the disabling of setting no plugins via e.g. `env LANYON_DISABLE_GEMS=jemoji,jekyll-redirect-from,jekyll-feed,jekyll-sitemap LANYON_EXCLUDE=** LANYON_INCLUDE=home.html,_layouts/default.html lanyon start`

## v0.0.104

Released: 2017-10-18.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.103...v0.0.104).

- [x] Advocate LANYON_DISABLE_JEKYLL_PLUGINS
- [x] Switch from `babel-preset-2015` to `babel-preset-env`
- [x] Deprecate Node 0.12 and v4 support (now v6+)

## v0.0.103

Released: 2017-10-18.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.102...v0.0.103).

- [x] Downgrade uglify-js

## v0.0.102

Released: 2017-10-18.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.101...v0.0.102).

- [x] Add minimal-mistakes-jekyll
- [x] Downgrade less

## v0.0.101

Released: 2017-10-18.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.100...v0.0.101).

- [x] Make Jest run on `./src`
- [x] Rename `gems` -> `plugins` to avoid deprecation notice: `Deprecation: The 'gems' configuration option has been renamed to 'plugins'. Please update your config file accordingly.`
- [x] Upgrade `github-pages` to `164` (and thereby `jekyll` to `3.6`)
- [x] Add Scope Hoisting
- [x] Upgrade to Webpack v3

## v0.0.100

Released: 2017-09-05.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.99...v0.0.100).

- [x] Fix bug in: Rebuild docker gems only if there are custom gems in the project

## v0.0.99

Released: 2017-09-05.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.97...v0.0.99).

- [x] Yarn & npm fixes

## v0.0.97

Released: 2017-09-05.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.96...v0.0.97).

- [x] Rebuild docker gems only if there are custom gems in the project

## v0.0.96

Released: 2017-09-03.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.95...v0.0.96).

- [x] Back to rootless docker runs, should fix Travis CI failure where shims written by container are inaccessible: https://travis-ci.org/kvz/lanyon/jobs/271361343#L765
- [x] Upgrade github-pages to `157`

## v0.0.95

Released: 2017-09-03.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.94...v0.0.95).

- [x] Allow docker variant to install custom gems
- [x] Avoid promise warnings by catching async/await in install
- [x] Upgrade parallelshell

## v0.0.94

Released: 2017-07-10.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.93...v0.0.94).

- [x] Fix dependency pathfinding of local lanyon

## v0.0.93

Released: 2017-07-10.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.92...v0.0.93).

- [x] Upgrade github-pages, nokogiri, and minimum required ruby to 2.1.0
- [x] Reset shims while rebuilding container
- [x] Respect docker while verifying Ruby
- [x] Ship "jekyll-lunr-js-search": "3.3.0"

## v0.0.92

Released: 2017-06-29.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.91...v0.0.92).

- [x] Fix js sourcemaps when UglifyJsPlugin was enabled (now adding `//# sourceMappingURL=app.6fce32551585c35c4b80.js.map` again)

## v0.0.91

Released: 2017-06-29.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.90...v0.0.91).

- [x] Upgrade npm deps

## v0.0.90

Released: 2017-06-23.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.88...v0.0.90).

- [x] Respect local `.babelrc`, allowing for e.g. transform-object-assign to work in content and thus fix issues with IE 11

## v0.0.88

Released: 2017-06-02.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.87...v0.0.88).

- [x] Add support for `_config.develop.yml`. If it exists, it will be merged over `_config.yml` but "under" magic keys: `gems`, `exclude`, `include` that can be influenced via `LANYON_DISABLE_GEMS` `LANYON_EXCLUDE` `LANYON_INCLUDE` env vars

## v0.0.87

Released: 2017-05-29.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.86...v0.0.87).

- [x] Make common bundles use a hash in their filenames as it might resolve behavior reported in https://github.com/webpack/webpack/issues/959

## v0.0.86

Released: 2017-04-29.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.85...v0.0.86).

- [x] Upgrade github-pages 129->134 and jekyll 3.3.0->3.4.3

## v0.0.85

Released: 2017-04-27.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.84...v0.0.85).

- [x] Avoid: `Warning: It looks like you're using a minified copy of the development build of React.`

## v0.0.84

Released: 2017-04-25.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.83...v0.0.84).

- [x] Improved React support

## v0.0.83

Released: 2017-04-21.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.82...v0.0.83).

- [x] Fix bundling npm modules that have a browser entry point and a node entry point (thx @goto-bus-stop)
- [x] Fix bundling modules that happen to have the same name as a Webpack loader that's also installed. (BREAKING: all modules now exlicitly need to be suffixed with `-loader`) (thx @goto-bus-stop)

## v0.0.82

Released: 2017-04-20.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.81...v0.0.82).

- [x] Use `source-map` in production vs the inline variant :o

## v0.0.81

Released: 2017-04-05.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.80...v0.0.81).

- [x] Also scan `npmRoot` for modules, so that consumers that have `website` as a `projectDir` can still have Lanyon locate `babel-loader`, `style-loader`, etc. Removed resolving `babel-loader` due to this. Previously was done for asset loading.

## v0.0.80

Released: 2017-04-05.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.79...v0.0.80).

- [x] Also scan `npmRoot` for modules, so that consumers that have `website` as a `projectDir` can still have Lanyon locate `babel-loader`, `style-loader`, etc. Removed resolving `babel-loader` due to this.

## v0.0.79

Released: 2017-04-05.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.78...v0.0.79).

- [x] Resolve `babel-loader` so the projectDir does not need it

## v0.0.78

Released: 2017-04-05.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.77...v0.0.78).

- [x] Allow any kind of hook

## v0.0.77

Released: 2017-04-05.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.75...v0.0.77).

- [x] Allow hooks to only run on e.g. `build:content` vs also on `build:assets`. 
- [x] Run dependency version checks in parallel to speed up boottimes

## v0.0.75

Released: 2017-04-05.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.74...v0.0.75).

- [x] Fix less error by moving resolve-url-loader after less parsing (loaders are used from right to left) `( WARNING in /Users/kvz/code/lanyon/~/css-loader?{}!/Users/kvz/code/lanyon/~/less-loader/dist?{}!/Users/kvz/code/lanyon/~/resolve-url-loader!../assets/stylesheets/app.css.less (Emitted value instead of an instance of Error)   resolve-url-loader cannot operate: CSS error /Users/kvz/code/tus.io/assets/stylesheets/app.css.less:21:1: missing '{')`
- [x] Enable Bower via https://github.com/lpiepiora/bower-webpack-plugin/issues/39#issuecomment-291114301 vs `BowerWebpackPlugin`

## v0.0.74

Released: 2017-04-05.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.73...v0.0.74).

- [x] More safe version checking

## v0.0.73

Released: 2017-04-05.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.71...v0.0.73).

- [x] Ship a `deploy` executable for Travis instead of generating one, which relies on `lanyon install`, which is not a file, resulting in more complicated `.travis.yml` files: `./node_modules/lanyon/scripts/ci-deploy.sh`

## v0.0.71

Released: 2017-04-05.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.70...v0.0.71).

- [x] Install an install-shim because travis needs full paths to execute vs scripts in the `before_deploy` step
- [x] Display versions of dependencies for easier debugging

## v0.0.70

Released: 2017-04-05.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.69...v0.0.70).

- [x] Upgrade from webpack `1.14.0` -> `2.3.1` (BowerWebpackPlugin don't work yet)

## v0.0.69

Released: 2017-03-28.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.68...v0.0.69).

- [x] Add support for `extraWebroots` so that you can serve e.g. dummy dynamic content in development

## v0.0.68

Released: 2017-03-24.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.67...v0.0.68).

- [x] Always profile Jekyll on one-off builds
- [x] Better error handling for YAML exceptions
- [x] Fix: `YAMLException: unacceptable kind of an object to dump [object Undefined]`

## v0.0.67

Released: 2017-03-24.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.66...v0.0.67).

- [x] Fix issue where production builds reported bad sourcemaps
- [x] Fix issue where empty `LANYON_DISABLE_GEMS` list results in no gems being enabled

## v0.0.66

Released: 2017-03-24.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.65...v0.0.66).

- [x] Fix issue where multiple webpack instances where running

## v0.0.65

Released: 2017-03-23.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.64...v0.0.65).

- [x] Support for `LANYON_DISABLE_GEMS=jekyll-feed,jekyll-sitemap` allowing you to temporarily disable time consuming plugins

## v0.0.64

Released: 2017-03-23.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.62...v0.0.63).

- [x] Teach Lanyon about zero leading version numbers such as `Docker version 17.03.0-ce`
- [x] Now that jemoji relies on `gemoji` 3.0+ (vs ~2.0), add cli command to generate emoji into `assets/images/emoji` (`build:emoji` calling `bundle exec gemoji extract assets/images/emoji`)
- [x] Switch from `eval-cheap-source-map` to `inline-eval-cheap-source-map` for presumably faster builds https://github.com/erikras/react-redux-universal-hot-example/issues/616
- [x] Upgrade GitHub pages from 112 to 129
- [x] Remove `jekyll-crosspost-to-medium` as built in gem
- [x] Downgrade `css-loader` to 0.14.5 to address superslow HMR builds https://github.com/webpack-contrib/css-loader/issues/124
- [x] Pass down `DEBUG` env var
- [x] Upgrade `scrolex@0.0.27`

## v0.0.63

The release that wasn't

## v0.0.62

Released: 2017-02-18.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.61...v0.0.62).

- [x] Upgrade node-sass to address peerInvalid: https://travis-ci.org/kvz/lanyon/jobs/202922768#L455

## v0.0.61

Released: 2017-02-18.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.60...v0.0.61).

- [x] Fix bug: Do not add empty items to `exclude` (or everything gets excluded)

## v0.0.60

Released: 2017-02-17.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.59...v0.0.60).

- [x] Add support for e.g. `LANYON_EXCLUDE=_posts,_demos` env var, allowing you to temporarily not build content
- [x] Instead of overwriting a project's `exclude`, add to it.
- [x] Upgrade to resolve-url >2.0, fixing a bug where leading to broken font-awesome icons in chrome in dev mode
- [x] Upgrade minor & patch level dependencies 

## v0.0.59

Released: 2017-02-15.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.58...v0.0.59).

- [x] Upgrade to `scrolex@0.0.26` which will default to `passthru` `mode` on Travis CI and non-TTY environments

## v0.0.58

Released: 2017-02-15.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.57...v0.0.58).

- [x] Fix bug that prevented resetting of shims

## v0.0.57

Released: 2017-02-15.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.56...v0.0.57).

- [x] Fix rvm homebrew lock on Travis
- [x] Add support for `postbuild` hooks

## v0.0.56

Released: 2017-02-15.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.55...v0.0.56).

- [x] Only use singlescroll on `start`
- [x] In boot, treat `lanyon` like any other `npmBin`
- [x] Switch to using rvm `--binary` to avoid compile issues (https://travis-ci.org/kvz/lanyon/jobs/201786728#L1679)

## v0.0.55

Released: 2017-02-15.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.54...v0.0.55).

- [x] Find `node_modules/.bin/lanyon` in `npmRoot` vs `projectDir`

## v0.0.54

Released: 2017-02-14.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.53...v0.0.54).

- [x] Make gem-paths absolute
- [x] Use npm `files`

## v0.0.53

Released: 2017-02-14.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.52...v0.0.53).

- [x] Remove `lib` from Git again now that we can build on older nodes now that the es2015-loose problem is solved
- [x] Also run `lanyon install` in the Travis deploy shim, so that we can opt to not install lanyon in unrelated branches
- [x] Switch from `es2015-loose` to `es2015` babel preset to resolve build issues on Travis
- [x] Add Dockerfile for testing building on node 0.12 locally
- [x] Remove imagemin so long as we're not using it and it's causing build problems (gifsicle: Assertion failed: 0 (../deps/uv/src/uv-common.c: uv_err_name: 143))

## v0.0.52

Released: 2017-02-11.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.51...v0.0.52).

- [x] Localize `GEM_HOME` and `GEM_PATH` in container
- [x] Only run acceptance test on all platforms. Rest of the tests on Node 6 only
- [x] Distribute the `Gemfile.lock` as well, allow updates via `LANYON_UPDATE_GEM_LOCKFILE=1`
- [x] Switch from ava -> jest
- [x] Fix bug: `the input device is not a TTY`
- [x] No longer auto install ruby things upon `install`, require an explicit call to `cli.js install` instead
- [x] Introduce async/await for internal use (install)
- [x] Add scrolling output via `scrolex`
- [x] Rename `postinstall` to `install`

## v0.0.51

Released: 2017-01-31.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.50...v0.0.51).

- [x] Add webpack-svgstore-plugin (@arturi, #6)
- [x] Remove underscore version from libxml2 on brew osx prefix as `/usr/local/Cellar/libxml2/2.9.4` exists but advertised `/usr/local/Cellar/libxml2/2.9.4_2` does not
- [x] Add `container:rebuild` to rebuild a container from scratc (`docker build --no-cache`)

## v0.0.50

Released: 2017-01-06.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.49...v0.0.50).

- [x] Add pkg-config to resolve another Another Nokogiri error https://travis-ci.org/kvz/lanyon/jobs/193744753#L418
- [x] Skip installs if `LANYON_NOINSTALL==1`
- [x] Switch to ES6 (see https://github.com/transloadit/botty/blob/738f9d51417d84d429cd4b558898bc3a9826cd9d/decaf.sh), mostly to profit from template strings. Transpile down to ES5 for npm as Lanyon aims for portability.

## v0.0.49

Released: 2017-01-06.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.48...v0.0.49).

- [x] Add experimental support for optimizing images via `build:images` (from `assets/images` to `assets/build/images`)
- [x] Build docker container inside `.lanyon` dir. Write config from `utils` like any other config, vs copying over files (allows for intelligent cache invalidation later on also)
- [x] Do not use docker cache so we get a fresh Gemfile. Fixes https://travis-ci.org/kvz/lanyon/jobs/188882616#L1530
- [x] Add `container:connect` command to look inside docker container
- [x] Give Lanyon Jekyll :gem: theme awareness

## v0.0.48

Released: 2017-01-04.
[Diff](https://github.com/kvz/lanyon/compare/v0.0.47...v0.0.48).

- [x] Upgrade to github pages gem version `v104` -> `v112` (https://github.com/github/pages-gem/compare/v104...v112)
- [x] Provide access to gemlist of gh pages gem for internal use via `./lib/cli.js list:ghpgems`
- [x] Avoid new installs preferring nokogiri 1.7 over 1.6 so more systems can use Ruby 2.0 vs then nokogiri 1.7 required 2.1
- [x] Also initProject at `start` so that config can be written if users type start as a first run
- [x] Add a website <http://lanyon.io>
- [x] First go into projectDir before running deploy, to support nested websites

## v0.0.47

[Diff](https://github.com/kvz/lanyon/compare/v0.0.46...v0.0.47).

- [x] Basic support for injecters via `contentIgnore` and `contentScandir`

## v0.0.46

[Diff](https://github.com/kvz/lanyon/compare/v0.0.45...v0.0.46).

- [x] Add support for `OptimizeCssAssetsPlugin`

## v0.0.45

[Diff](https://github.com/kvz/lanyon/compare/v0.0.44...v0.0.45).

- [x] Support for a `js-untouched` directory, where js won't pass through babel

## v0.0.44

[Diff](https://github.com/kvz/lanyon/compare/v0.0.43...v0.0.44).

- [x] Fix babel source maps
- [x] Only exit on error when in production mode`

## v0.0.43

[Diff](https://github.com/kvz/lanyon/compare/v0.0.42...v0.0.43).

- [x] Use Babel ES2015 as shipped by Lanyon, ignoring any project's `.babelrc` (BREAKING) (We _might_ support sth more intelligent in the future, but for now are favoring convention & near-zero-setup by the project)
- [x] "Don't use JSX loader, use babel instead" - https://github.com/petehunt/jsx-loader
- [x] Fix bug: test: could not interpret expression

## v0.0.42

[Diff](https://github.com/kvz/lanyon/compare/v0.0.41...v0.0.42).

- [x] Ditch uglify loader in favor of plugin, as the loader cannot handle ES6 (even though the babel loader is ran first)

## v0.0.41

[Diff](https://github.com/kvz/lanyon/compare/v0.0.40...v0.0.41).

- [x] Fix bug where only incremental builds receive asset indices
- [x] Only reset `jekyll.lanyon_assets.yml` if it does not exist

## v0.0.40

[Diff](https://github.com/kvz/lanyon/compare/v0.0.39...v0.0.40).

- [x] Add globby as a dependency

## v0.0.39

[Diff](https://github.com/kvz/lanyon/compare/v0.0.38...v0.0.39).

- [x] Fix deploy failsafe

## v0.0.38

[Diff](https://github.com/kvz/lanyon/compare/v0.0.37...v0.0.38).

- [x] No longer exclude `node_modules|bower_components|vendor` by default
- [x] Disable resolve-url-loader for less as less currently produces invalid css (in its eyes)
- [x] Make errors fatal in production
- [x] Include plain css with ExtractTextPlugin

## v0.0.37

[Diff](https://github.com/kvz/lanyon/compare/v0.0.36...v0.0.37).

- [x] Make Deploy check aware of hashed cachebuster assets
- [x] Fix less resolve-url-loader sourcemap issues

## v0.0.36

[Diff](https://github.com/kvz/lanyon/compare/v0.0.35...v0.0.36).

- [x] Move uglify loader to deps (vs devDeps)

## v0.0.35

[Diff](https://github.com/kvz/lanyon/compare/v0.0.34...v0.0.35).

- [x] Build assets first, so that Jekyll can copy it into `_site`, and also `jekyll.lanyon_assets.yml` exists in time
- [x] Add debugging notes
- [x] Add uglify as a dependency

## v0.0.34

[Diff](https://github.com/kvz/lanyon/compare/v0.0.33...v0.0.34).

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

[Diff](https://github.com/kvz/lanyon/compare/v0.0.32...v0.0.33).

- [x] Add plain css files to extract text plugin /thx @Acconut

## v0.0.32

[Diff](https://github.com/kvz/lanyon/compare/v0.0.31...v0.0.32).

- [x] Allow relative projectDir

## v0.0.31

[Diff](https://github.com/kvz/lanyon/compare/v0.0.30...v0.0.31).

- [x] Allow scanning from `LANYON_PROJECT`

## v0.0.30

[Diff](https://github.com/kvz/lanyon/compare/v0.0.29...v0.0.30).

- [x] Never settle for `lanyon` as a projectDir

## v0.0.29

[Diff](https://github.com/kvz/lanyon/compare/v0.0.28...v0.0.29).

- [x] Do `realpathSync` relative from `gitRoot`

## v0.0.28

[Diff](https://github.com/kvz/lanyon/compare/v0.0.27...v0.0.28).

- [x] Fix bad build

## v0.0.27

[Diff](https://github.com/kvz/lanyon/compare/v0.0.26...v0.0.27).

- [x] Added `utils.upwardDirContaining` for definitive pathfinding

## v0.0.26

[Diff](https://github.com/kvz/lanyon/compare/v0.0.25...v0.0.26).

- [x] Use `find-up` for finding `gitRoot` and `npmRoot`, which might not be `projectDir`
- [x] Also support `web:deploy` npm script name

## v0.0.25

[Diff](https://github.com/kvz/lanyon/compare/v0.0.24...v0.0.25).

- [x] Also traverse upwards from projectDir to find `node_modules`

## v0.0.24

[Diff](https://github.com/kvz/lanyon/compare/v0.0.23...v0.0.24).

- [x] Better module pathfinding

## v0.0.23

[Diff](https://github.com/kvz/lanyon/compare/v0.0.22...v0.0.23).

- [x] Use `gitRoot` instead of `projectDir` for flat module finding, so it works when your project is in a subdir (like `website` or `docs`)

## v0.0.22

[Diff](https://github.com/kvz/lanyon/compare/v0.0.21...v0.0.22).

- [x] Support for flat module structure where modules live in `projectDir`

## v0.0.21

[Diff](https://github.com/kvz/lanyon/compare/v0.0.20...v0.0.21).

- [x] Deploy now supports `web:build:production`

## v0.0.20

[Diff](https://github.com/kvz/lanyon/compare/v0.0.19...v0.0.20).

- [x] Prefix deps with node

## v0.0.19

[Diff](https://github.com/kvz/lanyon/compare/v0.0.18...v0.0.19).

- [x] Fix bug leading to block install resets

## v0.0.18

[Diff](https://github.com/kvz/lanyon/compare/v0.0.17...v0.0.18).

- [x] Make installs idempotent
- [x] Detect rubyProvider of existing shims
- [x] Introduce a `LANYON_RESET`, that removes all shims

## v0.0.17

[Diff](https://github.com/kvz/lanyon/compare/v0.0.16...v0.0.17).

- [x] Don't rely on `.bin` symlinks as they don't appear to survive Travis CI cache

## v0.0.16

[Diff](https://github.com/kvz/lanyon/compare/v0.0.15...v0.0.16).

- [x] Use spawn-sync for older nodes

## v0.0.15

[Diff](https://github.com/kvz/lanyon/compare/v0.0.14...v0.0.15).

- [x] Pathfinding fixes, added `gitRoot`
- [x] Rename `vendor/bin` to `bin`
- [x] Refactoring of deploy & encrypt

## v0.0.14

[Diff](https://github.com/kvz/lanyon/compare/v0.0.13...v0.0.14).

- [x] Offer `lanyon deploy` for deploying onto GitHub Pages
- [x] Offer `lanyon encrypt` for encrypting GitHub Pages deploy secrets onto Travis CI
- [x] Fix broken shim quoting

## v0.0.13

[Diff](https://github.com/kvz/lanyon/compare/v0.0.12...v0.0.13).

- [x] Avoid double installs by fixing binDir references for shims

## v0.0.12

[Diff](https://github.com/kvz/lanyon/compare/v0.0.11...v0.0.12).

- [x] Utilize Webpack `--production` flag
- [x] Add Jekyll config writer (so we can ignore `node_modules` and `.lanyon`)
- [x] By default prefer system ruby over docker, for performance reasons

## v0.0.11

[Diff](https://github.com/kvz/lanyon/compare/v0.0.10...v0.0.11).

- [x] Add support for `production`-or-`development`-only hooks
- [x] Add coffeescript support
- [x] Add less support

## v0.0.10

[Diff](https://github.com/kvz/lanyon/compare/v0.0.9...v0.0.10).

- [x] Add support for configurable projectDir (so you can have a `./website` or `./docs` in your project)
- [x] Refactoring

## v0.0.9

[Diff](https://github.com/kvz/lanyon/compare/v0.0.8...v0.0.9).

- [x] Switch to a local lanyon install if available
- [x] Simplify/fix Browserify file watching
- [x] Do docker connect via shim
- [x] Store everything in `cacheDir` (projectDir/.lanyon) instead of in node_modules dir

## v0.0.8

[Diff](https://github.com/kvz/lanyon/compare/v0.0.7...v0.0.8).

- [x] Support for prebuild hook

## v0.0.7

[Diff](https://github.com/kvz/lanyon/compare/8d2286d78ea5f0e0ad2b9f021a00158774d31891...v0.0.7).

- [x] Use textextractor loader in production for scss, also check https://github.com/gowravshekar/font-awesome-webpack#extract-text-webpack-plugin
- [x] checkout http://stackoverflow.com/questions/33649761/how-do-i-load-font-awesome-using-scss-sass-in-webpack-using-relative-paths
