# CodeBuild Stack

Manages the CodeBuild project and custom Hugo Docker image for stormacq.com builds.

## One time CDK bootstrap 

```bash 
npx cdk bootstrap aws://401955065246/eu-central-1 --profile seb
```

## Setup

```bash
cd scripts/cdk-codebuild
npm install
```

## Deploy

CDK automatically builds and pushes the Docker image to ECR:

```bash
npm run deploy -- --profile seb
```

This will:
1. Build the Hugo image from `docker/Dockerfile`
2. Push it to a CDK-managed ECR repository
3. Create/update the CodeBuild project to use the image
