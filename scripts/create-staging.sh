#!/bin/bash
set -euo pipefail

# Create the staging infrastructure (S3 bucket, OAC, CloudFront distribution)
# Usage: ./scripts/create-staging.sh
# After creation, run ./scripts/deploy-staging.sh to build and upload the site.

AWS_PROFILE="seb"
BUCKET_NAME="staging.stormacq.com"
BUCKET_REGION="eu-west-1"

echo "==> Creating S3 bucket $BUCKET_NAME..."
aws --profile "$AWS_PROFILE" s3 mb "s3://$BUCKET_NAME" --region "$BUCKET_REGION"

echo "==> Creating Origin Access Control..."
OAC_ID=$(aws --profile "$AWS_PROFILE" cloudfront create-origin-access-control \
  --origin-access-control-config '{
    "Name": "staging-stormacq-oac",
    "Description": "OAC for staging.stormacq.com",
    "SigningProtocol": "sigv4",
    "SigningBehavior": "always",
    "OriginAccessControlOriginType": "s3"
  }' --query 'OriginAccessControl.Id' --output text)
echo "    OAC ID: $OAC_ID"

echo "==> Creating CloudFront Function for index.html rewriting..."
cat > /tmp/cf-index-rewrite.js << 'ENDOFFUNCTION'
function handler(event) {
  var request = event.request;
  var uri = request.uri;
  if (uri.endsWith("/")) {
    request.uri += "index.html";
  } else if (!uri.includes(".")) {
    request.uri += "/index.html";
  }
  return request;
}
ENDOFFUNCTION

FUNC_ARN=$(aws --profile "$AWS_PROFILE" cloudfront create-function \
  --name staging-index-rewrite \
  --function-config '{"Comment":"Append index.html to directory requests","Runtime":"cloudfront-js-2.0"}' \
  --function-code fileb:///tmp/cf-index-rewrite.js \
  --query 'FunctionSummary.FunctionMetadata.FunctionARN' --output text)

FUNC_ETAG=$(aws --profile "$AWS_PROFILE" cloudfront describe-function \
  --name staging-index-rewrite --query 'ETag' --output text)
aws --profile "$AWS_PROFILE" cloudfront publish-function \
  --name staging-index-rewrite --if-match "$FUNC_ETAG" > /dev/null
rm -f /tmp/cf-index-rewrite.js
echo "    Function ARN: $FUNC_ARN"

echo "==> Creating CloudFront distribution..."
DIST_OUTPUT=$(aws --profile "$AWS_PROFILE" cloudfront create-distribution \
  --distribution-config '{
    "CallerReference": "staging-stormacq-'"$(date +%s)"'",
    "Comment": "Staging for stormacq.com Hugo migration",
    "Enabled": true,
    "DefaultRootObject": "index.html",
    "Origins": {
      "Quantity": 1,
      "Items": [{
        "Id": "S3-staging-stormacq",
        "DomainName": "'"$BUCKET_NAME"'.s3.'"$BUCKET_REGION"'.amazonaws.com",
        "OriginAccessControlId": "'"$OAC_ID"'",
        "S3OriginConfig": { "OriginAccessIdentity": "" }
      }]
    },
    "DefaultCacheBehavior": {
      "TargetOriginId": "S3-staging-stormacq",
      "ViewerProtocolPolicy": "redirect-to-https",
      "AllowedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] },
      "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
      "Compress": true,
      "FunctionAssociations": {
        "Quantity": 1,
        "Items": [{
          "FunctionARN": "'"$FUNC_ARN"'",
          "EventType": "viewer-request"
        }]
      }
    },
    "CustomErrorResponses": {
      "Quantity": 1,
      "Items": [{
        "ErrorCode": 404,
        "ResponsePagePath": "/404.html",
        "ResponseCode": "404",
        "ErrorCachingMinTTL": 60
      }]
    },
    "PriceClass": "PriceClass_100"
  }')

DIST_ID=$(echo "$DIST_OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['Distribution']['Id'])")
DOMAIN=$(echo "$DIST_OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['Distribution']['DomainName'])")
echo "    Distribution ID: $DIST_ID"
echo "    Domain: $DOMAIN"

ACCOUNT_ID=$(aws --profile "$AWS_PROFILE" sts get-caller-identity --query Account --output text)

echo "==> Setting S3 bucket policy..."
aws --profile "$AWS_PROFILE" s3api put-bucket-policy \
  --bucket "$BUCKET_NAME" \
  --region "$BUCKET_REGION" \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Sid": "AllowCloudFrontServicePrincipalReadOnly",
      "Effect": "Allow",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::'"$BUCKET_NAME"'/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::'"$ACCOUNT_ID"':distribution/'"$DIST_ID"'"
        }
      }
    }]
  }'

echo ""
echo "==> Staging infrastructure created."
echo "    Distribution is deploying (takes ~5 minutes)."
echo ""
echo "    Update these values in deploy-staging.sh and cleanup-staging.sh:"
echo "      DISTRIBUTION_ID=\"$DIST_ID\""
echo "      OAC_ID=\"$OAC_ID\""
echo "      BASE_URL=\"https://$DOMAIN\""
echo ""
echo "    Then run: ./scripts/deploy-staging.sh"
