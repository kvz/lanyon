#!/usr/bin/env bash
set -o pipefail
set -o errexit
set -o nounset
set -o xtrace

__dirname="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
__scriptsdir="$(cd "$(dirname "${__dirname}")" && pwd)"
__rootdir="$(cd "$(dirname "${__scriptsdir}")" && pwd)"

pushd "${__dirname}"
  # --no-cache \
  docker build . \
    --tag lanyon-base:0.12

  # --rm \
  docker run \
    -it \
    --volume "${__rootdir}:/app" \
    lanyon-base:0.12 \
    sh -ci " \
      npm install && npm run build
    "
popd
