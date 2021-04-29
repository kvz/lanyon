require('./main.js')
require('./style.css')
require('./syntax.css')

// check if HMR is enabled
if (module.hot) {
  module.hot.accept('./main.js', () => {
    require('./main.js')
  })
  module.hot.accept('./style.css', () => {
    require('./style.css')
  })
}
