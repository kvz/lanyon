[![Build Status](https://travis-ci.org/kvz/lanyon.svg?branch=master)](https://travis-ci.org/kvz/lanyon)

This document is best viewed at <http://lanyon.io/>.

<!--more-->

Lanyon is a static site generator. It functions as a wrapper around Jekyll, Webpack, and BrowserSync, in an attempt to give you the best of all worlds. Lanyon allows you to build and refresh assets instantly and offers fast and reliable file watching. 
Breaking with the traditional unix philosophy, Lanyon tries to do many things. Things such as spell checking or setting up a working Ruby environment. One might, of course, argue that Lanyon is applying unix philosophy after all, by restricting its underlying tools do perform only a single task. :thinking:

Whichever the case, Lanyon is certainly okay with embracing any philosophy, as long as it amounts to THE highest level of convenience when it comes to building static websites. Getting started with Lanyon should be as simple as `npm install lanyon --save` and `npm start`.

## State

Lanyon is currently in pre-alpha. We are still making many changes and – in keeping with SemVer tradition – are allowing ourselves to make breaking ones in `<1`. For that and other reasons, we do not recommend using it for anything serious yet.

## Used by

Lanyon is authored by people at [Transloadit](https://transloadit.com), where it already powers their website and most of their pet-projects:

- <https://transloadit.com>
- <http://tus.io>
- <http://transloadify.io>
- <http://freyproject.io>
- <http://bash3boilerplate.sh>
- <http://lanyon.io> :tada: surprise!

If you are an early adopter of Lanyon, [let us know](https://github.com/kvz/lanyon/issues/new) and get listed! :heart:

## Background

Jekyll is great for documentation and static websites sites, its ecosystem is vast and mature, things that are straightforward in Jekyll often require odd workarounds in Hexo or Hugo. Apart from that, backing from GitHub (Pages) isn't the worst thing to have either. With that in mind, we can assume that whatever we invest in Jekyll today, will be relevant for a few years to come. 

Admittedly, the other generators can also be very appealing because they humiliate Jekyll in certain areas, such as file watching, asset building, speed, browser integration, and ease of install. 

Here is an opinionated overview:


| Quality                                      |        Hugo        |        Hexo        |             Jekyll              |       Lanyon       |  Webpack/BrowserSync/Nodemon   |
|:---------------------------------------------|:------------------:|:------------------:|:-------------------------------:|:------------------:|:------------------------------:|
| Easy to maintain many documents              | :white_check_mark: |                    | :white_check_mark::arrow_right: | :white_check_mark: |                                |
| Great templating engine                      |                    |                    | :white_check_mark::arrow_right: | :white_check_mark: |                                |
| Vast and mature ecosystem                    |                    |                    | :white_check_mark::arrow_right: | :white_check_mark: | :arrow_left::white_check_mark: |
| Easy to get help                             | :white_check_mark: |                    | :white_check_mark::arrow_right: | :white_check_mark: | :arrow_left::white_check_mark: |
| Backed by GitHub                             |                    |                    | :white_check_mark::arrow_right: | :white_check_mark: |                                |
| Easy to install                              | :white_check_mark: | :white_check_mark: |                                 | :white_check_mark: | :arrow_left::white_check_mark: |
| Browser integration for content reloads      |                    |                    |                                 | :white_check_mark: | :arrow_left::white_check_mark: |
| Fast asset building                          |                    | :white_check_mark: |                                 | :white_check_mark: | :arrow_left::white_check_mark: |
| Fast and robust filewatching                 |                    |                    |                                 | :white_check_mark: | :arrow_left::white_check_mark: |
| HMR / immediate in-browser asset refreshment |                    |                    |                                 | :white_check_mark: | :arrow_left::white_check_mark: |

What we set out to do with Lanyon, is to get the best of all worlds. We are doing so by:

- Taking a sledge hammer :hammer: approach towards getting a suitable version of Ruby to work on your system. Lanyon traverses [Docker](https://www.docker.com), [rbenv](https://github.com/rbenv/rbenv), [RVM](https://rvm.io), and [Homebrew](http://brew.sh), and takes the first method that provides a working Ruby 2 install. All other dependencies are then installed locally in the `.lanyon`, relieving any installation pains. 
- Using Browsersync with Webpack middleware, featuring Hot Module Reloading for stylesheets and JavaScript.
- Using Nodemon for `.md` / `.html` file-watching, while kicking incremental Jekyll builds for content.

This enables you to have locally refreshing assets in real time (e.g. in-browser font size changes as you save without the page reloading), and have much more reliable and performant content watching than Jekyll offers. It also gives us libsass (vs Ruby sass), and can sync browsers on many devices in your office so that they will follow along with what you are doing on your main workstation. Even just connecting your phone in this fashion goes a long way in spotting responsive issues quickly. This is a luxury you might normally not be able to afford for your projects, but now the tech to do this works right out of the box with just a single `npm install`!

Lanyon is geared towards developer convenience and, as a bonus, offers:

- Deploys to GitHub Pages from Travis CI or your workstation (we are not compatible with as-is `gh-pages` branch-filling, and have no desire to support that)
- JS linting (WIP)
- Markdown linting (WIP)
- Spell checking (WIP)

Lanyon is used by [Transloadit](https://transloadit.com) for static sites, and focuses on their use-case. Trying to get so many moving parts to behave as they should comes with challenges and a ton of configuration options. Lanyon won't support everything that its underlying components has to offer. Lanyon prefers convention over configuration.

We will be assuming:

- Sass
- ES6
- Assets in `./assets/`, with transpiled assets in `./assets/build/`
- Node modules in `./node_modules/`, Bower components in `./assets/bower_components/` (if any)
- Our users already have a working Node.js setup and don't mind a `package.json` in their project
- GitHub pages for deploys (with Travis CI as a builder)
- To simplify things, any environment other than `development` means `production`. If you have additional stages like `test`, you will likely want to test as close to production as possible anyway.

If you are thinking about submitting PRs for other features/flexibility, please get in touch first as we might not be on board.

If, however, there happens to be an overlap with your use case and you can live with our constraints, here is how you get started with Lanyon:

## Install

```bash
npm install lanyon --save 
```

## Use

The recommended way to use Lanyon is to add it to your project's npm scripts, in your `package.json`, add:

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
  "install": "bower install && lanyon postinstall",
  "build": "lanyon build",
  "build:emoji": "lanyon build:emoji",
  "build:production": "LANYON_ENV=production lanyon build",
  "serve": "lanyon serve",
  "serve:production": "LANYON_ENV=production lanyon serve",
  "start": "lanyon start",
  "start:production": "npm run build:production && npm run serve:production",
  "encrypt": "lanyon encrypt",
  "deploy": "lanyon deploy"
},
...
```

If you make changes to your gems later on, re-run `npm install` to re-trigger a build.

Have an `assets/app.js` in which you require both javascripts and stylesheets:

```javascript
require('./main.js') // <-- your original sources, as many as you like
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

**Note** You do not have to create your own `app.css` stylesheet entry-point. 
You are supposed to require CSS in `app.js`, which will then be written out by Lanyon
to `app.css` in production (and live in Webpack memory during development). :scream:

Include the build in your layout. The same location works both for production artifact files, and magic Hot Module Reloading during development.

{%raw%}
```html
<head>
  <title>No hassle</title> 
  <link rel="stylesheet" href="{{site.lanyon_assets.app.css}}"> 
</head>
<body> ... </body>
<script src="{{site.lanyon_assets.app.js}}"></script>
```
{%endraw%}

**Note** Lanyon provides the magic `lanyon_assets` variable in Jekyll, pointing to either `/assets/build/app.js` in development, or `/assets/build/app.bfcebf1c103b9f8d41bd.js` in production, so that you can enable long-term caching of assets and also cache-bust them whenever they change. This works for all entries and asset types, and thus also for e.g. `common.css`.

Afterwards, type `npm start`. This will kick a build, spin up file watching and a browser with HMR asset reloading enabled. For more inspiration, check out the [`example`](./example) folder in the Lanyon repository. The Lanyon website is also bundled under [`website`](./website), this is a little bit more advanced as it builds from the `README.md` and other Markdown files in the repo. This means there is no separate content to maintain on <http://lanyon.io>.

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
