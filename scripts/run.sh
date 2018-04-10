#!/usr/bin/env bash
set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace

env DEBUG=*:* LANYON_PROJECT=$HOME/code/content node src/cli.js build:content
