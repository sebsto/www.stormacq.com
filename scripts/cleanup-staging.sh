#!/bin/bash
set -euo pipefail

# Tear down the staging environment (S3 bucket, CloudFront distribution, OAC)
# Usage: ./scripts/cleanup-staging.sh

AWS_PROFILE="seb"
BUCKET_NAME="staging.stormacq.com"
DISTRIBUTION_ID="E3QTI35SLDJGBO"
OAC_ID="E3BUR6AVZDBYS0"

echo "==> Disabling CloudFront distribution $DISTRIBUTION_ID..."
ETAG=$(aws --profile "$AWS_PROFILE" cloudfront get-distribution-config \
  --id "$DISTRIBUTION_ID" --query 'ETag' --output text)

aws --profile "$AWS_PROFILE" cloudfront get-distribution-config \
  --id "$DISTRIBUTION_ID" --query 'DistributionConfig' --output json \
  | python3 -c "import sys,json; c=json.load(sys.stdin); c['Enabled']=False; json.dump(c,sys.stdout)" \
  > /tmp/staging-dist-config.json

aws --profile "$AWS_PROFILE" cloudfront update-distribution \
  --id "$DISTRIBUTION_ID" \
  --if-match "$ETAG" \
  --distribution-config file:///tmp/staging-dist-config.json \
  --query 'Distribution.Status' --output text

echo "==> Waiting for distribution to be disabled (this can take several minutes)..."
aws --profile "$AWS_PROFILE" cloudfront wait distribution-deployed --id "$DISTRIBUTION_ID"

echo "==> Deleting CloudFront distribution..."
ETAG=$(aws --profile "$AWS_PROFILE" cloudfront get-distribution-config \
  --id "$DISTRIBUTION_ID" --query 'ETag' --output text)
aws --profile "$AWS_PROFILE" cloudfront delete-distribution \
  --id "$DISTRIBUTION_ID" --if-match "$ETAG"

echo "==> Deleting OAC $OAC_ID..."
ETAG=$(aws --profile "$AWS_PROFILE" cloudfront get-origin-access-control \
  --id "$OAC_ID" --query 'ETag' --output text)
aws --profile "$AWS_PROFILE" cloudfront delete-origin-access-control \
  --id "$OAC_ID" --if-match "$ETAG"

echo "==> Deleting CloudFront Function..."
FUNC_ETAG=$(aws --profile "$AWS_PROFILE" cloudfront describe-function \
  --name staging-index-rewrite --query 'ETag' --output text 2>/dev/null) && \
aws --profile "$AWS_PROFILE" cloudfront delete-function \
  --name staging-index-rewrite --if-match "$FUNC_ETAG" || true

echo "==> Emptying and deleting S3 bucket $BUCKET_NAME..."
aws --profile "$AWS_PROFILE" s3 rb "s3://$BUCKET_NAME" --force

rm -f /tmp/staging-dist-config.json

echo "==> Staging environment cleaned up."
