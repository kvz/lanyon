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
