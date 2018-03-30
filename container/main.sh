#!/usr/bin/env bash
# Copyright (c) 2018, Transloadit Ltd.
# Authors:
#  - Kevin van Zonneveld <kevin@transloadit.com>

set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace

__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${__dir}"

__lanyonVersion="$(node -e 'console.log(require("../package.json").version)')"
mode=$1

if [ "${mode}" = "build" ]; then
  cache=""
  rm=""
  if [ "${DOCKER_RESET:-}" = "1" ]; then
    cache="--no-cache"
    rm="--rm"
  fi

  docker build . ${rm} ${cache} -t "kevinvz/lanyon:${__lanyonVersion}"

  docker push "kevinvz/lanyon:${__lanyonVersion}"
elif [ "${mode}" = "connect" ]; then
  set -x
  docker run \
    --rm \
    --volume="$PWD:/srv/jekyll" \
    -it "kevinvz/lanyon:${__lanyonVersion}" \
    bash
else
  echo "Unrecognized mode: '${mode}'"
  exit 1
fi

