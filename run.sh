set -eu
env DEBUG=*:* LANYON_ONLY="system" LANYON_PROJECT=$HOME/code/content node postinstall.js

# env DEBUG=*:* LANYON_ONLY="rbenv" LANYON_PROJECT=$HOME/code/content node postinstall.js
# env DEBUG=*:* LANYON_ONLY="rbenv" LANYON_PROJECT=$HOME/code/content npm run build:content

# env DEBUG=*:* LANYON_ONLY="rvm" LANYON_PROJECT=$HOME/code/content node postinstall.js
# env DEBUG=*:* LANYON_ONLY="rvm" LANYON_PROJECT=$HOME/code/content npm run build:content

# env DOCKER_BUILD=1 DEBUG=*:* LANYON_ONLY="docker" LANYON_PROJECT=$HOME/code/content node postinstall.js
# env DOCKER_BUILD=1 DEBUG=*:* LANYON_ONLY="docker" LANYON_PROJECT=$HOME/code/content npm run build:content

# env DOCKER_BUILD=0 DEBUG=*:* LANYON_ONLY="docker" LANYON_PROJECT=$HOME/code/content node postinstall.js
# env DOCKER_BUILD=0 DEBUG=*:* LANYON_ONLY="docker" LANYON_PROJECT=$HOME/code/content npm run build:content
