module.exports = function ({runtime, jekyll}) {
  let nodemonCfg = {
    onChangeOnly: true,
    verbose     : true,
    delay       : 600,
    watch       : runtime.contentScandir,
    ignore      : [
      '_site/**',
      '.env.*.sh',
      '.env.sh',
      '.lanyon/**',
      'assets/**',
      'env.*.sh',
      'env.sh',
      'node_modules/**',
      'vendor/**',
    ].concat(jekyll.exclude),
    ext: [
      'htm',
      'html',
      'jpg',
      'json',
      'md',
      'png',
      'sh',
      'yml',
    ].join(','),
  }

  return nodemonCfg
}
