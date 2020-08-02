# https://github.com/envygeeks/jekyll-docker/blob/master/repos/jekyll/Dockerfile
# https://rubygems.org/gems/jekyll-algolia
# https://rubygems.org/gems/jekyll-archives
# https://rubygems.org/gems/jekyll-commonmark
# https://rubygems.org/gems/jekyll-crosspost-to-medium
# https://rubygems.org/gems/jekyll-feed
# https://rubygems.org/gems/jekyll-include-cache
# https://rubygems.org/gems/jekyll-last-modified-at
# https://rubygems.org/gems/jekyll-mentions
# https://rubygems.org/gems/jekyll-paginate-v2
# https://rubygems.org/gems/jekyll-redirect-from
# https://rubygems.org/gems/jekyll-seo-tag
# https://rubygems.org/gems/jekyll-sitemap
# https://rubygems.org/gems/jekyll-tagging
# https://rubygems.org/gems/jekyll-tagsgenerator
# https://rubygems.org/gems/liquid_pluralize
# https://rubygems.org/gems/liquid-c
# https://rubygems.org/gems/stringex

FROM kevinvz/jekyll:4.1.1
RUN gem install \
    jekyll-algolia:1.6.0 \
    jekyll-archives:2.2.1 \
    jekyll-commonmark:1.3.1 \
    jekyll-crosspost-to-medium:0.1.16 \
    jekyll-feed:0.15.0 \
    jekyll-include-cache:0.2.0 \
    jekyll-last-modified-at:1.3.0 \
    jekyll-mentions:1.6.0 \
    jekyll-paginate:1.1.0 \
    jekyll-redirect-from:0.16.0 \
    jekyll-seo-tag:2.6.1 \
    jekyll-sitemap:1.4.0 \
    jekyll-tagging:1.1.0 \
    jekyll-tagsgenerator:0.0.2 \
    liquid_pluralize:1.0.3 \
    liquid-c:4.0.0 \
    stringex:2.8.5 \
  -- --use-system-libraries

#     jekyll-paginate-v2:1.9.4 \
# RUN gem specific_install \
#   https://github.com/mmistakes/jekyll-paginate-v2.git -b jekyll-v4 \
#   -- --use-system-libraries

# COPY Gemfile.lock /srv/jekyll/Gemfile.lock
# COPY Gemfile /srv/jekyll/Gemfile
# RUN bundle update --verbose
# COPY package.json /srv/lanyon/package.json
# COPY yarn.lock /srv/lanyon/yarn.lock
# RUN cd /srv/lanyon && yarn --production