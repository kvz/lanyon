#!/usr/bin/env bash
set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace

__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "${__dir}"
which npm

npm link

# Cross-platform mktemp: http://unix.stackexchange.com/questions/30091/fix-or-alternative-for-mktemp-in-os-x
tdir=$(mktemp -d 2>/dev/null || mktemp -d -t 'lanyon')
pushd "${tdir}"
  mkdir -p assets

  cat << EOF > assets/app.js
console.log('hey');
EOF

  cat << EOF > package.json
{
  "name": "my-website"
}
EOF

  cat << EOF > _config.yml
EOF

  cat << EOF > index.md
---
title: home
---
EOF

  npm link lanyon

  PROJECT_DIR=$(pwd) npm explore lanyon -- npm run build
  find .
  (md5sum ./_site/index.html || md5 ./_site/index.html) 2> /dev/null | grep 68b329da9893e34099c7d8ad5cb9c940
popd
rm -rf "${tdir}"
