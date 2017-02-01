'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logUpdate = require('log-update');
var cliSpinner = require('cli-spinners').dots10;
var logSymbols = require('log-symbols');
var cliTruncate = require('cli-truncate');
var chalk = require('chalk');
var spawnSync = require('spawn-sync');
var osTmpdir = require('os-tmpdir');
var debug = require('depurar')('lanyon');
var fs = require('fs');
var spawn = require('child_process').spawn;
var _ = require('lodash');

var Executive = function () {
  function Executive() {
    _classCallCheck(this, Executive);

    this._opts = null;
    this._cmd = null;

    this._pid = null;
    this._error = null;
    this._status = null;
    this._stdout = null;
    this._stderr = null;
    this._timer = null;
    this._lastLine = '';
    this._buffers = {
      stdout: '',
      stderr: ''
    };
  }

  Executive.prototype._return = function _return(cb) {
    if (cb) {
      if (this._opts.tmpFiles.stdout) {
        this._stdout = fs.readFileSync(this._opts.tmpFiles.stdout, 'utf-8');
      }
      if (this._opts.tmpFiles.stderr) {
        this._stderr = fs.readFileSync(this._opts.tmpFiles.stderr, 'utf-8');
      }
    }

    var err = void 0;
    if (this._error || this._status !== 0) {
      var msgs = ['Error while executing "' + this._cmd + '"'];
      if (this._error) {
        msgs.push(this._error);
      }
      if (this._stderr) {
        msgs.push(this._stderr);
      }
      err = new Error(msgs.join('. '));
    }

    this._emptyBuffer('stdout', true);
    this._emptyBuffer('stderr', true);
    this._stopAnimation();

    if (cb) {
      return cb(err, this._stdout.trim());
    } else {
      if (err) {
        throw new Error(err);
      }
      return this._stdout.trim();
    }
  };

  Executive.prototype._out = function _out(type, data) {
    if (!data) {
      return;
    }

    if (type === 'stdout') {
      this._buffers.stdout += data;
      if (this._opts.tmpFiles.stdout) {
        fs.appendFileSync(this._opts.tmpFiles.stdout, data, 'utf-8');
      }
      this._emptyBuffer(type);
    }

    if (type === 'stderr') {
      this._buffers.stderr += data;
      if (this._opts.tmpFiles.stderr) {
        fs.appendFileSync(this._opts.tmpFiles.stderr, data, 'utf-8');
      }
      this._emptyBuffer(type);
    }
  };

  Executive.prototype._emptyBuffer = function _emptyBuffer(type) {
    var flush = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    var pos = -1;
    while ((pos = this._buffers[type].indexOf('\n')) > -1) {
      var line = this._buffers[type].substr(0, pos + 1);
      this._linefeed(type, line);
      this._buffers[type] = this._buffers[type].substr(pos + 1, this._buffers[type].length - 1);
    }

    if (flush) {
      this._linefeed(type, this._buffers[type], flush);
      this._buffers[type] = '';
    }
  };

  Executive.prototype._startAnimation = function _startAnimation() {
    var _this = this;

    var i = 0;
    var frames = cliSpinner.frames;
    var that = this;
    this._timer = setInterval(function () {
      var frame = frames[i++ % frames.length];
      _this._drawAnimation.bind(that)(frame);
    }, cliSpinner.interval);
  };

  Executive.prototype._drawAnimation = function _drawAnimation(frame) {
    var flush = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    if (!frame) {
      frame = cliSpinner.frames[0];
    }
    var line = this._prefix() + frame + ' ';

    line += cliTruncate(this._lastLine.trim(), process.stdout.columns - (line.length + (flush ? 2 : 0)));

    if (flush) {
      if (this._status === 0) {
        line += ' ' + logSymbols.success;
      } else {
        line += ' ' + logSymbols.error;
      }
    }

    logUpdate(line);
  };

  Executive.prototype._stopAnimation = function _stopAnimation() {
    clearInterval(this._timer);
    this._timer = null;
  };

  Executive.prototype._prefix = function _prefix() {
    var buf = '';
    this._opts.components.forEach(function (component) {
      buf += chalk.dim(component) + ' \u276F';
    });

    if (buf) {
      buf += ' ';
    }

    return buf;
  };

  Executive.prototype._linefeed = function _linefeed(type, line) {
    var flush = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    if (line) {
      this._lastLine = line;
    }

    if (this._opts.passthru === true) {
      if (this._opts.singlescroll === true) {
        // handled by lastline + animation, unless the command exited before the interval
        this._drawAnimation(undefined, flush);
        return;
      }
    }

    if (line) {
      process[type].write(line);
    }
  };

  Executive.prototype.exe = function exe(args, opts, cb) {
    var _this2 = this;

    this._startAnimation();
    var cmd = '';
    var showCommand = '';
    var argus = args;

    if ('' + args === args) {
      cmd = 'sh';
      showCommand = argus.split(/\s+/)[0];
      argus = ['-c'].concat(argus);
    } else {
      debug(argus);
      cmd = argus.pop();
      showCommand = cmd;
    }

    opts = _.defaults(opts, {
      'env': process.env,
      'showCommand': showCommand,
      'addCommandAsComponent': true,
      'components': [],
      'singlescroll': true,
      'announce': true,
      'passthru': true,
      'tmpFiles': {},
      'cwd': process.cwd()
    });

    if (opts.addCommandAsComponent) {
      opts.components.push(opts.showCommand);
    }

    var spawnOpts = {
      env: opts.env,
      stdio: opts.stdio,
      cwd: opts.cwd
    };

    this._cmd = cmd;
    this._opts = opts;
    this._cb = cb;

    if (opts.announce === true) {
      this._linefeed('stdout', 'Executing: ' + this._cmd);
    }

    if (cb) {
      var child = spawn(cmd, argus, spawnOpts);
      this._pid = child.pid;

      if (this._opts.tmpFiles === false) {
        this._opts.tmpFiles.stdout = false;
        this._opts.tmpFiles.stderr = false;
      } else {
        if (!this._opts.tmpFiles.stdout && this._opts.tmpFiles.stdout !== false) {
          this._opts.tmpFiles.stdout = osTmpdir() + '/scrolex-' + opts.showCommand + '-stdout-' + this._pid + '.log';
        }
        if (!this._opts.tmpFiles.stderr && this._opts.tmpFiles.stderr !== false) {
          this._opts.tmpFiles.stderr = osTmpdir() + '/scrolex-' + opts.showCommand + '-stderr-' + this._pid + '.log';
        }
      }

      if (this._opts.tmpFiles.stdout) {
        fs.writeFileSync(this._opts.tmpFiles.stdout, '', 'utf-8');
      }
      if (this._opts.tmpFiles.stderr) {
        fs.writeFileSync(this._opts.tmpFiles.stderr, '', 'utf-8');
      }

      if (child.stdout) {
        child.stdout.on('data', this._out.bind(this, 'stdout'));
      }
      if (child.stderr) {
        child.stderr.on('data', this._out.bind(this, 'stderr'));
      }

      child.on('close', function (status) {
        _this2._status = status;
        return _this2._return(cb);
      });
    } else {
      var _child = spawnSync(cmd, argus, spawnOpts);
      this._pid = _child.pid;
      this._error = _child.error;
      this._signal = _child.signal;
      this._status = _child.status;
      this._stderr = _child.stderr + '';
      this._stdout = _child.stdout + '';

      return this._return();
    }
  };

  return Executive;
}();

module.exports = function (args, opts, cb) {
  var exec = new Executive();
  return exec.exe(args, opts, cb);
};
;

var _temp = function () {
  if (typeof __REACT_HOT_LOADER__ === 'undefined') {
    return;
  }

  __REACT_HOT_LOADER__.register(cliSpinner, 'cliSpinner', 'src/scrolex.js');

  __REACT_HOT_LOADER__.register(debug, 'debug', 'src/scrolex.js');

  __REACT_HOT_LOADER__.register(spawn, 'spawn', 'src/scrolex.js');

  __REACT_HOT_LOADER__.register(Executive, 'Executive', 'src/scrolex.js');
}();

;