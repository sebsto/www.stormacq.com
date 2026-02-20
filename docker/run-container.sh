#!/bin/bash

# Run Jekyll site using Apple Container
# Run from the main site directory: ./docker/run-container.sh

IMAGE_NAME="jekyll-site"

# Build the image with the Gemfile from the project root
# container build -t $IMAGE_NAME -f docker/Dockerfile .

# Run with the site mounted so changes are picked up
container run \
  -p 4000:4000 \
  --rm \
  --volume="$PWD:/srv/jekyll" \
  -it $IMAGE_NAME \
  bundle exec jekyll serve -H 0.0.0.0 -P 4000 --watch --force_polling --livereload --unpublished
