import * as Core from '@aws-cdk/core';
import EC2 = require('@aws-cdk/aws-ec2');
import S3 = require('@aws-cdk/aws-s3');
import SQS = require('@aws-cdk/aws-sqs');
import Lambda = require('@aws-cdk/aws-lambda');
import StepFunctions = require('@aws-cdk/aws-stepfunctions');
import StepFunctionsTasks = require('@aws-cdk/aws-stepfunctions-tasks');
import { IVpc } from '@aws-cdk/aws-ec2';

const PREFIX = "iac-demo-";
const NAME = "Name";

export class WorkflowStack extends Core.Stack {
    constructor(scope: Core.Construct, id: string, vpcRef: string, vpc: EC2.IVpc, props?: Core.StackProps) {
        super(scope, id, props);

        this.createSQSQueue(vpcRef);
        this.createStepFunctionStates(vpcRef, vpc);
    }

    private createStepFunctionStates(vpcRef: string, vpc: IVpc)
    {
        /*var stepFunctions = new Amazon.CDK.AWS.StepFunctions.CfnStateMachine(this, Program.PREFIX+"stf", new CfnStateMachineProps {
            StateMachineType = StateMachineType.STANDARD.ToString(), StateMachineName = Program.PREFIX+"stf"
        });*/
        /*var vpc = Vpc.FromLookup(this, vpcRef, new VpcLookupOptions{
            VpcId = vpcRef
        });*/

        var codeBucket = new S3.Bucket(this, PREFIX+"lambda-code-bucket", {
            bucketName: PREFIX+"lambda-code-bucket"
        });            

        var runtime = Lambda.Runtime.DOTNET_CORE_3_1;
        //var submitFunctionCodeFromS3 = new Lambda.S3Code(codeBucket, "submit-api-code.zip");
        var submitFunctionCodeFromLocalZip = Lambda.Code.fromAsset("assets/submit-api");
        var submitLambda = new Lambda.Function(this, "SubmitLambda", { 
            functionName: PREFIX + "submit-api-lfn", vpc: vpc, code: submitFunctionCodeFromLocalZip, handler: "IAC.Demo.FunctionHandler", runtime: runtime
        });

        /*var test = new CfnFunction(this, "id", new CfnFunctionProps {
            FunctionName = Program.PREFIX + "submit-api-lfn", Code = submitFunctionCode, Runtime = runtime.ToString(), Handler = "IAC.Demo.FunctionHandler"
        });*/
        

        //var statusFunctionCodeFromS3 = new Lambda.S3Code(codeBucket, "status-api-code.zip");
        var statusFunctionCodeFromLocalZip = Lambda.Code.fromAsset("assets/status-api");
        var getStatusLambda = new Lambda.Function(this, "CheckLambda", { 
            functionName: PREFIX + "check-api-lfn", vpc: vpc, code: statusFunctionCodeFromLocalZip, handler: "IAC.Demo.FunctionHandler", runtime: runtime
        });

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

    private createSQSQueue(vpcRef: string)
    {
        var queue = new SQS.CfnQueue(this, PREFIX+"sqs", {
            queueName: PREFIX+"sqs", visibilityTimeout: 4, messageRetentionPeriod: 360000
        });
        queue.tags.setTag(NAME, PREFIX+"sqs");
    }
}
