module.exports = function ({runtime}) {
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
    ].concat(runtime.contentIgnore),
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
