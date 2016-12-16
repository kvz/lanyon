# Contributing

Fixes are much appreciated, for adding features, please get in contact first because Lanyon aims to be somewhat narrow in the things
it wants to support.

For local development, it's great to have an example project to use Lanyon in. In this example, we'll use the [tus.io](http://tus.io) website, which is open source and already happens to use Lanyon. We'll assume you'll have the example project living in `~/code/tus.io`, you have `git pull`-ed, and `npm install`-ed. First see if the version bundled with tus.io works, by trying `npm start`. All good? Great.

Clone the Lanyon repo to `~/code/lanyon`, there, type `npm install` and `npm link`. Now go back to `~/code/tus.io`. In that dir, type: `npm link lanyon`. This hot-wires your locally checked out Lanyon source into the tus.io dir as a dependency. Any changes you make to lanyon will be reflected immediately in your example project (tus.io in this case).

To re-trigger the Lanyon postinstall hook, type: `./node_modules/.bin/lanyon postinstall` from `~/code/tus.io`. You can run this as many times as you want until it happily installs Ruby and the other stuff. tus.io already has npm scripts so you can also type `npm start` to try your local Lanyon building. If your example project does not have npm scripts, use `./node_modules/.bin/lanyon start` instead.
