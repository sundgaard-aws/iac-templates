import cdk = require('@aws-cdk/core');
import { BuildSpec,BuildEnvironmentVariable, PipelineProject, LinuxBuildImage, ComputeType, Project } from '@aws-cdk/aws-codebuild'
import { Repository } from '@aws-cdk/aws-codecommit'
import { Pipeline, Artifact } from '@aws-cdk/aws-codepipeline';
import {CodeBuildAction,CodeCommitSourceAction,CodeCommitTrigger, GitHubSourceAction } from '@aws-cdk/aws-codepipeline-actions';
import {PolicyStatement,Effect} from '@aws-cdk/aws-iam';
import { Bucket, BucketAccessControl } from '@aws-cdk/aws-s3';
import { RemovalPolicy } from '@aws-cdk/core';
import { MetaData } from './meta-data';

const PREFIX = "iac-demo-";
const NAME = "Name";

export class CodeStarStack extends cdk.Stack {
  private projectName: string;
  private pipeline: Pipeline;

  constructor(scope: cdk.Construct, id: string, metaData: MetaData, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new Pipeline(this, PREFIX + 'pipeline', {
      pipelineName: PREFIX + 'pipeline',
    });
    /*var githubSource = this.buildGitHubSource(pipeline);

    var buildProject = new Project(this, PREFIX+"build-project", {
      projectName: PREFIX+"build-project",
      source: {type: "GitHub", badgeSupported: false, }
    });*/
    
    //BuildSpec.

    /*const pipelineProject = new PipelineProject(this, PREFIX+"pipeline-project", {
      //buildSpec: BuildSpec.fromSourceFilename('buildspec.yml'),
      description: PREFIX+"pipeline-project",
      environment: {
        buildImage:  LinuxBuildImage.STANDARD_2_0,
        computeType: ComputeType.SMALL,
        privileged: true,
      },
      environmentVariables: {
      },

    });*/

   
    /*const codeBuildAction = new CodeBuildAction( {
      input: {},

    });*/

    /*this.pipeline = new Pipeline(this, this.projectName, {
      stages: [
        {
          stageName: 'Source',
          actions: [
            
          ]
        },
        {
          stageName: 'Build',
          actions: [
            codeBuildAction
          ]
        }
      ]
    });*/

  }

  /*private buildGitHubSource(pipeline: Pipeline):GitHubSourceAction {
    // Read the secret from Secrets Manager
    const sourceOutput = new Artifact();
    const sourceAction = new GitHubSourceAction({
      actionName: 'GitHub_Source',
      owner: 'awslabs',
      repo: 'aws-cdk',      
      oauthToken: cdk.SecretValue.secretsManager('my-github-token'),
      output: sourceOutput,
      branch: 'develop', // default: 'master'
    });
    pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction],
    });

    return sourceAction;
  };*/
}