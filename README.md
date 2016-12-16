[![Build Status](https://travis-ci.org/kvz/lanyon.svg?branch=master)](https://travis-ci.org/kvz/lanyon)

This document is best viewed at <http://lanyon.io/>.

<!--more-->

Lanyon is a static site generator. It is a wrapper around Jekyll, Webpack, BrowserSync, Nodemon, in an attempt to give you the best of all worlds :earth_asia: :earth_americas: :earth_africa: (Instant asset building & refreshing, fast & reliable file watching). 
Spitting in the face of unix philosophy, it tries to do many things, such as spell checking, and setting up a working Ruby environment. OTH, One might argue it's applying unix philosophy by making underlying tools do one thing only :thinking:

Whichever the case, Lanyon is certainly okay with embracing/sacrificing whichever philosophy so long as it amounts to THE highest level of convenience around building static websites. Getting started should be as simple as `npm install lanyon` and `lanyon start`.

## State

Lanyon is currently pre-alpha. We're still doing many changes and as per SemVer are allowing ourselves to make breaking ones in `<1`. We do not recommend using it for anything serious yet.

## Used by

Lanyon is authored by people at [Transloadit](https://transloadit.com) and hence it already powers their website and most of their pet-projects:

- <https://transloadit.com>
- <http://uppy.io>
- <http://tus.io>
- <http://transloadify.io>
- <http://freyproject.io>
- <http://bash3boilerplate.sh>
- <http://lanyon.io> :tada: surprise!

If you're an early adopter of Lanyon, [let us know](https://github.com/kvz/lanyon/issues/new) and get listed!

## Background

Jekyll is great for documentation and static websites sites, the ecosystem is vast and mature, things that are straightforward in Jekyll require odd workarounds in Hexo or Hugo. GitHub backing isn't the worst to have either, and we can assume that what we invest in Jekyll today, will still be relevant for a few more years. 

Admittedly the other generators are very appealing and humiliate Jekyll when it comes to file watching, asset building, speed, browser integration, ease of install. Here is a highly opinionated overview:


| Quality                                      |        Hugo        |        Hexo        |             Jekyll              |       Lanyon       |  Webpack/BrowserSync/Nodemon   |
|:---------------------------------------------|:------------------:|:------------------:|:-------------------------------:|:------------------:|:------------------------------:|
| Easy to maintain many documents              | :white_check_mark: |                    | :white_check_mark::arrow_right: | :white_check_mark: |                                |
| Great templating engine                      |                    |                    | :white_check_mark::arrow_right: | :white_check_mark: |                                |
| Vast & mature ecosystem                      |                    |                    | :white_check_mark::arrow_right: | :white_check_mark: | :arrow_left::white_check_mark: |
| Easy to get help                             | :white_check_mark: |                    | :white_check_mark::arrow_right: | :white_check_mark: | :arrow_left::white_check_mark: |
| Backed by GitHub                             |                    |                    | :white_check_mark::arrow_right: | :white_check_mark: |                                |
| Easy to install                              | :white_check_mark: | :white_check_mark: |                                 | :white_check_mark: | :arrow_left::white_check_mark: |
| Browser integration for content reloads      |                    |                    |                                 | :white_check_mark: | :arrow_left::white_check_mark: |
| Fast asset building                          |                    | :white_check_mark: |                                 | :white_check_mark: | :arrow_left::white_check_mark: |
| Fast and robust filewatching                 |                    |                    |                                 | :white_check_mark: | :arrow_left::white_check_mark: |
| HMR / immediate in-browser asset refreshment |                    |                    |                                 | :white_check_mark: | :arrow_left::white_check_mark: |

So what we set out to do with Lanyon, is get the best of all worlds. We're doing so by:

- Using Browsersync with Webpack middleware featuring Hot module reloading
- Taking a sledge hammer :hammer: approach at getting a suitable Ruby to work on your system, traversing, docker, rbenv, rvm, brew, taking the first thing that can get us a working Ruby 2 install, installing all other dependencies locally
- Using Nodemon for md/html file-watching, kicking incremental Jekyll builds

Lanyon is geared towards developer convenience and as a bonus offers:

- Deploys to GitHub Pages (from Travis or your workstation, we are not compatible with as-is `gh-pages` branch-filling and have no desire to support that)
- JS linting (WIP)
- Markdown linting (WIP)
- Spell checking (WIP)

Lanyon is used by [Transloadit](https://transloadit.com) for static sites, and is geared towards their use-case. Trying to get so many moving parts to behave comes with challenges and a ton of configuration options. This project won't support all the things that its underlying components support, and prefers convention over configuration.

We'll be assuming:

- Sass
- ES6 (and maybe React)
- Assets in `./assets/`, with transpiled assets in `./assets/build`
- Node modules in `./node_modules/`, Bower components in `./assets/bower_components` (if any)
- `app.js` is the primary entry point
- Our users already have a working Node.js setup and don't mind a `package.json` in their project
- GitHub pages for deploys (with Travis CI as a builder)
- Any environment other than `development` means `production`. This is to simplify, and if you have additional stages like `test`, you'll likely want to test as close to production as possible anyway.

If you're thinking about submitting PRs for other features/flexibility, get in touch first please as we might not be on board.

If however, there happens to be an overlap with your use case and you can live with our constraints, here's how you get started with Lanyon:

## Install

```bash
npm install lanyon --save 
```

## Use

The recommended way to use Lanyon is to add it to your project's npm run scripts, in your `package.json`, add:

```javascript
...
  "lanyon": {
    "entries": [
      // As single 'app' entry is the default. List all entries here if you have more
      "app"
    ],
    "gems": {
      // If you require custom gems
      "liquid_pluralize": "1.0.2"
    }
  },
  "scripts": {
    "build:production": "LANYON_ENV=production lanyon build",
    "build": "lanyon build",
    "deploy": "lanyon deploy",
    "encrypt": "lanyon encrypt",    
    "serve:production": "LANYON_ENV=production lanyon serve",
    "serve": "lanyon serve",
    "start:production": "npm run build:production && npm run serve:production",
    "start": "lanyon start"
  },
...
```

If you make changes to your gems later on, run `node node_modules/.bin/lanyon postinstall` to re-trigger a build.

Have an `assets/app.js` in which you require both javascripts and stylesheets:

```javascript
require('js/main.js')      // <-- or wherever you kept your javascripts
require('sass/main.scss')  // <-- or wherever you kept your stylesheets
```

in your layout, include the build (same location works both for production artifact files, as well as magic Hot Module Reloading):

{%raw%}
```html
<!-- head -->
<link rel="stylesheet" href="{{site.lanyon_assets.app.css}}">
<!-- footer -->
<script src="{{site.lanyon_assets.app.css}}"></script>
```
{%endraw%}

> Note that lanyon provides magic `lanyon_assets` variables in Jekyll, pointing to either `/assets/build/common.js` in development, or `/assets/build/common.bfcebf1c103b9f8d41bd.js` in production so you can enable longterm caching of assets and also cachebust them when they change. This works for all entries and asset types, so also for e.g. `app.css`.

Afterwards, type `npm start`. This will kick a build, spin up file watching and a browser with HMR asset reloading enabled. For more inspiration check out the [`example`](./example) folder in the Lanyon repository.

## Changelog

Please see the [CHANGELOG.md](./CHANGELOG.md) file.

## Frequently Asked Questions

Please see the [FAQ.md](./FAQ.md) file.

## Contributing

Please see the [CONTRIBUTING.md](./CONTRIBUTING.md) file.

## Authors

 - [Kevin van Zonneveld](https://transloadit.com/about/#kevin)

## License

Copyright (c) 2016 Kevin van Zonneveld. Licenses under [MIT](LICENSE).
