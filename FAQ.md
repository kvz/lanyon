This document is best viewed at <http://lanyon.io/faq/>.

<!--more-->

# Frequently Asked Questions

## Why Ruby? Can't you just not use it?

It's definitely a paint-point making us jealous of Hugo (and even Hexo). So far 10/10 devs that we asked to make Jekyll working locally had _some_ problem with their Ruby install and its dependencies. The number of nokogiri or permission errors, version conflicts, etc, we've had to deal with, are just, sad. Lanyon tries its best at resolving this. We're testing for many different Operating Systems and versions, as well as different versions of Node, and Ruby version managers, to see if we can still automatically get Ruby to work on them:

![screen shot 2016-11-25 at 21 17 39](https://cloud.githubusercontent.com/assets/26752/20634771/9e163fb2-b354-11e6-914c-ac8e54ab68e1.png)

## How does Lanyon try to install Ruby?

Lanyon tries to utilize one of following components to acquire a working Ruby 2+ install:

1. (Just use the `system`'s) Ruby
1. [`docker`](https://www.docker.com/)
1. [`rbenv`](https://github.com/rbenv/rbenv) (with the [ruby-build](https://github.com/rbenv/ruby-build) plugin)
1. [`rvm`](https://rvm.io/)

As soon as we have a working Ruby install, we install Bundler & gems locally in your project directory, and Lanyon can start building.

You can disable any of these via e.g. `LANYON_SKIP="rbenv docker"`.

To force a particular type, you can also use `LANYON_ONLY=docker`. This is how we isolate methods of installment on Travis for testing as well.

## Can I Require Legacy JavaScript in my static site?

Yes. While Lanyon uses Webpack under the hood for asset management, and its focus is on modules, you can still work around this due to Webpack's flexibility. If you're dealing with legacy jQuery plugins, you may need to customize loaders. You can do so right in the requires:

```javascript
require('imports?jQuery=jquery,$=jquery,this=>window!../../js/jquery.legacyplugin.js');
```

This will make the `jquery` module available as both `jQuery` and `$`, and make `this` refer to the global `window`, before
requiring `../../js/jquery.legacyplugin.js`.

Furthermore, `js-untouched` is a Lanyon-magic folder name, that does not get processed by the JS/Babel loaders. You can put JS here that you want, well, untouched, like minified files. This folder can reside in any asset sub-dir, such as `./assets/javascripts/js-untouched/`.

## Why does Lanyon not pick up HTML file changes?

Make sure you don't have an old `nodemon` version as a dependency. Npm flat dependencies could will favor local installs and ignore Lanyon's version. Either remove Nodemon from your project or make sure it is at least at a version that recognizes the `--config` flag (e.g. `1.11.0`).

## Why am I seeing Ruby errors about `./vendors`?

If you're seeing things like `Invalid date '0000-00-00': Post '/vendor/bundle/ruby/2.1.0/gems/jekyll-2.4.0/lib/site_template/_posts/0000-00-00-welcome-to-jekyll.markdown.erb'`, you are 
likely upgrading from an existing Jekyll install, and haven't cleared out the `vendor` dir. Lanyon only relies on the `.lanyon` dir
inside your project, ands so you should clean up old Jekyll residue as Lanyon does not have build `exclude`s for those.

Similarly, it's also important to remove the `.bundle` folder from existing Jekyll apps migrating to Lanyon.

## How can I solve nokogiri errors on Ubuntu?

You can force docker via `LANYON_ONLY=docker`, that will take care of any Ruby dependency mess by 
using a Lanyon-maintained Docker container. Short of that, this can go a long way in making sure nokogiri behaves:

```bash
sudo -HE apt-get -y -o "Dpkg::Options::=--force-confdef" -o "Dpkg::Options::=--force-confold" install \
  libxslt-dev \
  libxml2-dev
```

## What are Lanyon's Prerequisites?

Lanyon should -just work- but here are some tips on when it doesn't:

- OSX / Linux (& Bash)
- Node.js 0.12+ (& npm)
- Docker or Rvm or Rbenv or Brew

## How do I walk the Docker route on macOS?

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

**Note** that you can force Lanyon to use Docker with this environment variable:

```bash
export LANYON_ONLY=docker
```

## How do I install Node.js on Ubuntu?

Lanyon requires Node.js to be present on your system (although we may consider shipping all of Lanyon inside a Docker container in a future version - currently it's just the Ruby stuff). On older Ubuntu versions, that can 
still be a bit of a hassle. Here are two different ways of installing Node.js on Ubuntu Trusty:

To install Node.js 6 on Ubuntu Trusty, either use a new release from NodeSource:

```bash
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
```

Or: if you prefer not to have 3rd party sources, Lanyon (still) supports 0.12, so you might prefer a legacy Node.js version instead:

```bash
sudo apt-get install nodejs-legacy npm
node -v
```

## How will I deploy my Lanyon site?

Lanyon assumes automated deployment to GitHub Pages via Travis CI.

Enable building this project on Travis CI by flipping a switch in your account page. 

Add a `.travis.yml` to your project, similar to this one:

    language: node_js
    node_js: 6
    sudo: false
    script: true # <-- @todo you can test here
    deploy:
      skip_cleanup: true
      provider: script
      script: .lanyon/bin/deploy
      on:
        branch: master
        condition: $TRAVIS_OS_NAME = linux

Acquire a GitHub token by (creating a dedicated GitHub bot user and giving it access to your repo, logging in as it and) going to [Personal access tokens](https://github.com/settings/tokens). Click Generate new token, name it `Github pages deploy`, click `repo`, and hit Generate.

Add an `env.sh` to your project that you `git ignore`, and add the following contents:

```bash
export GHPAGES_URL="https://<your github token>@github.com/<your github org>/<your github repo>.git"
export GHPAGES_BOTNAME="<your github token username>"
export GHPAGES_BOTEMAIL="<your github token email>"
```

You can now type `source env.sh` and use `npm run encrypt` to save these secrets on Travis CI.

Now whenever a push to `master` of your project hits GitHub, they'll ping Travis CI to kick a build. Your project will install, hence Lanyon will install. Travis will decrypt the secrets and inject them into the environment. If you didn't fill out any `script` (just `true`), Travis will proceed immediately calling `.lanyon/bin/deploy` which in turn calls `npm run build:production && npm run deploy`. This is done because Travis does not allow commands, only files in that step. Lanyon builds your project, and then uses the secrets to force push to your `GHPAGES_URL`, which includes your repo address as well as your token. Your site is now live and will be refreshed with every push to `master`.

## Wouldn't it be better to just use GitHub pages-rendering?

That's certainly getting better [by the week](https://github.com/blog/2289-publishing-with-github-pages-now-as-easy-as-1-2-3) and we'll keep a close watch on what we can incorporate from their flow, however with local development there's no Webpack/BrowserSync, etc. Without using Travis CI there's little in the way of customization (running your own checkouts / imports / linting and speling checks, etc).
