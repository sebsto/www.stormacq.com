#!/bin/bash

AWS_PROFILE=seb
BUCKET_NAME=stormacq.com

bundle exec jekyll build --incremental && aws --profile $AWS_PROFILE s3 sync _site/ s3://$BUCKET_NAME/