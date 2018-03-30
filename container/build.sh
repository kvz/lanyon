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

cache=""
if [ "${DOCKER_RESET:-}" = "1" ]; then
  cache="--no-cache"
fi

docker build . ${cache} -t kevinvz/lanyon:0.0.109

  # --volume="$PWD/vendor/bundle:/usr/local/bundle" \
docker run --rm \
  --volume="$PWD:/srv/jekyll" \
  -it kevinvz/lanyon:0.0.109 \
  bundle -v
  # --volume="$PWD/vendor/bundle:/usr/local/bundle" \
docker run --rm \
  --volume="$PWD:/srv/jekyll" \
  -it kevinvz/lanyon:0.0.109 \
  bundle update --verbose

docker push kevinvz/lanyon:0.0.109