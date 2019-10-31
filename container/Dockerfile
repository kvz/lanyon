# https://github.com/envygeeks/jekyll-docker/blob/master/repos/jekyll/Dockerfile
# https://rubygems.org/gems/jekyll-archives
# https://rubygems.org/gems/stringex
# https://rubygems.org/gems/jekyll-feed
# https://rubygems.org/gems/jekyll-crosspost-to-medium
# https://rubygems.org/gems/liquid_pluralize
# https://rubygems.org/gems/jekyll-seo-tag
# https://rubygems.org/gems/jekyll-sitemap
# https://rubygems.org/gems/jekyll-mentions
# https://rubygems.org/gems/jekyll-tagging
# https://rubygems.org/gems/jekyll-paginate
# https://rubygems.org/gems/jekyll-tagsgenerator
# https://rubygems.org/gems/jekyll-last-modified-at
# https://rubygems.org/gems/jekyll-redirect-from

FROM jekyll/jekyll:4.0
RUN gem install \
    jekyll-archives:2.2.1 \
    stringex:2.8.5 \
    jekyll-feed:0.12.1 \
    jekyll-crosspost-to-medium:0.1.15 \
    liquid_pluralize:1.0.3 \
    jekyll-seo-tag:2.6.1 \
    jekyll-sitemap:1.3.1 \
    jekyll-mentions:1.5.1 \
    jekyll-tagging:1.1.0 \
    jekyll-paginate:1.1.0 \
    jekyll-tagsgenerator:0.0.2 \
    jekyll-last-modified-at:1.1.0 \
    jekyll-redirect-from:0.15.0 \
  -- --use-system-libraries 
# COPY Gemfile.lock /srv/jekyll/Gemfile.lock
# COPY Gemfile /srv/jekyll/Gemfile
# RUN bundle update --verbose
# COPY package.json /srv/lanyon/package.json
# COPY yarn.lock /srv/lanyon/yarn.lock
# RUN cd /srv/lanyon && yarn --production