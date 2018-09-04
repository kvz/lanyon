const utils = require('./utils')
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
    expect(utils.dockerString('ls', p)).toMatchSnapshot()
  })
})
