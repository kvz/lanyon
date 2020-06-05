[![Build Status](https://travis-ci.org/kvz/lanyon.svg?branch=master)](https://travis-ci.org/kvz/lanyon)

**Disclaimer 2018-03-26:** Lanyon's initial goal was to be a tool for everybody, but since it never really took off and that we have limited time to make this _really_ nice, we've decided to reduce its scope to be useful to just <https://transloadit.com>. We won't be as interested in supported other usecases, so you might want to think twice about adopting it. This is mostly still publicly available for our own convenience, and in the off-chance Lanyon as-is, is still useful to others. In addition, we've introduced the requirement of Node 8 & Docker installed, in order to cut down on countering with Ruby dependency hells and speed up development without transpiling.

## Migration guide to Docker-only-Lanyon:

- `yarn add lanyon@0.0.132` (or higher)
- `rm -rf .lanyon Gemfile*`
- `_config.yml`: `gems`->`plugins`
- `package.json`: remove `'lanyon'` and save config in `.lanyonrc.js` instead
- git ignore `.jekyll-cache/` and `.jekyll-metadata`

## Use

If you want to speed up on OSX and set `dockerSync.enabled = true`, first install:

```
sudo gem install docker-sync
```

## Changelog

Please see the [CHANGELOG.md](./CHANGELOG.md) file.

## Contributing

Please see the [CONTRIBUTING.md](./CONTRIBUTING.md) file.

## Reading List

These articles where helpful in creating Lanyon

- Check for recent `github-pages` versions at <https://rubygems.org/gems/github-pages/versions>
- Check for recent Jekyll versions at <https://github.com/jekyll/jekyll/releases>
- <https://slack.engineering/keep-webpack-fast-a-field-guide-for-better-build-performance-f56a5995e8f1>
- <https://webpack.js.org/guides/build-performance/>
- <https://github.com/petehunt/webpack-howto/blob/master/README.md#8-optimizing-common-code>
- <https://www.jonathan-petitcolas.com/2016/08/12/plugging-webpack-to-jekyll-powered-pages.html>
- <https://webpack.github.io/docs/configuration.html#resolve-alias>
- <https://github.com/HenrikJoreteg/hjs-webpack>
- <http://webpack.github.io/docs/webpack-dev-middleware.html>
- <http://stackoverflow.com/a/28989476/151666>
- <https://github.com/webpack/webpack-dev-server/issues/97#issuecomment-70388180>
- <https://webpack.github.io/docs/hot-module-replacement.html>
- <https://github.com/css-modules/webpack-demo/issues/8#issuecomment-133922019>
- <https://github.com/gowravshekar/font-awesome-webpack>
- <https://webpack.github.io/docs/code-splitting.html#split-app-and-vendor-code>
- <https://medium.com/@okonetchnikov/long-term-caching-of-static-assets-with-webpack-1ecb139adb95#.w0elv8n7o>
- <https://webpack.github.io/docs/optimization.html>

## Authors

 - [Kevin van Zonneveld](https://transloadit.com/about/#kevin)
 - [Artur Paikin](https://github.com/arturi)

## License

Copyright (c) 2016 Kevin van Zonneveld. Licenses under [MIT](LICENSE).
