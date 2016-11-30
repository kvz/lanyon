# Changelog

# Unplanned

- [ ] Use noerrors in dev
- [ ] jRuby support https://spin.atomicobject.com/2013/04/24/bundler-jruby-complete/
- [ ] Use orderoccurance in dev
- [ ] Consider shipping all of Lanyon inside a Docker container
- [ ] Utilize Webpack `--production` flag

# v0.0.11

[Diff](https://github.com/kvz/lanyon/compare/v0.0.10...v0.0.11)

- [x] Add support for `production`-or-`development`-only hooks
- [x] Add coffeescript support
- [x] Add less support

# v0.0.10

[Diff](https://github.com/kvz/lanyon/compare/v0.0.9...v0.0.10)

- [x] Add support for configurable projectDir (so you can have a `./website` or `./docs` in your project)
- [x] Refactoring

# v0.0.9

[Diff](https://github.com/kvz/lanyon/compare/v0.0.8...v0.0.9)

- [x] Switch to a local lanyon install if available
- [x] Simplify/fix Browserify file watching
- [x] Do docker connect via shim
- [x] Store everything in `cacheDir` (projectDir/.lanyon) instead of in node_modules dir

# v0.0.8

[Diff](https://github.com/kvz/lanyon/compare/v0.0.7...v0.0.8)

- [x] Support for prebuild hook

# v0.0.7

[Diff](https://github.com/kvz/lanyon/compare/8d2286d78ea5f0e0ad2b9f021a00158774d31891...v0.0.7)

- [x] Use textextractor loader in production for scss, also check https://github.com/gowravshekar/font-awesome-webpack#extract-text-webpack-plugin
- [x] checkout http://stackoverflow.com/questions/33649761/how-do-i-load-font-awesome-using-scss-sass-in-webpack-using-relative-paths
