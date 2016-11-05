var shell = require('shelljs')
var projectDir = process.env.PROJECT_DIR || __dirname + '/../..'

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
shell.cd(projectDir)
if (shell.exec(__dirname + '/deps/bin/bundle install --path ' + __dirname + '/deps/gems || bundle update').code !== 0) {
  shell.exit(1)
}
