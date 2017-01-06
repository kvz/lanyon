const utils    = require('./utils')
const test     = require('ava')
// const debug = require('depurar')('sut')
const sut      = utils

const cacheDir      = 'CACHEDIR'
const projectDir    = 'PROJECTDIR'
const lanyonVersion = 'LANYONVERSION'

test('dockerCmd', (t) => {
  const res = sut.dockerCmd({cacheDir, projectDir, lanyonVersion}, 'CMD', 'FLAGS')
  t.is(res, 'docker run FLAGS --rm --workdir CACHEDIR --user $(id -u) --volume CACHEDIR:CACHEDIR --volume PROJECTDIR:PROJECTDIR kevinvz/lanyon:LANYONVERSION CMD', 'should return valid dockerCmd')
})

// test.cb('inbox', (t) => {
//   const event   = 'ambient'
//   const bot     = sut._bot
//   const message = { text: 'Hey Botty' }
//   sut.inbox(event, bot, message, (err, response) => {
//     t.ifError(err, 'should respond without error')
//     t.regex(response.text, /Hi mock-friend!/, 'response should match "Hi mock-friend!"')
//     t.end()
//   })
// })
