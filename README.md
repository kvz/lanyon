[![Build Status](https://travis-ci.org/kvz/lanyon.svg?branch=master)](https://travis-ci.org/kvz/lanyon)

Lanyon is a static site generator. It is a wrapper around Jekyll, Webpack, BrowserSync, Nodemon, in an attempt to give you the best of all worlds :earth_asia: :earth_americas: :earth_africa: (Instant asset building & refreshing, fast & reliable file watching). In addition, it has many tricks up its sleeves to get a working Ruby environment on your system, so that getting started with Lanyon should be as simple as `npm install lanyon`.

## State

Lanyon is currently pre-alpha. We're still doing many changes and as per SemVer are allowing ourselves to make breaking ones in `<1`. We do not recommend using it for anything serious yet.

## Background

Jekyll is great for documentation and static websites sites, the ecosystem is vast and mature, things that are straightforward in Jekyll require odd workarounds in Hexo or Hugo. GitHub backing isn't the worst to have either, and we can assume that what we invest in Jekyll today, will still be relevant for a few more years. 

Admittedly the other generators are very appealing and humiliate Jekyll when it comes to file watching, asset building, speed, browser integration, ease of install. Here is a highly opinionated overview:


| Quality                                                             |        Hugo        |        Hexo        |       Jekyll       |                    Lanyon                    | Webpack/BrowserSync/Nodemon |
|:--------------------------------------------------------------------|:------------------:|:------------------:|:------------------:|:--------------------------------------------:|:---------------------------:|
| Easy to maintain many documents                                     | :white_check_mark: |                    | :white_check_mark: |  :arrow_left::white_check_mark::arrow_left:  |                             |
| Great templating engine                                             |                    |                    | :white_check_mark: |  :arrow_left::white_check_mark::arrow_left:  |                             |
| Vast & mature ecosystem                                             |                    |                    | :white_check_mark: | :arrow_left::white_check_mark::arrow_right:  |     :white_check_mark:      |
| Easy to get help                                                    | :white_check_mark: |                    | :white_check_mark: | :arrow_left::white_check_mark::arrow_right:  |     :white_check_mark:      |
| Backed by GitHub                                                    |                    |                    | :white_check_mark: |  :arrow_left::white_check_mark::arrow_left:  |                             |
| Easy to install                                                     | :white_check_mark: | :white_check_mark: |                    | :arrow_right::white_check_mark::arrow_right: |     :white_check_mark:      |
| Browser integration for content reloads                             |                    |                    |                    | :arrow_right::white_check_mark::arrow_right: |     :white_check_mark:      |
| Fast asset building                                                 |                    | :white_check_mark: |                    | :arrow_right::white_check_mark::arrow_right: |     :white_check_mark:      |
| Fast and robust filewatching                                        |                    |                    |                    | :arrow_right::white_check_mark::arrow_right: |     :white_check_mark:      |
| HMR (Hot module reloading) / immediate in-browser asset refreshment |                    |                    |                    | :arrow_right::white_check_mark::arrow_right: |     :white_check_mark:      |

So what we set out to do with Lanyon, is get the best of all worlds. We're doing so by:

- Using browsersync with Webpack middleware featuring Hot module reloading
- Taking a sledge hammer :hammer: approach at getting a suitable Ruby to work on your system, traversing, docker, rbenv, rvm, brew, taking the first thing that can get us a working Ruby 2 install, installing all other dependencies locally
- Using Nodemon for md/html file-watching, kicking incremental Jekyll builds

Lanyon is geared towards developer convenience and as a bonus offers:

- Deploys to GitHub Pages (from Travis or your workstation, we are not compatible with as-is `gh-pages` branch-filling and have no desire to support that)
- Markdown linting
- Spell checking

Lanyon is used by [Transloadit](https://transloadit.com) for static sites, and is geared towards their use-case. Trying to get so many moving parts to behave comes with challenges and a ton of configuration options. This project won't support all the things that its underlying components support, and prefers convention over configuration.

We'll be assuming:

- Sass
- ES6 (and maybe React)
- Assets in `./assets/`, with transpiled assets in `./assets/build`
- `app.js` is the primary entry point
- Our users already have a working Node.js setup and don't mind a `package.json` in their project

If you're thinking about submitting PRs for other features/flexibility, get in touch first please as we might not be on board.

If however, you are onboard with what we're setting out to do, here's how you get started with Lanyon:

## Install

```bash
npm install --save lanyon
```

## Use

The recommended way to use Lanyon is to add it to your project's npm run scripts, in your `package.json`, add:

```javascript
...
  "lanyon": {
    "entries": [
      "app"
    ]
  },
  "scripts": {
    "build": "lanyon build",
    "build:production": "LANYON_ENV=production lanyon build",
    "preview:production": "lanyon build:production && LANYON_ENV=production lanyon serve",
    "serve": "lanyon serve",
    "start": "lanyon start"
  },
...
```

Afterwards, type `npm start`. This will kick a build, spin up file watching and a browser with HMR asset reloading enabled. For more inspiration check out the [`example`](./example) folder in the Lanyon repository.

## About Ruby

It's definitely a paint-point making us jealous of Hugo (and even Hexo). So far 10/10 devs that we asked to make Jekyll working locally had _some_ problem with their Ruby install and its dependencies. The number of nokogiri or permission errors, version conflicts, etc, we've had to deal with, are just, sad. Lanyon tries its best at resolving this. We're testing for many different Operating Systems and versions, as well as different versions of Node, and Ruby version managers, to see if we can still automatically get Ruby to work on them:

![screen shot 2016-11-25 at 21 17 39](https://cloud.githubusercontent.com/assets/26752/20634771/9e163fb2-b354-11e6-914c-ac8e54ab68e1.png)

### Flow

Lanyon tries to utilize one of following components to acquire a working Ruby 2+ install:

1. (Just use the `system`'s) Ruby
1. [`docker`](https://www.docker.com/)
1. [`rbenv`](https://github.com/rbenv/rbenv) (with the [ruby-build](https://github.com/rbenv/ruby-build) plugin)
1. [`rvm`](https://rvm.io/)

As soon as we have a working Ruby install, we install Bundler & gems locally in your project directory, and Lanyon can start building.

You can disable any of these via e.g. `LANYON_SKIP="rbenv docker"`.

To force a particular type, you can also use `LANYON_ONLY=docker`. This is how we isolate methods of installment on Travis for testing as well.

## Prerequisites

- Node.js 0.12+ (& npm)
- OSX / Linux (& Bash)

### macOS

Lanyon tries its best to contain the work it does and leave your current Ruby setup alone.
The best way to do this today is with containers, and if your system
supports `docker`, that's what Lanyon will use if your system doesn't natively support 
the required Ruby versions.

Since this is a very low-risk approach, it's the recommended way to run Lanyon, and
we therefore also recommend to install a recent version of Docker first:

In case you had previous Docker, experiments please uninstall those:

```bash
brew uninstall --force docker-machine boot2docker docker
```

Then, follow **Docker for Mac** instructions on <https://docs.docker.com/docker-for-mac/> 
(it's just installing a `.dmg`) and verify it worked:

```bash
docker --version && docker ps
```

### Ubuntu Trusty

Lanyon wants to work everywhere where there's Node, but on older Ubuntu versions, that can 
still be a bit of a hassle. Here are two different ways of installing Node.js on Ubuntu Trusty:


#### Node 6

To install the Node.js dependency on Ubuntu Trusty, either use a new release from NodeSource:

```bash
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
```

#### Node 0.12

**Or**, run an old Node.js version, straight from the main repo. Lanyon (still) supports 0.12,
so you might prefer it over adding a 3rd party repository:

```bash
sudo apt-get install nodejs-legacy npm
node -v
```
