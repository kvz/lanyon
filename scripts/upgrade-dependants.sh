#!/usr/bin/env bash
# set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace

# Set magic variables for current FILE & DIR
__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# __file="${__dir}/$(basename "${0}")"
# __base="$(basename ${__file})"
# __root="$(cd "$(dirname "${__dir}")" && pwd)"

version=$(node -e 'console.log(require("./package.json").version)')

for dir in ~/code/employee-internals ~/code/invig ~/code/content ~/code/kvz.io ~/code/legal ~/code/lanyon/example ~/code/lanyon/website ~/code/transloadify ~/code/tus.io ~/code/frey-website ~/code/bash3boilerplate; do
  pushd "${dir}"
    npm unlink lanyon || true

    # gsed -i _scripts/postinstall.sh -e 's/lanyon postinstall/lanyon install/g' || true
    # git add _scripts/postinstall.sh || true
    gsed -i .travis.yml -e 's@before_deploy: .lanyon/bin/install@@g' || true
    gsed -i .travis.yml -e 's@.lanyon/bin/deploy@./node_modules/lanyon/scripts/ci-deploy.sh@g' || true
    git add .travis.yml || true
    # gsed -i package.json -e 's/lanyon postinstall/lanyon install/g' || true
    # git add package.json || true

    yarn add lanyon@${version}
    git add yarn.lock package.json || true
    env LANYON_RESET=1 node "${__dir}/../lib/cli.js" install

    git commit -m "Upgrade Lanyon to v${version}" || true
    git pull && git push
  popd
done
