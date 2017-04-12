#!/bin/sh -ex
echo "--> LANYON_USE_LINKED=${LANYON_USE_LINKED:-}"
echo " --> in $(pwd)"

if egrep '"lanyon": "\d+\.\d+\.\d+"' package.json; then
  cd .
  echo " --> in $(pwd)"
elif egrep '"lanyon": "\d+\.\d+\.\d+"' website/package.json; then
  cd website
  echo " --> in $(pwd)"
else
  echo "==> unable to locate lanyon dependency in package.json or website/package.json"
  exit 1
fi

if [ ! -f node_modules/.bin/lanyon ]; then
  if [ "${LANYON_USE_LINKED:-}" = "1" ]; then
    npm link lanyon
  else
    yarn || npm install
  fi
fi

if [ ! -f node_modules/.bin/lanyon ]; then
  if [ -f lib/cli.js ]; then
    node lib/cli.js install
  elif [ -f ../lib/cli.js ]; then
    node ../lib/cli.js install
  else
    echo "==> unable to locate lanyon cli in node_modules/.bin/lanyon or lib/cli.js or ../lib/cli.js"
    exit 1
  fi
else
  node_modules/.bin/lanyon install
fi

(npm run build:production || npm run web:build:production) && (npm run deploy || npm run web:deploy)

cd -
echo " --> in $(pwd)"
