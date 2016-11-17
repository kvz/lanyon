set -eu
# env DEBUG=*:* LANYON_DISABLE="system ruby-shim docker rvm" LANYON_PROJECT=$HOME/code/content node postinstall.js
# env DEBUG=*:* LANYON_DISABLE="system ruby-shim docker rvm" LANYON_PROJECT=$HOME/code/content npm run build:content

# env DEBUG=*:* LANYON_DISABLE="system ruby-shim docker rbenv" LANYON_PROJECT=$HOME/code/content node postinstall.js
# env DEBUG=*:* LANYON_DISABLE="system ruby-shim docker rbenv" LANYON_PROJECT=$HOME/code/content npm run build:content

# env DOCKER_BUILD=1 DEBUG=*:* LANYON_DISABLE="system ruby-shim rbenv rvm" LANYON_PROJECT=$HOME/code/content node postinstall.js
# env DOCKER_BUILD=1 DEBUG=*:* LANYON_DISABLE="system ruby-shim rbenv rvm" LANYON_PROJECT=$HOME/code/content npm run build:content

env DOCKER_BUILD=0 DEBUG=*:* LANYON_DISABLE="system ruby-shim rbenv rvm" LANYON_PROJECT=$HOME/code/content node postinstall.js
env DOCKER_BUILD=0 DEBUG=*:* LANYON_DISABLE="system ruby-shim rbenv rvm" LANYON_PROJECT=$HOME/code/content npm run build:content
