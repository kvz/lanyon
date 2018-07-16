# https://github.com/envygeeks/jekyll-docker/blob/master/repos/jekyll/Dockerfile
# https://rubygems.org/gems/github-pages
# https://rubygems.org/gems/jekyll-archives
# https://rubygems.org/gems/stringex
# https://rubygems.org/gems/jekyll-feed
# https://rubygems.org/gems/jekyll-crosspost-to-medium
# https://rubygems.org/gems/jekyll-lunr-js-search
# https://rubygems.org/gems/liquid_pluralize
# https://rubygems.org/gems/minimal-mistakes-jekyll
FROM jekyll/jekyll:3.8
RUN gem install \
    github-pages:188 \
    jekyll-archives:2.1.1 \
    stringex:2.8.4 \
    jekyll-feed:0.10.0 \
    jekyll-crosspost-to-medium:0.1.15 \
    jekyll-lunr-js-search:3.3.0 \
    liquid_pluralize:1.0.3 \
    minimal-mistakes-jekyll:4.12.0 \
  -- --use-system-libraries 
# COPY package.json /srv/lanyon/package.json
# COPY yarn.lock /srv/lanyon/yarn.lock
# RUN cd /srv/lanyon && yarn --production