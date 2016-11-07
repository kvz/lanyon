var shell = require('shelljs')
var projectDir = process.env.PROJECT_DIR || __dirname + '/../..'
var rubyExe = fs.readFileSync(__dirname + '/deps/rubyExe', 'utf-8').trim()

var cmd = [
  rubyExe, ' ',
  __dirname, '/deps/bin/bundler exec jekyll build',
  ' --source ', projectDir,
  ' --config ', projectDir, '/_config.yml',
  ' --destination ', projectDir, '/_site'
].join('')

console.log('Running: ' + cmd)
if (shell.exec(cmd).code !== 0) {
  shell.exit(1)
}
