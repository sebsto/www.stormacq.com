#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as ecr_assets from 'aws-cdk-lib/aws-ecr-assets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as path from 'path';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'SebInTheCloudBuildV2', {
  env: { region: 'eu-central-1', account: '401955065246' }
});

// Build and push Docker image to ECR automatically
const hugoImage = new ecr_assets.DockerImageAsset(stack, 'HugoImage', {
  directory: path.join(__dirname, '../../docker'),
  platform: ecr_assets.Platform.LINUX_ARM64
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
    buildImage: codebuild.LinuxArmBuildImage.fromDockerRegistry(hugoImage.imageUri),
    computeType: codebuild.ComputeType.SMALL
  },
  timeout: cdk.Duration.minutes(60),
  queuedTimeout: cdk.Duration.minutes(480),
  badge: true
});

hugoImage.repository.grantPull(project);

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
    }
  ]
});

new cdk.CfnOutput(stack, 'ImageUri', { value: hugoImage.imageUri });
new cdk.CfnOutput(stack, 'ProjectName', { value: project.projectName });
new cdk.CfnOutput(stack, 'PipelineName', { value: pipeline.pipelineName });

app.synth();
