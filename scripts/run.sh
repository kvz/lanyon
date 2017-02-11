#!/usr/bin/env bash
set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace

# env DEBUG=lanyon:*,tlc:* LANYON_ONLY="system" LANYON_PROJECT=$HOME/code/content npm run watch:assets

# killall node ruby jekyll || true
# env DEBUG=lanyon,tlc:* LANYON_ONLY="system" LANYON_PROJECT=$HOME/code/content node lib/cli.js start

# env DEBUG=lanyon,tlc:* LANYON_ONLY="system" LANYON_PROJECT=$HOME/code/content npm run serve
# env DEBUG=lanyon,tlc:* LANYON_ONLY="system" LANYON_PROJECT=$HOME/code/content npm run start

env DEBUG=*:* LANYON_RESET="1" LANYON_ONLY="system" LANYON_PROJECT=$HOME/code/content node lib/cli.js install
env DEBUG=*:* LANYON_RESET="1" LANYON_ONLY="system" LANYON_PROJECT=$HOME/code/content node lib/cli.js build:content

env DEBUG=*:* LANYON_RESET="1" LANYON_ONLY="rbenv" LANYON_PROJECT=$HOME/code/content node lib/cli.js install
env DEBUG=*:* LANYON_RESET="1" LANYON_ONLY="rbenv" LANYON_PROJECT=$HOME/code/content node lib/cli.js build:content

env DEBUG=*:* LANYON_RESET="1" LANYON_ONLY="rvm" LANYON_PROJECT=$HOME/code/content node lib/cli.js install
env DEBUG=*:* LANYON_RESET="1" LANYON_ONLY="rvm" LANYON_PROJECT=$HOME/code/content node lib/cli.js build:content

env DEBUG=*:* LANYON_RESET="1" LANYON_ONLY="docker" LANYON_PROJECT=$HOME/code/content node lib/cli.js install
env DEBUG=*:* LANYON_RESET="1" LANYON_ONLY="docker" LANYON_PROJECT=$HOME/code/content node lib/cli.js build:content

env LANYON_UPDATE_GEM_LOCKFILE=1 DOCKER_BUILD=1 DOCKER_RESET=1 DEBUG=*:* LANYON_ONLY="docker" LANYON_PROJECT=$HOME/code/content node lib/cli.js install
env DOCKER_BUILD=1 DOCKER_RESET=1 DEBUG=*:* LANYON_ONLY="docker" LANYON_PROJECT=$HOME/code/content node lib/cli.js build:content
