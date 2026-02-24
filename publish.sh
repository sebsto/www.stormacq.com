#!/bin/bash

# DO NOT USE, use container CLI instead (cd docker && ./run.sh)
exit -1

AWS_PROFILE=seb
BUCKET_NAME=stormacq.com

container run --rm --volume="$PWD:/src" hugo-site hugo --minify && aws --profile $AWS_PROFILE s3 sync public/ s3://$BUCKET_NAME/
