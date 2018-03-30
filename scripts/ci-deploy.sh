#!/bin/sh -ex
echo "--> LANYON_USE_LINKED=${LANYON_USE_LINKED:-}"
echo " --> in $(pwd)"

if egrep '"lanyon": "[[:digit:]]+\.[[:digit:]]+\.[[:digit:]]+"' package.json; then
  # This is for GNU egrep regex matching
  cd .
  echo " --> in $(pwd)"
elif egrep '"lanyon": "\d+\.\d+\.\d+"' package.json; then
  # This is for BSD egrep regex matching
  cd .
  echo " --> in $(pwd)"
elif egrep '"lanyon": "[[:digit:]]+\.[[:digit:]]+\.[[:digit:]]+"' website/package.json; then
  # This is for GNU egrep regex matching
  cd website
  echo " --> in $(pwd)"
elif egrep '"lanyon": "\d+\.\d+\.\d+"' website/package.json; then
  # This is for BSD egrep regex matching
  cd website
  echo " --> in $(pwd)"
else
  ls -al
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

(npm run build:production || npm run web:build:production) && (npm run deploy || npm run web:deploy)

cd -
echo " --> in $(pwd)"
