'use strict';

var executive = require('./executive');

// var debug = require('depurar')('lanyon')

// const out = executive(`cat ${__dirname}/../CHANGELOG.md`, { singlescroll: true })
// console.log(out)

executive('cat ' + __dirname + '/../CHANGELOG.md && echo done', { singlescroll: true }, function (err, out2) {
  if (err) {
    throw new Error(err);
  }
  // console.log(out2)
});
;

var _temp = function () {
  if (typeof __REACT_HOT_LOADER__ === 'undefined') {
    return;
  }
}();

;