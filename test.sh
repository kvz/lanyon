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


if ! type npm; then
  echo "No npm program found"
  exit 1
fi


# Cross-platform mktemp: http://unix.stackexchange.com/questions/30091/fix-or-alternative-for-mktemp-in-os-x
# projectDir=$(mktemp -d 2>/dev/null || mktemp -d -t 'lanyon')
# Docker for Mac won't allow the resulting: /var/folders/n9/d_nqmjq90l1crx58v_krcxy00000gn/T/tmp.2K3yyeaz filepath
# so switching to /tmp/epoch+ms
projectDir=/tmp/$(date +%s%N)
mkdir -p "${projectDir}"
export LANYON_PROJECT=${projectDir}

echo "--> Exporting lanyon link"
pushd "${lanyonDir}"
  npm link
popd

pushd "${projectDir}"
  echo "--> Setting up sample project"
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

  echo "--> Importing lanyon link (like an npm install, but with local sources)"
  npm link lanyon

  for shim in "jekyll" "bundler" "ruby"; do
    echo "--> Showing shim ${shim} contents:"
    cat node_modules/lanyon/vendor/bin/${shim}
  done

  echo "--> Building site"
  npm explore lanyon -- npm run build
  echo "--> Showing tree"
  find .
  echo "--> Comparing md5 hash of index with a fixture"
  ${cmdMd5} ./_site/index.html |tee |grep 68b329da9893e34099c7d8ad5cb9c940
popd

echo "--> Cleaning up files"
rm -rf "${projectDir}"
