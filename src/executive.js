const logUpdate   = require('log-update')
const logSymbols  = require('log-symbols')
const cliCursor   = require('cli-cursor')
const cliSpinner  = require('cli-spinner')
const cliTruncate = require('cli-truncate')
const spawnSync   = require('spawn-sync')
const chalk       = require('chalk')
const _           = require('lodash')

module.exports.executive = (args, opts, cb) => {
  let cmd = ''
  if (_.isArray(cmd)) {
    cmd = args.pop()
  } else {
    cmd = 'sh'
    args.unshift('-c')
  }

  opts = _.defaults(opts, {
    'env'         : process.env,
    'singlescroll': true,
    'stdio'       : 'inherit', // ignore
    'cwd'         : process.cwd(),
  })

  
}
