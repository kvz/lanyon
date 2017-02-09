# Contributing

Any fixes are always very much appreciated. If you are thinking about adding features, however, please get in contact first, because our aims are quite narrow when it comes to what we would like Lanyon to support.

For local development, it is great to have an example project in which you can use Lanyon. In this example, we'll use the [tus.io](http://tus.io) website, which is open source and already happens to use Lanyon. We will assume that you have the example project living in `~/code/tus.io`, you have `git pull`-ed, and `npm install`-ed. First, see if the version bundled with tus.io works, by trying `npm start`. All good? Great!

Now, clone the Lanyon repo to `~/code/lanyon`, there, type `npm install` and `npm link`. After that, go back to `~/code/tus.io`. In that dir, type: `npm link lanyon`. This hot-wires your locally checked out Lanyon source into the tus.io dir as a dependency. Any changes you make to lanyon will be reflected immediately in your example project (tus.io in this case).

To re-trigger the Lanyon install hook, type: `./node_modules/.bin/lanyon install` from `~/code/tus.io`. You can run this as many times as you want until it happily installs Ruby and the other stuff. tus.io already has npm scripts, so you can also type `npm start` to give your own local Lanyon building a try. If your example project does not have npm scripts, use `./node_modules/.bin/lanyon start` instead.

We are eager to hear whatever fixes you have in mind, and looking forward to working together on Lanyon and making it the best it can be!
