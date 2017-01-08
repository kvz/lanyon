const executive = require('./executive')

// var debug = require('depurar')('lanyon')

// const out = executive('cat /var/log/install.log', { singlescroll: true })
// console.log(out)
// process.exit()

executive('cat /var/log/install.log', { singlescroll: true }, (err, out2) => {
  if (err) {
    throw new Error(err)
  }
  console.log(out2)
  process.exit()
})
