[![Build Status](https://travis-ci.org/kvz/lanyon.svg?branch=master)](https://travis-ci.org/kvz/lanyon)

In my opinion, Jekyll is the best static site generator, the ecosystem is vast and mature, things that are straightforward in Jekyll require odd workarounds in Hexo or Hugo. GitHub support isn't the worst to have either, and we can trust what we invest in Jekyll today, will be relevant for the next two years. The other generators beat Jekyll handsdown however, when it comes to file watching, asset building, speed, browser integration, ease of install. Lanyon aims to compensate for all of Jekyll's shortcomings by:

- Using browsersync with Webpack middleware featuring HMR, for instant (page-reload-free) assets refreshing. This also gives us up to date SASS
- Take a sledge hammer :hammer: approach at getting a suitable Ruby to work on your system, traversing system, docker, rbenv, rvm, brew, taking the first thing that can get us a working Ruby 2 install, installing all other dependencies locally
- Using Nodemon for md/html file-watching

Lanyon is geared towards devleoper convenience and as a bonus offers/willoffer:

- Deploys to GitHub Pages (from Travis or your workstation, we are not compatible with as-is `gh-pages` branch-filling and have no desire to support that)
- Markdown linting
- Spell checking

Lanyon is/willbe used by [Transloadit](https://transloadit.com) for static sites, and is geared towards their use-case. Trying to get so many moving parts to behave comes with challenges and a ton of configuration options. This project won't support all the things that its underlying components support, and prefers convention over configuration.

We'll focus on:

- SASS
- ES6
- Assets in `./assets/`, with transpiled assets in `./assets/build`
- Assuming `app.js` is the primary entry point
- Developers who already have a working Node.js setup and are comfortable with that, and don't mind a `package.json` in their project

If you're thinking about submitting PRs for other features/flexibility, get in touch first please as we might not be on board.

If you however, are onboard with what we're setting out to do, here's how you get started with Lanyon:

## Install

```bash
npm install --save lanyon
```

## Use

The recommended way to use Lanyon is to add it to your project's npm run scripts, in your `package.json`, add:

```javascript
...
  "scripts": {
    "build": "lanyon build",
    "build:production": "LANYON_ENV=production lanyon build",
    "preview:production": "lanyon build:production && LANYON_ENV=production lanyon serve",
    "serve": "lanyon serve",
    "start": "lanyon start"
  },
...
```

Afterwards, type `npm start`. This will kick a build, spin up file watching and a browser with HMR asset reloading enabled. For more inspiration check out the `example` folder in the Lanyon repository.

## About Ruby

It's definitely a paintpoint, so far 10/10 devs that we've tried to get Jekyll working locally had _some_ problem with their Ruby install and its dependencies. Lanyon tries its best at resolving this. We're testing for many different Operating System versions, as well as versions of Node, and Ruby version managers, to see if we can still automatically get Ruby to work on them:

![screen shot 2016-11-25 at 19 52 51](https://cloud.githubusercontent.com/assets/26752/20633602/eca2abe0-b348-11e6-8e77-285f8de73f3c.png)

![screen shot 2016-11-25 at 21 17 39](https://cloud.githubusercontent.com/assets/26752/20634771/9e163fb2-b354-11e6-914c-ac8e54ab68e1.png)

### Flow

Lanyon tries to utilize one of following components to acquire a working Ruby 2+ install:

1. (Just use the `system`'s) Ruby
1. [`docker`](https://www.docker.com/)
1. [`rbenv`](https://github.com/rbenv/rbenv) (with the [ruby-build](https://github.com/rbenv/ruby-build) plugin)
1. [`rvm`](https://rvm.io/)

You can disable any of these via e.g. `LANYON_SKIP="rbenv docker"`.

To force a particular type, you can also use `LANYON_ONLY=docker`. This is how we isolate methods of installment on Travis for testing as well.

## Prerequisites

- Node.js 0.12+ (& npm)
- OSX / Linux (& Bash)

### macOS

Lanyon tries its best to leave your current Ruby setup alone and do as much local as possible,
but that's hard, and there always is a risk of breaking ruby installs with automation.

The recommended way therefore to run Lanyon is have a recent version of Docker first:

On Mac:

Uninstall old Docker residu:

```bash
brew uninstall --force docker-machine boot2docker docker
```

Follow **Docker for Mac** instructions on <https://docs.docker.com/docker-for-mac/> and verify it worked:

```bash
docker --version && docker ps
```

### Ubuntu Trusty

To install the Node.js dependency on Ubuntu Trusty, either use a new release from nodesource:

```bash
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Or run an old node, straight from the main repo. Lanyon (still) supports 0.12.

```bash
sudo apt-get install nodejs-legacy npm
```
