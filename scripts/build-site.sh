#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
npm run build:css
docker run --rm --platform linux/amd64 \
  -v "$PWD":/srv/jekyll -w /srv/jekyll \
  jekyll/jekyll:3.8 \
  sh -c 'bundle install --quiet && bundle exec jekyll build'
