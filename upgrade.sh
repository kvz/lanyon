#!/usr/bin/env bash
# set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace

version=$(node -e 'console.log(require("./package.json").version)')

for dir in ~/code/tus.io ~/code/frey-website ~/code/bash3boilerplate; do
  pushd ${dir}
  yarn add lanyon@${version}
  git commit -m "Upgrade Lanyon to v${version}" package.json yarn.lock
  git pull && git push
  popd
done
