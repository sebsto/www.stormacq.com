#!/bin/bash

# DO NOT USE, use docker instead (cd docker && ./run.sh)
exit -1

AWS_PROFILE=seb
BUCKET_NAME=stormacq.com

bundle exec jekyll build --incremental && aws --profile $AWS_PROFILE s3 sync _site/ s3://$BUCKET_NAME/