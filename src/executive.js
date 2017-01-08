const logUpdate   = require('log-update')
const logSymbols  = require('log-symbols')
const cliCursor   = require('cli-cursor')
const cliSpinner  = require('cli-spinner')
const cliTruncate = require('cli-truncate')
const chalk       = require('chalk')
const spawnSync   = require('spawn-sync')
const osTmpdir    = require('os-tmpdir')
const debug       = require('depurar')('lanyon')
const fs          = require('fs')
const spawn       = require('child_process').spawn
const _           = require('lodash')

class Executive {
  constructor () {
    this._opts          = null
    this._cmd           = null

    this._pid           = null
    this._error         = null
    this._status        = null
    this._stdout        = null
    this._stderr        = null
  }

  _return (cb) {
    if (cb) {
      if (this._opts.tmpFileStdout) {
        this._stdout = fs.readFileSync(this._opts.tmpFileStdout, 'utf-8')
      }
      if (this._opts.tmpFileStderr) {
        this._stderr = fs.readFileSync(this._opts.tmpFileStderr, 'utf-8')
      }
    }

    let err
    if (this._error || this._status !== 0) {
      let msgs = [ `Error while executing "${this._cmd}"` ]
      if (this._error) {
        msgs.push(this._error)
      }
      if (this._stderr) {
        msgs.push(this._stderr)
      }
      err = new Error(msgs.join('. '))
    }

    if (cb) {
      return cb(err, this._stdout.trim())
    } else {
      if (err) {
        throw new Error(err)
      }
      return this._stdout.trim()
    }
  }

  _out (type, data) {
    if (!data) {
      return
    }

    if (type === 'stdout' && this._opts.tmpFileStdout) {
      fs.appendFileSync(this._opts.tmpFileStdout, data, 'utf-8')
    }
    if (type === 'stderr' && this._opts.tmpFileStderr) {
      fs.appendFileSync(this._opts.tmpFileStderr, data, 'utf-8')
    }

    if (this._opts.passthru === true) {
      if (this._opts.singlescroll === true) {
        logUpdate(data)
      } else {
        process.stdout.write(data)
      }
    }
  }

  exe (args, opts, cb) {
    let cmd         = ''
    let showCommand = ''
    let argus       = args

    if (`${args}` === args) {
      cmd         = 'sh'
      showCommand = argus.split(/\s+/)[0]
      argus       = ['-c'].concat(argus)
    } else {
      debug(argus)
      cmd         = argus.pop()
      showCommand = cmd
    }

    opts = _.defaults(opts, {
      'env'         : process.env,
      'showCommand' : showCommand,
      'singlescroll': true,
      'passthru'    : true,
      'cwd'         : process.cwd(),
    })

    const spawnOpts = {
      env  : opts.env,
      stdio: opts.stdio,
      cwd  : opts.cwd,
    }

    this._cmd  = cmd
    this._opts = opts
    this._cb   = cb

    if (cb) {
      const child = spawn(cmd, argus, spawnOpts)
      this._pid = child.pid

      if (!this._opts.tmpFileStdout && this._opts.tmpFileStdout !== false) {
        this._opts.tmpFileStdout = `${osTmpdir()}/executive-${opts.showCommand}-stdout-${this._pid}.log`
      }
      if (!this._opts.tmpFileStderr && this._opts.tmpFileStderr !== false) {
        this._opts.tmpFileStderr = `${osTmpdir()}/executive-${opts.showCommand}-stderr-${this._pid}.log`
      }

      if (this._opts.tmpFileStdout) {
        fs.writeFileSync(this._opts.tmpFileStdout, '', 'utf-8')
      }
      if (this._opts.tmpFileStderr) {
        fs.writeFileSync(this._opts.tmpFileStderr, '', 'utf-8')
      }

      if (child.stdout) {
        child.stdout.on('data', this._out.bind(this, 'stdout'))
      }
      if (child.stderr) {
        child.stderr.on('data', this._out.bind(this, 'stderr'))
      }

      child.on('close', (status) => {
        this._status = status
        return this._return(cb)
      })
    } else {
      const child = spawnSync(cmd, argus, spawnOpts)
      this._pid    = child.pid
      this._error  = child.error
      this._signal = child.signal
      this._status = child.status
      this._stderr = child.stderr + ''
      this._stdout = child.stdout + ''

      return this._return()
    }
  }
}

module.exports = (args, opts, cb) => {
  const exec = new Executive()
  return exec.exe(args, opts, cb)
}
