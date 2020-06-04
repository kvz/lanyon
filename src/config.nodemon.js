module.exports = function ({ runtime, jekyll }) {
  const nodemonCfg = {
    onChangeOnly: false,
    verbose     : process.env.LANYON_DEBUG === '1',
    delay       : 600,
    watch       : runtime.contentScandir,
    ignore      : [
      '**/_site/**',
      '**/.env.*.sh',
      '**/.env.sh',
      '**/.lanyon/**',
      '**/assets/**',
      '**/env.*.sh',
      '**/env.sh',
      '**/node_modules/**',
      '**/vendor/**',
    ].concat((jekyll.exclude || []).map(i => `**/${i}`)),
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
