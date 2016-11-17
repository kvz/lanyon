#!/usr/bin/env bash
set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace

lanyonDir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if type md5sum 2>/dev/null; then
  cmdMd5=md5sum
elif type md5 2>/dev/null; then
  cmdMd5=md5
else
  echo "No md5 program found"
  exit 1
fi

cmdNpm="npm"
cmdNpmExplore="npm"

if type yarn 2>/dev/null; then
  cmdNpm=yarn
  # no cmdNpmExplore as Yarn does not (yet?) support `npm explore`
fi

if ! type ${cmdNpm}; then
  echo "No npm program found"
  exit 1
fi


# Cross-platform mktemp: http://unix.stackexchange.com/questions/30091/fix-or-alternative-for-mktemp-in-os-x
projectDir=$(mktemp -d 2>/dev/null || mktemp -d -t 'lanyon')
export LANYON_PROJECT=${projectDir}

pushd "${lanyonDir}"
  ${cmdNpm} link || true
popd

pushd "${projectDir}"
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
assets_base_url: "/"
EOF

  cat << EOF > index.md
---
title: home
---
EOF

  ${cmdNpm} link lanyon

  for shim in "jekyll" "bundler" "ruby"; do
    echo "--> ${shim} contents:"
    cat node_modules/lanyon/vendor/bin/${shim}
  done

  ${cmdNpmExplore} explore lanyon -- ${cmdNpm} run build
  find .
  ${cmdMd5} ./_site/index.html |tee |grep 68b329da9893e34099c7d8ad5cb9c940
popd

rm -rf "${projectDir}"
