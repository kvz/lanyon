const utils   = require('./utils')
const oneLine = require('common-tags/lib/oneLine')

describe('utils', () => {
  test('dockerString', () => {
    const p = {
      runtime: {
        contentBuildDir: '/Users/kvz/code/project/_site',
        cacheDir       : '/Users/kvz/code/project/.lanyon',
        projectDir     : '/Users/kvz/code/project',
        dockerImage    : 'kevinvz/lanyon:v1.0.109',
        lanyonEnv      : 'production',
      },
    }
    const res = utils.dockerString('ls', p)
    expect(res).toMatch(new RegExp(oneLine`
      ^docker run
      --rm
      --interactive
      --env "JEKYLL_UID=\\d+"
      --env "JEKYLL_ENV=production"
      --workdir /Users/kvz/code/project/.lanyon
      --volume /Users/kvz/code/project:/Users/kvz/code/project kevinvz/lanyon:v1.0.109 ls$
    `))
  })
})
