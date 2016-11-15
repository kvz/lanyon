FROM ruby:2.1.10-alpine

# @todo replace this version
ENV GITHUB_GEM_VERSION 104

RUN mkdir -p /srv
WORKDIR /srv

RUN apk --update add make gcc g++

COPY Gemfile /srv/Gemfile

RUN bundler install --path vendor/bundler
RUN bundler update

EXPOSE 4000
CMD bundler exec jekyll serve -d /_site --watch --force_polling -H 0.0.0.0 -P 4000
