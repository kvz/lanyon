#!/usr/bin/env bash
# Copyright (c) 2018, Transloadit Ltd.
# Authors:
#  - Kevin van Zonneveld <kevin@transloadit.com>

set -o pipefail
set -o errexit
set -o nounset
set -o xtrace

__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${__dir}"

__lanyonVersion="$(node -e 'console.log(require("../package.json").version)')"

cache=""
rm=""
if [ "${DOCKER_RESET:-}" = "1" ]; then
  cache="--no-cache"
  rm="--rm"
fi

docker build . ${rm} ${cache} -t kevinvz/lanyon:0.0.109


docker run \
  --volume="$PWD:/srv/jekyll" \
  -it kevinvz/lanyon:0.0.109 \
  bundle update --verbose

docker commit $(docker ps --latest --quiet) kevinvz/lanyon:0.0.109

docker run \
  --volume="$PWD:/srv/jekyll" \
  -it kevinvz/lanyon:0.0.109 \
  bundle exec github-pages versions

docker push kevinvz/lanyon:0.0.109