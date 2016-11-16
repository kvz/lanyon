#!/usr/bin/env bash
set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace

__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if type md5sum 2>/dev/null; then
  cmdMd5=md5sum
elif type md5 2>/dev/null; then
  cmdMd5=md5
else
  echo "No md5 program found"
  exit 1
fi

if type yarn 2>/dev/null; then
  cmdNpm=yarn
elif type npm 2>/dev/null; then
  cmdNpm=npm
else
  echo "No npm program found"
  exit 1
fi

echo "${__dir}"

${cmdNpm} link || true

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

  ${cmdNpm} link lanyon

  set -x
  export PROJECT_DIR=$(pwd)
  npm explore lanyon -- ${cmdNpm} run build
  cat node_modules/lanyon/vendor/bin/jekyll
  find .
  ${cmdMd5} ./_site/index.html |tee |grep 68b329da9893e34099c7d8ad5cb9c940
  set +x
popd
rm -rf "${tdir}"
