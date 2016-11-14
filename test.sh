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
  echo '{
  "name": "my-website"
}' > package.json
  npm link lanyon
  echo '' > _config.yml
  echo '---
title: home
---
' > index.md
  PROJECT_DIR=$(pwd) npm explore lanyon -- npm run build
  find .
  (md5sum ./_site/index.html || md5 ./_site/index.html) 2> /dev/null | grep 68b329da9893e34099c7d8ad5cb9c940
popd
rm -rf "${tdir}"
