require('./javascripts/app.js')
require('./stylesheets/app.scss')

// check if HMR is enabled
if (module.hot) {
  module.hot.accept('./javascripts/app.js', function () {
    require('./javascripts/app.js')
  })
  module.hot.accept('./stylesheets/app.scss', function () {
    require('./stylesheets/app.scss')
  })
}
