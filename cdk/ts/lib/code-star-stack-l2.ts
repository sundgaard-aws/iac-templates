import * as Core from '@aws-cdk/core';
import EC2 = require('@aws-cdk/aws-ec2');
import S3 = require('@aws-cdk/aws-s3');
import { MetaData } from './meta-data';
import * as CS from '@aws-cdk/aws-codepipeline';

export class CodeStarStackL2 extends Core.Stack {
    private metaData:MetaData;

    constructor(scope: Core.Construct, id: string, metaData: MetaData, props?: Core.StackProps) {
        super(scope, id, props);

        this.metaData = metaData;
        this.createPipeline();
    }

    private createPipeline()
    {
        /*var codeBucket = new S3.Bucket(this, this.metaData.PREFIX+"lambda-code-bucket", {
            bucketName: this.metaData.PREFIX+"lambda-code-bucket", removalPolicy: Core.RemovalPolicy.DESTROY
        });
        Core.Tags.of(codeBucket).add(this.metaData.NAME, this.metaData.PREFIX+"lambda-code-bucket");*/
        var pipeline = new CS.Pipeline(this, this.metaData.PREFIX+"pipeline-cdk", {
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
        });
    }
    
    private createBuildProject() {
       var buildProject = new Project(this, PREFIX+"build-project", {
        projectName: PREFIX+"build-project",
            source: {type: "GitHub", badgeSupported: false, }
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