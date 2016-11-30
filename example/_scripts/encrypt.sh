#!/usr/bin/env bash
set -o errexit
set -o errtrace
set -o nounset
set -o pipefail
# set -o xtrace

# Set magic variables for current file, directory, os, etc.
__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
__file="${__dir}/$(basename "${BASH_SOURCE[0]}")"
__base="$(basename ${__file} .sh)"

source ${__dirname}/../env.sh

travis encrypt "GHPAGES_URL=${GHPAGES_URL}" --add env.global
travis encrypt "GHPAGES_BOTNAME=${GHPAGES_BOTNAME}" --add env.global
travis encrypt "GHPAGES_URL=${GHPAGES_URL}" --add env.global
