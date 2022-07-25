module.exports = {
  extends: [
    'transloadit',
  ],
  env: {
    es6 : true,
    jest: true,
    node: true,
  },
  parserOptions: {
    requireConfigFile: false,
  },
  rules: {
    // useless rules for this project
    /// /////////////////////////////////////////////////////////
    'no-console'                       : ['off'],
    // rules we had to turn off just to get a pass, but we'd
    // like to turn on one by one with separate PRs
    /// /////////////////////////////////////////////////////////
    'consistent-return'                : ['warn'],
    'global-require'                   : ['warn'],
    'guard-for-in'                     : ['warn'],
    'import/no-dynamic-require'        : ['warn'],
    'import/order'                     : ['warn'],
    'import/extensions'                : ['warn'],
    'no-param-reassign'                : ['warn'],
    'no-restricted-syntax'             : ['warn'],
    'no-shadow'                        : ['warn'],
    'no-unused-expressions'            : ['warn'],
    'no-use-before-define'             : ['warn'],
    'import/no-named-as-default-member': ['warn'],
  },
  overrides: [
    {
      files: [
        'website/**/*.js',
      ],
      env: {
        browser: true,
      },
      rules: {
        'no-var': ['off'],
      },
    },
  ],
}
