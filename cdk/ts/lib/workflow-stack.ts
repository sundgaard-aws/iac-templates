import * as Core from '@aws-cdk/core';
import EC2 = require('@aws-cdk/aws-ec2');
import S3 = require('@aws-cdk/aws-s3');
import SQS = require('@aws-cdk/aws-sqs');
import Lambda = require('@aws-cdk/aws-lambda');
import StepFunctions = require('@aws-cdk/aws-stepfunctions');
import StepFunctionsTasks = require('@aws-cdk/aws-stepfunctions-tasks');
import { IVpc } from '@aws-cdk/aws-ec2';
import { MetaData } from './meta-data';
import { CfnFunction } from '@aws-cdk/aws-lambda';

const PREFIX = "iac-demo-";
const NAME = "Name";

export class WorkflowStack extends Core.Stack {
    constructor(scope: Core.Construct, id: string, metaData: MetaData, props?: Core.StackProps) {
        super(scope, id, props);

        this.createSQSQueue(metaData);
        this.createStepFunctionStates(metaData);
    }

    private createStepFunctionStates(metaData: MetaData)
    {
        // removalPolicy: cdk.RemovalPolicy.DESTROY,
        /*var stepFunctions = new Amazon.CDK.AWS.StepFunctions.CfnStateMachine(this, Program.PREFIX+"stf", new CfnStateMachineProps {
            StateMachineType = StateMachineType.STANDARD.ToString(), StateMachineName = Program.PREFIX+"stf"
        });*/
        /*var vpc = Vpc.FromLookup(this, vpcRef, new VpcLookupOptions{
            VpcId = vpcRef
        });*/

        var codeBucket = new S3.Bucket(this, PREFIX+"lambda-code-bucket", {
            bucketName: PREFIX+"lambda-code-bucket", removalPolicy: Core.RemovalPolicy.DESTROY
        });            

        var runtime = Lambda.Runtime.NODEJS_12_X;
        //var submitFunctionCodeFromS3 = new Lambda.S3Code(codeBucket, "submit-api-code.zip");
        var submitFunctionCodeFromLocalZip = Lambda.Code.fromAsset("assets/submit-api");
        var submitLambda = new Lambda.Function(this, PREFIX+"submit-api-lam", { 
            functionName: PREFIX + "submit-api-lfn", vpc: metaData.VPC, code: submitFunctionCodeFromLocalZip, handler: "index.mainHandler", runtime: runtime
        });

        /*var test = new CfnFunction(this, "id", new CfnFunctionProps {
            FunctionName = Program.PREFIX + "submit-api-lfn", Code = submitFunctionCode, Runtime = runtime.ToString(), Handler = "IAC.Demo.FunctionHandler"
        });*/
        

        //var statusFunctionCodeFromS3 = new Lambda.S3Code(codeBucket, "status-api-code.zip");
        var statusFunctionCodeFromLocalZip = Lambda.Code.fromAsset("assets/status-api");
        var getStatusLambda = new Lambda.Function(this, PREFIX+"status-api-lam", { 
            functionName: PREFIX + "check-api-lfn", vpc: metaData.VPC, code: statusFunctionCodeFromLocalZip, handler: "index.mainHandler", runtime: runtime
        });
        /*new CfnFunction(this, "dasd", {
            vpcConfig: {
                securityGroupIds: [],
                subnetIds: []
            }
        });*/

        var submitJob = new StepFunctionsTasks.LambdaInvoke(this, "Submit Job", {
            lambdaFunction: submitLambda,
            // Lambda's result is in the attribute `Payload`
            outputPath: "$.Payload"
        });

        var waitX = new StepFunctions.Wait(this, "Wait X Seconds", {
            time: StepFunctions.WaitTime.secondsPath("$.waitSeconds")
        });

        var getStatus = new StepFunctionsTasks.LambdaInvoke(this, "Get Job Status", {
            lambdaFunction: getStatusLambda,
            // Pass just the field named "guid" into the Lambda, put the
            // Lambda's result in a field called "status" in the response
            inputPath: "$.guid",
            outputPath: "$.Payload"
        });

        var jobFailed = new StepFunctions.Fail(this, "Job Failed", {
            cause: "AWS Batch Job Failed",
            error: "DescribeJob returned FAILED"
        });

        var finalStatus = new StepFunctionsTasks.LambdaInvoke(this, "Get Final Job Status", {                
            lambdaFunction: getStatusLambda,
            // Use "guid" field as input
            inputPath: "$.guid",
            outputPath: "$.Payload"
        });

        var definition = submitJob.next(waitX).next(getStatus).next(new StepFunctions.Choice(this, "Job Complete?").when(StepFunctions.Condition.stringEquals("$.status", "FAILED"), jobFailed)
        .when(StepFunctions.Condition.stringEquals("$.status", "SUCCEEDED"), finalStatus).otherwise(waitX));

        new StepFunctions.StateMachine(this, "StateMachine", {
            definition: definition,
            timeout: Core.Duration.minutes(5)
        });
    }

    private createSQSQueue(metaData: MetaData)
    {
        var queue = new SQS.CfnQueue(this, PREFIX+"sqs", {
            queueName: PREFIX+"sqs", visibilityTimeout: 4, messageRetentionPeriod: 360000
        });
        queue.tags.setTag(NAME, PREFIX+"sqs");
    }
}
