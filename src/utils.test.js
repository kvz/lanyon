const utils = require('./utils')
const oneLine = require('common-tags/lib/oneLine')
// const debug      = require('depurar')('sut')
// const sut           = utils
// const cacheDir      = 'CACHEDIR'
// const projectDir    = 'PROJECTDIR'
// const lanyonVersion = 'LANYONVERSION'

describe('utils', () => {
  test('dockerString', () => {
    let p = {
      runtime: {
        contentBuildDir: '/Users/kvz/code/project/_site',
        cacheDir       : '/Users/kvz/code/project/.lanyon',
        projectDir     : '/Users/kvz/code/project',
        dockerImage    : 'kevinvz/lanyon:v1.0.109',
        lanyonEnv      : 'production',
      },
    }
    let res = utils.dockerString('ls', p)
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
