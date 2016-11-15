[![Build Status](https://travis-ci.org/kvz/lanyon.svg?branch=master)](https://travis-ci.org/kvz/lanyon)

# lanyon
dr. Jekyll has turned into mr. Hyde. Lanyon to the rescue!

> He wrote to Lanyon (in Dr. Jekyll's hand), asking his friend to retrieve the contents of a cabinet in his laboratory and to meet him at midnight at Hastie Lanyon's home in Cavendish Square. In Lanyon's presence, Mr. Hyde mixed the potion and transformed back to Dr. Jekyll. The shock of the sight instigated Lanyon's deterioration and death.

In my opinion Jekyll is the #1 static site generator, for content. Things that are straightforward in Jekyll require odd layout hacks in Hexo, or are just not possible in Hugo. Metalsmith's 'everything is a plugin' certainly has its advantages, but it means you have to figure out how to string things together and there's little in the way of conventions, which ironically limits easy re-usability. The Jekyll ecosystem is massive, and GitHub (pages) support is a nice extra.

But there's a problem. Ruby isn't the fasted kid on the block, and its asset builders are runnign behind. We used to have an okay jekyll-assets plugin, but it was replaced with a completely new project, basically throwing away 500% of its features. It also means troubleshooting on google gives you outdated solutions. The Sass Gem is behind on LibSass. It's quite slow. I'm sure it's me but file watching using Ruby was either broken for me or somehow relying on V8 which took forever to build only to error out. If many stackoverflows later I did got it to work, it often crashed or did not notice filechanges. It was like this for over a year until I decided: no more.

When these problems are resolved, Lanyon hopes to deteriorate and die, just as in Robert Louis Stevenson's novella. Until that time, we aim to work around "Ruby's" ever-broken file-watching and asset-building by leveraging the Node.js ecosystem for that. 

By leveraging the Node.js ecosystem we might as well throw in a few extras such as:

- markdown linting
- spell checking
- browsersync for automatic browser refreshes on-change


## Prerequisistes

Node.js & npm

## OSX Docker:

```bash
brew uninstall --force docker-machine boot2docker docker
```

Follow **Docker for Mac** instructions on <https://docs.docker.com/docker-for-mac/>.
Verify it worked:

```bash
docker --version && docker ps
```

```bash
# -v "$PWD":/usr/src/app \
# -v $HOME/code/content:/srv/jekyll \
docker run \
  -v $PWD:/srv/jekyll \
  -p "5000:4000" jekyll/jekyll \
```

### Ubuntu Trusty

```bash
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs

# or

sudo apt-get install nodejs-legacy npm
```

## Dev

If you used `npm link`, lanyon won't be able to find your project's root by upwards traversing directories, so
run like so:

```bash
PROJECT_DIR=$(pwd) npm explore lanyon -- npm run build
```

## Requirements

- Node.js
- Ruby 2.0+
