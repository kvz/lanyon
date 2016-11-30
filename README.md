[![Build Status](https://travis-ci.org/kvz/lanyon.svg?branch=master)](https://travis-ci.org/kvz/lanyon)

Lanyon is a static site generator. It is a wrapper around Jekyll, Webpack, BrowserSync, Nodemon, in an attempt to give you the best of all worlds :earth_asia: :earth_americas: :earth_africa: (Instant asset building & refreshing, fast & reliable file watching). 
Spitting in the face of unix philosophy, it tries to do many things, such as spell checking, and setting up a working Ruby environment. OTH, One might argue it's applying unix philosophy by making underlying tools do one thing only :thinking:

Whichever the case, Lanyon is certainly okay with embracing/sacrificing whichever philosophy so long as it amounts to THE highest level of convenience around building static websites. Getting started should be as simple as `npm install lanyon` and `lanyon start`.

## State

Lanyon is currently pre-alpha. We're still doing many changes and as per SemVer are allowing ourselves to make breaking ones in `<1`. We do not recommend using it for anything serious yet.

## Background

Jekyll is great for documentation and static websites sites, the ecosystem is vast and mature, things that are straightforward in Jekyll require odd workarounds in Hexo or Hugo. GitHub backing isn't the worst to have either, and we can assume that what we invest in Jekyll today, will still be relevant for a few more years. 

Admittedly the other generators are very appealing and humiliate Jekyll when it comes to file watching, asset building, speed, browser integration, ease of install. Here is a highly opinionated overview:


| Quality                                                             |        Hugo        |        Hexo        |             Jekyll              |       Lanyon       |  Webpack/BrowserSync/Nodemon   |
|:--------------------------------------------------------------------|:------------------:|:------------------:|:-------------------------------:|:------------------:|:------------------------------:|
| Easy to maintain many documents                                     | :white_check_mark: |                    | :white_check_mark::arrow_right: | :white_check_mark: |                                |
| Great templating engine                                             |                    |                    | :white_check_mark::arrow_right: | :white_check_mark: |                                |
| Vast & mature ecosystem                                             |                    |                    | :white_check_mark::arrow_right: | :white_check_mark: | :arrow_left::white_check_mark: |
| Easy to get help                                                    | :white_check_mark: |                    | :white_check_mark::arrow_right: | :white_check_mark: | :arrow_left::white_check_mark: |
| Backed by GitHub                                                    |                    |                    | :white_check_mark::arrow_right: | :white_check_mark: |                                |
| Easy to install                                                     | :white_check_mark: | :white_check_mark: |                                 | :white_check_mark: | :arrow_left::white_check_mark: |
| Browser integration for content reloads                             |                    |                    |                                 | :white_check_mark: | :arrow_left::white_check_mark: |
| Fast asset building                                                 |                    | :white_check_mark: |                                 | :white_check_mark: | :arrow_left::white_check_mark: |
| Fast and robust filewatching                                        |                    |                    |                                 | :white_check_mark: | :arrow_left::white_check_mark: |
| HMR (Hot module reloading) / immediate in-browser asset refreshment |                    |                    |                                 | :white_check_mark: | :arrow_left::white_check_mark: |

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
- Node modules in `./node_modules/`, Bower components in `./assets/bower_components` (if any)
- `app.js` is the primary entry point
- Our users already have a working Node.js setup and don't mind a `package.json` in their project
- GitHub pages for deploys (with Travis CI as a builder)
- Any environment other than `development` means `production`. This is to simplify, and if you have additional stages like 'test', you'll likely want to test as close to production as possible anyway.

If you're thinking about submitting PRs for other features/flexibility, get in touch first please as we might not be on board.

If however, there happens to be an overlap with your use case and you can live with our constraints, here's how you get started with Lanyon:

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

Have an `assets/app.js` in which you require both javascripts and stylesheets:

```javascript
require('js/main.js')
require('sass/main.scss')
```

in your layout, include the build (same location works both for production artifact files, as well as magic Hot Module Reloading):

```html
<!-- head -->
<link rel="stylesheet" href="{{site.baseurl}}/assets/build/app.css">
<!-- footer -->
<script src="{{ site.baseurl }}/assets/build/app.js"></script>
```

Afterwards, type `npm start`. This will kick a build, spin up file watching and a browser with HMR asset reloading enabled. For more inspiration check out the [`example`](./example) folder in the Lanyon repository.

## Deploy

Enable building this project on Travis CI. Add a `.travis.yml` similar to this one:

```yaml
language: generic
sudo: false
script: true # <-- @todo we can test here
deploy:
  skip_cleanup: true
  provider: script
  script: .lanyon/bin/deploy # <-- this calls 'npm run build:production && npm run deploy'. Travis does not allow commands, only files here..
  on:
    branch: master
    condition: $TRAVIS_OS_NAME = linux
```

Add an `env.sh` with the following contents:

```bash
export GHPAGES_URL="https://<your github token>@github.com/<your github org>/<your github repo>.git"
export GHPAGES_BOTNAME="<your github token username>"
export GHPAGES_BOTEMAIL="<your github token email>"
```

Type `git ignore env.sh`. You can now type `source env.sh` and use `npm run encrypt` to save these secrets on Travis CI.

The GitHub token can be acquired by (creating a dedicated GitHub bot user and giving it access to your repo, logging in as it and) going to [Personal access tokens](https://github.com/settings/tokens). Click Generate new token, name it `Github pages deploy`, click `repo`, and hit Generate.

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

- OSX / Linux (& Bash)
- Node.js 0.12+ (& npm)
- Docker or Rvm or Rbenv or Brew

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

Lanyon requires Node.js to be present on your system (although we may consider shipping all of Lanyon inside a Docker container in a future version - currently it's just the Ruby stuff). On older Ubuntu versions, that can 
still be a bit of a hassle. Here are two different ways of installing Node.js on Ubuntu Trusty:

#### Node 6

To install the Node.js dependency on Ubuntu Trusty, either use a new release from NodeSource:

```bash
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
```

#### Or: Node 0.12

Lanyon (still) supports 0.12, so you might prefer a legacy Node.js version so you don't have to add a 3rd party repository:

```bash
sudo apt-get install nodejs-legacy npm
node -v
```
