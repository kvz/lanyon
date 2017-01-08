const logUpdate   = require('log-update')
const cliSpinner  = require('cli-spinners').dots10
const logSymbols  = require('log-symbols')
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
    this._opts = null
    this._cmd  = null

    this._pid      = null
    this._error    = null
    this._status   = null
    this._stdout   = null
    this._stderr   = null
    this._timer    = null
    this._lastLine = ''
    this._buffers  = {
      stdout: '',
      stderr: '',
    }
  }

  _return (cb) {
    if (cb) {
      if (this._opts.tmpFiles.stdout) {
        this._stdout = fs.readFileSync(this._opts.tmpFiles.stdout, 'utf-8')
      }
      if (this._opts.tmpFiles.stderr) {
        this._stderr = fs.readFileSync(this._opts.tmpFiles.stderr, 'utf-8')
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

    this._emptyBuffer('stdout', true)
    this._emptyBuffer('stderr', true)
    this._stopAnimation()

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

    if (type === 'stdout') {
      this._buffers.stdout += data
      if (this._opts.tmpFiles.stdout) {
        fs.appendFileSync(this._opts.tmpFiles.stdout, data, 'utf-8')
      }
      this._emptyBuffer(type)
    }

    if (type === 'stderr') {
      this._buffers.stderr += data
      if (this._opts.tmpFiles.stderr) {
        fs.appendFileSync(this._opts.tmpFiles.stderr, data, 'utf-8')
      }
      this._emptyBuffer(type)
    }
  }

  _emptyBuffer (type, flush = false) {
    let pos = -1
    while ((pos = this._buffers[type].indexOf('\n')) > -1) {
      let line = this._buffers[type].substr(0, pos + 1)
      this._linefeed(type, line)
      this._buffers[type] = this._buffers[type].substr(pos + 1, this._buffers[type].length - 1)
    }

    if (flush) {
      this._linefeed(type, this._buffers[type], flush)
      this._buffers[type] = ''
    }
  }

  _startAnimation () {
    let i      = 0
    let frames = cliSpinner.frames
    let that   = this
    this._timer = setInterval(() => {
      let frame = frames[i++ % frames.length]
      this._drawAnimation.bind(that)(frame)
    }, cliSpinner.interval)
  }

  _drawAnimation (frame, flush = false) {
    if (!frame) {
      frame = cliSpinner.frames[0]
    }
    let line = this._prefix() + frame + ' '

    line += cliTruncate(this._lastLine.trim(), process.stdout.columns - (line.length + (flush ? 2 : 0)))

    if (flush) {
      if (this._status === 0) {
        line += ' ' + logSymbols.success
      } else {
        line += ' ' + logSymbols.error
      }
    }

    logUpdate(line)
  }

  _stopAnimation () {
    clearInterval(this._timer)
    this._timer = null
  }

  _prefix () {
    let buf = ''
    this._opts.components.forEach((component) => {
      buf += `${chalk.dim(component)} \u276f`
    })

    if (buf) {
      buf += ' '
    }

    return buf
  }

  _linefeed (type, line, flush = false) {
    if (line) {
      this._lastLine = line
    }

    if (this._opts.passthru === true) {
      if (this._opts.singlescroll === true) {
        // handled by lastline + animation, unless the command exited before the interval
        this._drawAnimation(undefined, flush)
        return
      }
    }

    if (line) {
      process[type].write(line)
    }
  }

  exe (args, opts, cb) {
    this._startAnimation()
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
      'env'                  : process.env,
      'showCommand'          : showCommand,
      'addCommandAsComponent': false,
      'components'           : [],
      'singlescroll'         : true,
      'announce'             : true,
      'passthru'             : true,
      'tmpFiles'             : {},
      'cwd'                  : process.cwd(),
    })

    if (`${opts.components}` === opts.components) {
      opts.components = opts.components.split('/')
    }

    if (opts.addCommandAsComponent) {
      opts.components.push(opts.showCommand)
    }

    const spawnOpts = {
      env  : opts.env,
      stdio: opts.stdio,
      cwd  : opts.cwd,
    }

    this._cmd  = cmd
    this._opts = opts
    this._cb   = cb

    if (opts.announce === true) {
      this._linefeed('stdout', `Executing: ${this._cmd}`)
    }

    if (cb) {
      const child = spawn(cmd, argus, spawnOpts)
      this._pid = child.pid

      if (this._opts.tmpFiles === false) {
        this._opts.tmpFiles.stdout = false
        this._opts.tmpFiles.stderr = false
      } else {
        if (!this._opts.tmpFiles.stdout && this._opts.tmpFiles.stdout !== false) {
          this._opts.tmpFiles.stdout = `${osTmpdir()}/executive-${opts.showCommand}-stdout-${this._pid}.log`
        }
        if (!this._opts.tmpFiles.stderr && this._opts.tmpFiles.stderr !== false) {
          this._opts.tmpFiles.stderr = `${osTmpdir()}/executive-${opts.showCommand}-stderr-${this._pid}.log`
        }
      }

      if (this._opts.tmpFiles.stdout) {
        fs.writeFileSync(this._opts.tmpFiles.stdout, '', 'utf-8')
      }
      if (this._opts.tmpFiles.stderr) {
        fs.writeFileSync(this._opts.tmpFiles.stderr, '', 'utf-8')
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
