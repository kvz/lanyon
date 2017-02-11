// To allow tests to pass on older platforms: https://travis-ci.org/kvz/lanyon/jobs/200631620#L1079
// require('babel-register')({
//   // This will override `node_modules` ignoring - you can alternatively pass
//   // an array of strings to be explicitly matched or a regex / glob
//   ignore: false,
// })

const utils         = require('./utils')
// const debug      = require('depurar')('sut')
const sut           = utils
const cacheDir      = 'CACHEDIR'
const projectDir    = 'PROJECTDIR'
const lanyonVersion = 'LANYONVERSION'

describe('utils', () => {
  describe('dockerCmd', () => {
    it('should add custom flags', () => {
      const res = sut.dockerCmd({cacheDir, projectDir, lanyonVersion}, 'CMD', 'FLAGS')
      expect(res).toMatchSnapshot()
    })
  })
})
