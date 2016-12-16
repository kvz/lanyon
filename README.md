[![Build Status](https://travis-ci.org/kvz/lanyon.svg?branch=master)](https://travis-ci.org/kvz/lanyon)

This document is best viewed at <http://lanyon.io/>.

<!--more-->

Lanyon is a static site generator. It is a wrapper around Jekyll, Webpack, BrowserSync, Nodemon, in an attempt to give you the best of all worlds :earth_asia: :earth_americas: :earth_africa: (Instant asset building & refreshing, fast & reliable file watching). 
Spitting in the face of unix philosophy, it tries to do many things, such as spell checking, and setting up a working Ruby environment. OTH, One might argue it's applying unix philosophy by making underlying tools do one thing only :thinking:

Whichever the case, Lanyon is certainly okay with embracing/sacrificing whichever philosophy so long as it amounts to THE highest level of convenience around building static websites. Getting started should be as simple as `npm install lanyon --save` and `npm start`.

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

Jekyll is great for documentation and static websites sites, the ecosystem is vast and mature, things that are straightforward in Jekyll require odd workarounds in Hexo or Hugo. GitHub (Pages) backing isn't the worst thing to have either, and we can assume that what we invest in Jekyll today, will be relevant for a few more years. 

Admittedly the other generators are very appealing and humiliate Jekyll when it comes to file watching, asset building, speed, browser integration, ease of install. Here is an opinionated overview:


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

- Using Browsersync with Webpack middleware featuring Hot Module Reloading
- Taking a sledge hammer :hammer: approach at getting a suitable Ruby to work on your system, traversing, [Docker](https://www.docker.com), [rbenv](https://github.com/rbenv/rbenv), [RVM](https://rvm.io), and [Homebrew](http://brew.sh), taking the first method that can get us a working Ruby 2 install, and installing all other dependencies locally in `.lanyon`
- Using Nodemon for `.md` / `.html` file-watching, kicking incremental Jekyll builds

This enables you to locally have realtime refreshing assets (colors change in the browser as you save), and have much more reliable and performant content watching than Jekyll offers. It also gives us libsass (vs ruby sass), and can sync browsers on many devices in your office so that they'll follow along with what you are clicking on and scrolling down to.

Normally these things take a ton of time, research and guidance to set up across your team and projects. By standardizing and coupling the tools involved, Lanyon makes this immediate and fun.

Lanyon is geared towards developer convenience and as a bonus offers:

- Deploys to GitHub Pages (from Travis or your workstation, we are not compatible with as-is `gh-pages` branch-filling and have no desire to support that)
- JS linting (WIP)
- Markdown linting (WIP)
- Spell checking (WIP)

Lanyon is used by [Transloadit](https://transloadit.com) for static sites, focusses on their use-case. Trying to get so many moving parts to behave comes with challenges and a ton of configuration options. Lanyon won't support all the things that its underlying components support, and prefers convention over configuration.

We'll be assuming:

- Sass
- ES6
- Assets in `./assets/`, with transpiled assets in `./assets/build`
- Node modules in `./node_modules/`, Bower components in `./assets/bower_components` (if any)
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
      // As single 'app' entry is the default. 
      // List all entries here if you have more
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
require('./main.js') // <-- your original sources 
require('./style.css') // <-- yes, we also require (s)css. This is a Webpack thing

// Enable Hot Module reloading:
if (module.hot) {
  module.hot.accept('./main.js', function () {
    require('./main.js')
  })
  module.hot.accept('./style.css', function () {
    require('./style.css')
  })
}
```

in your layout, include the build (the same location works both for production artifact files, as well as magic Hot Module Reloading during development):

{%raw%}
```html
<!-- You do not have to create your own app.css stylesheet entry-point. 
You're supposed to require css in app.js, and that will be written out 
to app.css in production (and live in memory during development) -->
<head>
  <title>No hassle</title> 
  <link rel="stylesheet" href="{{site.lanyon_assets.app.css}}"> 
</head>
<body> ... </body>
<script src="{{site.lanyon_assets.app.js}}"></script>
```
{%endraw%}

**Note** that lanyon provides the magic `lanyon_assets` variable in Jekyll, pointing to either `/assets/build/app.js` in development, or `/assets/build/app.bfcebf1c103b9f8d41bd.js` in production so that you can enable longterm caching of assets and also cache-bust them when they change. This works for all entries and asset types, so also for e.g. `common.css`.

Afterwards, type `npm start`. This will kick a build, spin up file watching and a browser with HMR asset reloading enabled. For more inspiration check out the [`example`](./example) folder in the Lanyon repository. The Lanyon website is also bundled under [`website`](./website), this is a little bit more advanced as it builds from the `README.md` and other Markdown files in the repo. This means there is no separate content to maintain on <http://lanyon.io>

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
