#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3 from 'aws-cdk-lib/aws-s3';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'SebInTheCloudBuildV2', {
  env: { region: 'eu-central-1', account: '401955065246' }
});

// Reference existing S3 buckets
const websiteBucket = s3.Bucket.fromBucketName(stack, 'WebsiteBucket', 'stormacq.com');
const artifactBucket = s3.Bucket.fromBucketName(stack, 'ArtifactBucket', 'codepipeline-eu-central-1-609859956761');

// CodeBuild project
const project = new codebuild.Project(stack, 'SebInTheCloud', {
  projectName: 'sebinthecloud-v2',
  description: 'Build Seb in the Cloud (stormacq.com) using Hugo',
  source: codebuild.Source.gitHub({
    owner: 'sebsto',
    repo: 'www.stormacq.com'
  }),
  environment: {
    buildImage: codebuild.LinuxArmBuildImage.AMAZON_LINUX_2_STANDARD_3_0,
    computeType: codebuild.ComputeType.SMALL
  },
  timeout: cdk.Duration.minutes(60),
  queuedTimeout: cdk.Duration.minutes(480),
  badge: true
});

// Viewer-request CloudFront Function (Accept header content negotiation)
const viewerRequestFn = new cloudfront.Function(stack, 'ViewerRequestFn', {
  functionName: 'stormacq-viewer-request',
  code: cloudfront.FunctionCode.fromFile({
    filePath: '../cloudfront-function-request.js',
  }),
  runtime: cloudfront.FunctionRuntime.JS_2_0,
});

// Viewer-response CloudFront Function (Link headers + Content-Type for .md)
const viewerResponseFn = new cloudfront.Function(stack, 'ViewerResponseFn', {
  functionName: 'stormacq-viewer-response',
  code: cloudfront.FunctionCode.fromFile({
    filePath: '../cloudfront-function-response.js',
  }),
  runtime: cloudfront.FunctionRuntime.JS_2_0,
});

// CloudFront Distribution (imported via `cdk import`)
const distribution = new cloudfront.CfnDistribution(stack, 'Distribution', {
  distributionConfig: {
    enabled: true,
    comment: '',
    aliases: ['www.stormacq.com', 'stormacq.com'],
    defaultRootObject: '',
    httpVersion: 'http2and3',
    ipv6Enabled: true,
    priceClass: 'PriceClass_All',
    staging: false,
    origins: [{
      id: 'S3-stormacq.com',
      domainName: 'stormacq.com.s3.eu-central-1.amazonaws.com',
      originPath: '',
      connectionAttempts: 3,
      connectionTimeout: 10,
      originAccessControlId: 'E3AI48UG77QQB7',
      s3OriginConfig: {
        originAccessIdentity: '',
      },
      originShield: { enabled: false },
    }],
    defaultCacheBehavior: {
      targetOriginId: 'S3-stormacq.com',
      viewerProtocolPolicy: 'redirect-to-https',
      allowedMethods: ['GET', 'HEAD'],
      cachedMethods: ['GET', 'HEAD'],
      compress: true,
      cachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
      functionAssociations: [
        {
          eventType: 'viewer-request',
          functionArn: viewerRequestFn.functionArn,
        },
        {
          eventType: 'viewer-response',
          functionArn: viewerResponseFn.functionArn,
        },
      ],
    },
    customErrorResponses: [{
      errorCode: 404,
      responsePagePath: '/404.html',
      responseCode: 404,
      errorCachingMinTtl: 300,
    }],
    viewerCertificate: {
      acmCertificateArn: 'arn:aws:acm:us-east-1:401955065246:certificate/dce917d3-495f-421d-bdaa-a168cf9b8d25',
      sslSupportMethod: 'sni-only',
      minimumProtocolVersion: 'TLSv1.2_2021',
    },
    restrictions: {
      geoRestriction: {
        restrictionType: 'none',
      },
    },
    webAclId: 'arn:aws:wafv2:us-east-1:401955065246:global/webacl/CreatedByCloudFront-de5a15b5/e95f217f-5b9f-470c-a02a-d4bd16c145e7',
  },
});

// Pipeline artifacts
const sourceOutput = new codepipeline.Artifact('SebInTheCloud-Sources');
const buildOutput = new codepipeline.Artifact('BuildArtifact');

// CodePipeline
const pipeline = new codepipeline.Pipeline(stack, 'Pipeline', {
  pipelineName: 'sebinthecloud-v2',
  pipelineType: codepipeline.PipelineType.V2,
  executionMode: codepipeline.ExecutionMode.QUEUED,
  artifactBucket: artifactBucket,
  stages: [
    {
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeStarConnectionsSourceAction({
          actionName: 'GitHub',
          owner: 'sebsto',
          repo: 'www.stormacq.com',
          branch: 'main',
          connectionArn: 'arn:aws:codestar-connections:eu-central-1:401955065246:connection/1a3722f1-bd2f-40d4-badf-accd624640c6',
          output: sourceOutput,
          triggerOnPush: true
        })
      ]
    },
    {
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Build',
          project: project,
          input: sourceOutput,
          outputs: [buildOutput]
        })
      ]
    },
    {
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.S3DeployAction({
          actionName: 'DeploytoS3',
          bucket: websiteBucket,
          input: buildOutput,
          extract: true
        })
      ]
    },
  ]
});

new cdk.CfnOutput(stack, 'ProjectName', { value: project.projectName });
new cdk.CfnOutput(stack, 'PipelineName', { value: pipeline.pipelineName });
new cdk.CfnOutput(stack, 'DistributionId', { value: distribution.ref });
new cdk.CfnOutput(stack, 'DistributionDomainName', { value: distribution.attrDomainName });

app.synth();
