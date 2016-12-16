#!/usr/bin/env bash
# set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace

version=$(node -e 'console.log(require("./package.json").version)')

for dir in ~/code/content ~/code/legal ~/code/lanyon/example ~/code/lanyon/website ~/code/transloadify ~/code/tus.io ~/code/frey-website ~/code/bash3boilerplate; do
  pushd ${dir}
    npm unlink lanyon || true
    # env LANYON_RESET=1 yarn add lanyon@${version}
    yarn add lanyon@${version}
    git add package.json yarn.lock
    git commit -m "Upgrade Lanyon to v${version}" || true
    git pull && git push
  popd
done
