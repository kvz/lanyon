[![Build Status](https://travis-ci.org/kvz/lanyon.svg?branch=master)](https://travis-ci.org/kvz/lanyon)

# lanyon
dr. Jekyll has turned into mr. Hyde. Lanyon to the rescue!

> He wrote to Lanyon (in Dr. Jekyll's hand), asking his friend to retrieve the contents of a cabinet in his laboratory and to meet him at midnight at Hastie Lanyon's home in Cavendish Square. In Lanyon's presence, Mr. Hyde mixed the potion and transformed back to Dr. Jekyll. The shock of the sight instigated Lanyon's deterioration and death.

In my opinion Jekyll is the #1 static site generator, for content. Things that are straightforward in Jekyll require odd layout hacks in Hexo, or are just not possible in Hugo. Metalsmith's 'everything is a plugin' certainly has its advantages, but it means you have to figure out how to string things together and there's little in the way of conventions, which ironically limits easy re-usability. The Jekyll ecosystem is massive, and GitHub (pages) support is a nice extra.

But there's a problem. Ruby isn't the fasted kid on the block, and its asset builders are runnign behind. We used to have an okay jekyll-assets plugin, but it was replaced with a completely new project, basically throwing away 500% of its features. It also means troubleshooting on google gives you outdated solutions. The Sass Gem is behind on LibSass. It's quite slow. I'm sure it's me but file watching using Ruby was either broken for me or somehow relying on V8 which took forever to build only to error out. If many stackoverflows later I did got it to work, it often crashed or did not notice filechanges. It was like this for over a year until I decided: no more.

When these problems are resolved, Lanyon hopes to deteriorate and die, just as in Robert Louis Stevenson's novella. Until that time, we aim to work around "Ruby's" ever-broken file-watching and asset-building by leveraging the Node.js ecosystem for that. 

## Features

Besides trying to install Ruby, bundler, and the appropriate gems locally, Lanyon offers 
many features in a highly opinionated way. Lanyon was aimed primarily at solving Ruby headaches and delivering:

- Jekyll content building

By leveraging the Node.js ecosystem we might as well throw in a few extras such as:

- Webpack asset building (from `assets/app.js` -> `assets/build/app.js`)
- Markdown linting
- Spell checking
- Browser-sync for automatic browser refreshes on-change

## Flow

Lanyon tries to utilize one of following components to acquire a working Ruby 2+ install:

1. (Just use the `system`'s) Ruby
1. [`docker`](https://www.docker.com/)
1. [`rbenv`](https://github.com/rbenv/rbenv) (with the [ruby-build](https://github.com/rbenv/ruby-build) plugin)
1. [`rvm`](https://rvm.io/)

You can disable any of these via e.g. `LANYON_SKIP="rbenv docker"`.
To disable using the system's available Ruby use `LANYON_SKIP="system"`, this is useful
mainly for testing purposes as this will force an install of some kind.

## Prerequisites

- Node.js 0.12+ (& npm)
- OSX / Linux (& Bash)

### OSX Docker:

Lanyon tries it's best to leave your current Ruby setup alone and do as much local as possible,
but that's hard, and there always is a risk of breaking ruby installs with automation.

The recommended way therefore to run Lanyon is have a recent version of Docker around:

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

## Dev

If you used `npm link` for quick dev iterations, Lanyon won't be able to find your project's root by upwards traversing directories, so run it like so:

```bash
LANYON_PROJECT=$(pwd) npm explore lanyon -- npm run build
```
