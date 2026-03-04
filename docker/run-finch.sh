#!/bin/bash

# Run Hugo site using Apple Container
# Run from the main site directory: ./docker/run-container.sh

IMAGE_NAME="ghcr.io/gohugoio/hugo:v0.157.0"

# Initialize git submodules
git submodule update --init --recursive --depth 1

# Run with the site mounted so changes are picked up
finch run \
  -p 1313:1313 \
  --rm -it \
  -v $(pwd):/project \
  $IMAGE_NAME \
  server --bind 0.0.0.0 --watch
