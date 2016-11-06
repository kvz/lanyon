var shell = require('shelljs')
var semver = require('semver')
var chalk = require('chalk')
var path = require('path')
var yes = chalk.green('✓ ')
var no = chalk.red('✗ ')


function fatalExe (cmd) {
  var opts = { 'silent': true }
  var p = shell.exec(cmd, opts)

  if (p.code !== 0) {
    console.log(no)
    console.error(p.stdout)
    console.error(p.stderr)
    shell.exit(1)
  }

  return p.stdout.trim()
}

var desiredRuby = '2.1.1'
var satisfactoryRuby = '>=2'
var desiredBundler = '1.13.0'
var satisfactoryBundler = '>=1'

var rubyPath = shell.which('ruby')
var rubyVersionFull = fatalExe(rubyPath + ' -v')
var rubyVersion = rubyVersionFull.split(/[p\s]+/)[1]
var rvmPath = shell.which('rvm')

var bundlerPath = __dirname + '/deps/bin/bundler'
var bundlerVersionFull = fatalExe(bundlerPath + ' -v')
var bundlerVersion = bundlerVersionFull.split(/\s+/).pop()
var bundlerDir = path.dirname(bundlerPath)


process.stdout.write('--> Checking Ruby ' + satisfactoryRuby + ' ... ');
if (semver.satisfies(rubyVersion, satisfactoryRuby)) {
  console.log(yes + rubyVersion + ' (' + rubyVersionFull + ')')
} else {
  console.log(no + rubyVersion + ' (' + rubyVersionFull + ')')
  if (!rvmPath) {
    if (shell.test('-f', '/etc/apt/sources.list').code === 0) {
      fatalExe('gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3')
    }
    fatalExe('curl -sSL https://get.rvm.io | bash -s stable')
  }
  fatalExe('type rvm | head -n 1 && rvm install ' + desiredRuby + ' && rvm use ' + satisfactoryRuby + ' && ruby -v')
}

process.stdout.write('--> Checking Bundler ' + satisfactoryBundler + ' ... ');
if (semver.satisfies(bundlerVersion, satisfactoryBundler)) {
  console.log(yes + bundlerVersion + ' (' + bundlerVersionFull + ')')
} else {
  console.log(no + bundlerVersion + ' (' + bundlerVersionFull + ')')
  shell.mkdir('-p', bundlerDir)
  fatalExe('gem install bundler -v ' + desiredBundler + ' -n ' + bundlerDir)
}

process.stdout.write('--> Configuring Bundler ... ')
fatalExe(bundlerPath + ' config build.nokogiri --use-system-libraries')
console.log(yes)

process.stdout.write('--> Installing Gems ... ')
fatalExe(bundlerPath + ' install --path ' + __dirname + '/deps/gems || ' + bundlerPath + ' update')
console.log(yes)
