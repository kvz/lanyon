npm link
tdir=$(mktemp -d)
pushd "${tdir}"
  npm link lanyon
  echo '' > _config.yml
  echo '---
title: home
---
' > index.md
  PROJECT_DIR=$(pwd) npm explore lanyon -- npm run build
  find .
  (md5sum ./_site/index.html || md5 ./_site/index.html) 2> /dev/null | grep 68b329da9893e34099c7d8ad5cb9c940
popd
rm -rf "${tdir}"
