var shell = require('shelljs')
var semver = require('semver')


var rubyPath = shell.which('ruby')
var rubyVersion = exec(rubyPath + '-v').stdout
var rvmPath = shell.which('rvm')

console.log('Installing ruby...')
if (!rubyPath || !semver.satisfies(rubyVersion, '>=2')) {
  if (!rvmPath) {
    if (shell.test('-f', '/etc/apt/sources.list').code !== 0) {
      if (shell.exec('gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3 ').code !== 0) {
        shell.exit(1)
      }
    }
    if (shell.exec('curl -sSL https://get.rvm.io | bash -s stable').code !== 0) {
      shell.exit(1)
    }
  }
  if (shell.exec('type rvm | head -n 1 && rvm install 2.1.1 && rvm use 2.1.1 && ruby -v').code !== 0) {
    shell.exit(1)
  }
}

console.log('Installing bundler...')
if (!shell.test('-f', __dirname + '/deps/bin/bundle')) {
  shell.mkdir('-p', __dirname + '/deps/bin')
  if (shell.exec('gem install bundler -v 1.13.0 -n ' + __dirname + '/deps/bin').code !== 0) {
    shell.exit(1)
  }
}

console.log('Configuring bundler...')
if (shell.exec(__dirname + '/deps/bin/bundle config build.nokogiri --use-system-libraries').code !== 0) {
  shell.exit(1)
}

console.log('Installing gems...')
if (shell.exec(__dirname + '/deps/bin/bundle install --path ' + __dirname + '/deps/gems || bundle update').code !== 0) {
  shell.exit(1)
}
