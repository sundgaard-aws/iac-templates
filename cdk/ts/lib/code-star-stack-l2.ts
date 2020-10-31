import * as Core from '@aws-cdk/core';
import EC2 = require('@aws-cdk/aws-ec2');
import S3 = require('@aws-cdk/aws-s3');
import { MetaData } from './meta-data';
import * as CP from '@aws-cdk/aws-codepipeline';
import * as CPA from '@aws-cdk/aws-codepipeline-actions';
import * as CB from '@aws-cdk/aws-codebuild';
import * as CD from '@aws-cdk/aws-codedeploy';

import * as INC from '@aws-cdk/cloudformation-include';

export class CodeStarStackL2 extends Core.Stack {
    private metaData:MetaData;

    constructor(scope: Core.Construct, id: string, metaData: MetaData, props?: Core.StackProps) {
        super(scope, id, props);

        this.metaData = metaData;
        this.modifyPipeline();
        //this.createPipeline();
    }
    
    private modifyPipeline() {
        var cfnPipelineStack = new INC.CfnInclude(this, 'Pipeline', {
            templateFile: '../../yaml/codebuild-stack.yaml'
        });
        //var deploymentGroup = cfnPipelineStack.getResource("CodeDeployDeploymentGroup") as unknown as CD.CfnDeploymentGroup;
        //deploymentGroup.autoScalingGroups = [this.metaData.AutoScalingGroup.autoScalingGroupName];
        //console.log("dgName=" + deploymentGroup.deploymentGroupName);
    }

    // https://docs.aws.amazon.com/cdk/api/latest/docs/aws-codepipeline-actions-readme.html
    private createPipeline()
    {
        /*var codeBucket = new S3.Bucket(this, this.metaData.PREFIX+"lambda-code-bucket", {
            bucketName: this.metaData.PREFIX+"lambda-code-bucket", removalPolicy: Core.RemovalPolicy.DESTROY
        });
        Core.Tags.of(codeBucket).add(this.metaData.NAME, this.metaData.PREFIX+"lambda-code-bucket");*/

        var ownerName = "sundgaard-aws";
        var repoName = "simple-java-bootstrap-app";
        //repoName = "https://github.com/sundgaard-aws/simple-java-bootstrap-app.git";
        var sourceArtifact = new CP.Artifact();    
        var pipeline = new CP.Pipeline(this, this.metaData.PREFIX+"pipeline-2");
        var sourceStage = pipeline.addStage({stageName:"Source"});
        var gitHubSourceAction = new CPA.GitHubSourceAction({
            actionName: "GetSource",
            branch: "main",
            repo: repoName,
            owner: ownerName,
            output: sourceArtifact,
            oauthToken: Core.SecretValue.secretsManager('github-pat'),
            trigger: CPA.GitHubTrigger.POLL
            
        });
        sourceStage.addAction(gitHubSourceAction);
        var buildStage = pipeline.addStage({stageName:"Build"});
        
        /*
        Name: iac-demo-codebuild-project
          Description: iac-demo-codebuild-project
        Artifacts:
        Type: 'CODEPIPELINE'
          ServiceRole: 'arn:aws:iam::299199322523:role/iac-demo-code-build-project-service-role'
          Environment: 
        Image: 'aws/codebuild/amazonlinux2-x86_64-standard:3.0'
        ComputeType: BUILD_GENERAL1_SMALL
        Type: 'LINUX_CONTAINER'
        Source:
        Type: 'CODEPIPELINE'   
        */
        var gitHubSource = CB.Source.gitHub({
            branchOrRef: "main",
            owner: ownerName,
            repo: repoName
        });
        var codeBuildProject = new CB.Project(this, this.metaData.PREFIX+"build-project-2", {
            projectName: this.metaData.PREFIX+"build-project-2",
            description: this.metaData.PREFIX+"build-project-2",
            source: gitHubSource
        });
        
        
        
        var codeBuildBuild = new CPA.CodeBuildAction({
            actionName: "StartBuild",
            input: sourceArtifact,
            project: codeBuildProject
        });
        buildStage.addAction(codeBuildBuild);
        
        
        
        /*var pipeline = new CP.Pipeline(this, this.metaData.PREFIX+"pipeline-2", {
            stages: [
                {
                  stageName: 'Source',
                  actions: [
                      {
                        actionProperties: {
                            actionName: "GetSource",
                            category: CP.ActionCategory.SOURCE,
                            provider: "CodeStarSourceConnection",
                            artifactBounds: {maxInputs:1, maxOutputs:1, minInputs:1, minOutputs:1}
                        } 
                      }
                  ]
                },
                {
                  stageName: 'Build',
                  actions: [
                      {
                        actionProperties: {
                            actionName: "StartBuild",
                            category: CP.ActionCategory.BUILD,
                            provider: "CodeBuild",
                            artifactBounds: {maxInputs:1, maxOutputs:1, minInputs:1, minOutputs:1}
                        } 
                      }
                  ]
                }
            ]
        });*/
    }
    
    private createBuildProject() {
       var buildProject = new CB.Project(this, this.metaData.PREFIX+"build-project-2", {
        projectName: this.metaData.PREFIX+"build-project-2",
            //source: {type: "GitHub", badgeSupported: false, }
        });
    
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
    }*/
    }
}