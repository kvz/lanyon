#!/bin/sh -ex
if egrep '"lanyon": "\d+\.\d+\.\d+"' package.json; then
  cd .
fi
if egrep '"lanyon": "\d+\.\d+\.\d+"' website/package.json; then
  cd website
fi

if [ ! -f node_modules/.bin/lanyon ]; then
  yarn || npm install
fi

node_modules/.bin/lanyon install

(npm run build:production || npm run web:build:production) && (npm run deploy || npm run web:deploy)

cd -
