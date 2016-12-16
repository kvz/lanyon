<!--more-->

# Frequently Asked Questions

## Why Ruby? Can't you just not use it?

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


## Can I Require Legacy JavaScript?

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
