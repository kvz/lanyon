FROM ruby:2.3.3-alpine

RUN mkdir -p /jekyll
WORKDIR /jekyll
COPY Gemfile /jekyll/

RUN true \
  && apk --update add make gcc g++ \
  && bundler install --path /jekyll/vendor/bundler \
  && bundler update \
  && apk del make gcc g++ \
  && rm -rf /var/cache/apk/* \
  && true
