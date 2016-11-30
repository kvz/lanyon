#!/usr/bin/env bash
# set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace

lanyonDir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

function mdfive () {
  local filepath="${1}"
  local neededHash="${2}"
  local environment="${3}"

  echo "--> Comparing md5 hash of ${filepath} with fixture: '${neededHash}' for '${environment}'"

  if type md5sum 2>/dev/null; then
    actualHash=$(md5sum "${filepath}" |awk '{print $1}')
  elif type md5 2>/dev/null; then
    actualHash=$(md5 "${filepath}" |awk '{print $NF}')
  else
    echo "No md5 program found"
    exit 1
  fi

  if [ "${actualHash}" != "neededHash" ]; then
    echo "Failed md5 for '${filepath}'. Actual was: '${actualHash}'. Needed was: '${neededHash}'"
    echo ""
    echo "Contents:"
    echo ""
    head "${filepath}"
    echo ""
    echo ""
    exit 1
  fi
}


if ! type npm; then
  echo "No npm program found"
  exit 1
fi


# Cross-platform mktemp: http://unix.stackexchange.com/questions/30091/fix-or-alternative-for-mktemp-in-os-x
# projectDir=$(mktemp -d 2>/dev/null || mktemp -d -t 'lanyon')
# Docker for Mac won't allow the resulting: /var/folders/n9/d_nqmjq90l1crx58v_krcxy00000gn/T/tmp.2K3yyeaz filepath
# so switching to /tmp/epoch+ms
tmpDir="/private/tmp"
if [ ! -d "${tmpDir}" ]; then
  tmpDir="/tmp"
fi
projectDir=${tmpDir}/lanyon-$(date +%s%N)
mkdir -p "${projectDir}"
projectDir="$(cd "${projectDir}" && pwd)" # we need to resolve this for docker. Readlink won't work on nested symlinks
export LANYON_PROJECT=${projectDir}

pushd "${projectDir}"
  echo "--> Setting up sample project"
  git init
  mkdir -p assets _layouts

  cat << EOF > assets/app.js
var beautifullVarName = 'Very nice'
if (beautifullVarName === 'Very nice') {
  console.log('pretty');
} else {
  console.log('ugly');
}
EOF

  cat << EOF > package.json
{
  "name": "my-website",
  "scripts": {
    "build": "lanyon build",
    "build:production": "LANYON_ENV=production lanyon build"
  }
}
EOF

  cat << EOF > _config.yml
name: Transloadit
baseurl: null
assets_base_url: /
EOF

  cat << EOF > _layouts/default.html
<html>
  <head>
    <title>{{page.title}}</title>
  </head>
  <body>
    {{content}}
  </body>
</html>
EOF

  cat << EOF > index.md
---
layout: default
title: Homepage
---
# {{page.title}}

Hello, world!
EOF

  echo "--> Exporting lanyon link"
  pushd "${lanyonDir}"
    npm link
  popd
  echo "--> Importing lanyon link (like an npm install, but with local sources)"
  npm link lanyon

  for shim in "jekyll" "bundler" "ruby"; do
    echo "--> Showing shim ${shim} contents:"
    cat .lanyon/bin/${shim}
  done

  echo "--> Building site for 'development' in '${projectDir}'"
  npm run build
  echo "--> Showing tree for 'development' in '${projectDir}'"
  # There is no app.js in development
  head "./_site/index.html"

  echo "--> Building site for 'production' in '${projectDir}'"
  rm -rf ./_site
  npm run build:production
  echo "--> Showing tree for 'production' in '${projectDir}'"
  head "./_site/assets/build/app.js"
  head "./_site/index.html"
  # mdfive "./_site/assets/build/app.js" "68b329da9893e34099c7d8ad5cb9c940" "production"
  # mdfive "./_site/index.html" "68b329da9893e34099c7d8ad5cb9c940" "production"
popd

echo "--> Cleaning up files in '${projectDir}'"
# rm -rf "${projectDir}"
