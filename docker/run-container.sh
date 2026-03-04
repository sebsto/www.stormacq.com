#!/bin/bash

# Run Hugo site using Apple Container
# Run from the main site directory: ./docker/run-container.sh

IMAGE_NAME="hugo-site"

# Build the image
# container build -t $IMAGE_NAME -f docker/Dockerfile .

# Run with the site mounted so changes are picked up
container run \
  -p 1313:1313 \
  --rm -it \
  -v $(pwd):/project \
  $IMAGE_NAME \
  server --bind 0.0.0.0 --watch
