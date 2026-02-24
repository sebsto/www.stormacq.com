#!/bin/bash
set -euo pipefail

# Deploy Hugo site to staging environment
# Usage: ./scripts/deploy-staging.sh

AWS_PROFILE="seb"
BUCKET_NAME="staging.stormacq.com"
DISTRIBUTION_ID="E3QTI35SLDJGBO"
CLOUDFRONT_DOMAIN="d1k63z9kiguit1.cloudfront.net"
BASE_URL="https://$CLOUDFRONT_DOMAIN"

echo "==> Building site with staging base URL..."
container run --rm --volume="$PWD:/src" hugo-site hugo --minify -b "$BASE_URL"

echo "==> Syncing to s3://$BUCKET_NAME/..."
aws --profile "$AWS_PROFILE" s3 sync public/ "s3://$BUCKET_NAME/" --delete --quiet

echo "==> Invalidating CloudFront cache..."
aws --profile "$AWS_PROFILE" cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text

echo "==> Done. Site available at: $BASE_URL"
