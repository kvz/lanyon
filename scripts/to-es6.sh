#!/usr/bin/env bash
set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace

if ! type decaffeinate; then
  npm install -g decaffeinate
fi
if ! type lebab; then
  npm install -g lebab
fi

declare -a files=(src/cli.js src/config.js src/deploy.js src/encrypt.js src/postinstall.js src/utils.js)
safe=arrow,for-of,for-each,arg-rest,arg-spread,obj-method,obj-shorthand,no-strict,multi-var # ,commonjs,exponent
unsafe=let,class,template,default-param,destruct-param #,includes

for file in "${files[@]}"; do
  # decaffeinate --keep-commonjs --prefer-const --loose-default-params ${file}
  ./node_modules/.bin/eslint ${file%.*}.js --fix || true
  lebab --transform=${safe},${unsafe} ${file%.*}.js  --out-file ${file%.*}.es6
  ./node_modules/.bin/eslint ${file%.*}.es6 --fix || true
  # rm ${file%.*}.js
  mv -f ${file%.*}.es6 ${file%.*}.js
  # rm ${file}
done
