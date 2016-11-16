FROM ruby:2.1.10-alpine

# @todo replace this version
ENV GITHUB_GEM_VERSION 104

RUN mkdir -p /jekyll
WORKDIR /jekyll

RUN apk --update add make gcc g++

COPY Gemfile /jekyll/Gemfile

RUN bundler install --path /jekyll/vendor/bundler
RUN bundler update
