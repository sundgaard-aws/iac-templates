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

//using Amazon.CDK.AWS.StepFunctions;
//using Amazon.CDK.AWS.StepFunctions.Tasks;


namespace Dotnet
{
    export class WorkflowStack extends Core.Stack {
        constructor(scope: Core.Construct, id: string, vpcRef: string, vpc: IVpc, props?: Core.StackProps) {
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
                bucketName = PREFIX+"lambda-code-bucket"
            });            

            var runtime = Lambda.Runtime.DOTNET_CORE_3_1;
            var submitFunctionCodeFromS3 = new Lambda.S3Code(codeBucket, "submit-api-code.zip");
            var submitFunctionCodeFromLocalZip = Lambda.Code.fromAsset("submit-api.zip");
            var submitLambda = new Function(this, "SubmitLambda", { 
                FunctionName: PREFIX + "submit-api-lfn", Vpc: vpc, Code: submitFunctionCodeFromLocalZip, Handler: "IAC.Demo.FunctionHandler", Runtime: runtime
            });

            /*var test = new CfnFunction(this, "id", new CfnFunctionProps {
                FunctionName = Program.PREFIX + "submit-api-lfn", Code = submitFunctionCode, Runtime = runtime.ToString(), Handler = "IAC.Demo.FunctionHandler"
            });*/
            

            var statusFunctionCodeFromS3 = new Lambda.S3Code(codeBucket, "status-api-code.zip");
            var statusFunctionCodeFromLocalZip = Lambda.Code.fromAsset("submit-api.zip");
            var getStatusLambda = new Function(this, "CheckLambda", { 
                FunctionName: PREFIX + "check-api-lfn", Vpc: vpc, Code: statusFunctionCodeFromLocalZip, Handler: "IAC.Demo.FunctionHandler", Runtime: runtime
            });

            var submitJob = new StepFunctionsTasks.LambdaInvoke(this, "Submit Job", {
                lambdaFunction: submitLambda,
                // Lambda's result is in the attribute `Payload`
                OutputPath = "$.Payload"
            });

            var waitX = new StepFunctions.Wait(this, "Wait X Seconds", {
                time: WaitTime.SecondsPath("$.waitSeconds")
            });

            var getStatus = new StepFunctionsTasks.LambdaInvoke(this, "Get Job Status", {
                lambdaFunction: getStatusLambda,
                // Pass just the field named "guid" into the Lambda, put the
                // Lambda's result in a field called "status" in the response
                InputPath = "$.guid",
                OutputPath = "$.Payload"
            });

            var jobFailed = new Fail(this, "Job Failed", {
                Cause = "AWS Batch Job Failed",
                Error = "DescribeJob returned FAILED"
            });

            var finalStatus = new StepFunctionsTasks.LambdaInvoke(this, "Get Final Job Status", {                
                lambdaFunction: getStatusLambda,
                // Use "guid" field as input
                InputPath = "$.guid",
                OutputPath = "$.Payload"
            });

            var definition = submitJob.Next(waitX).Next(getStatus).Next(new StepFunctions.Choice(this, "Job Complete?").when(StepFunctions.Condition.stringEquals("$.status", "FAILED"), jobFailed)
            .when(StepFunctions.Condition.stringEquals("$.status", "SUCCEEDED"), finalStatus).otherwise(waitX));

            new StepFunctions.StateMachine(this, "StateMachine", {
                definition: definition,
                timeout: Core.Duration.minutes(5)
            });
        }

        private createSQSQueue(vpcRef: string)
        {
            var queue = new SQS.CfnQueue(this, PREFIX+"sqs", {
                queueName: PREFIX+"sqs", visibilityTimeout = 4, messageRetentionPeriod = 360000
            });
            queue.tags.setTag("Name", PREFIX+"sqs");
        }
    }
}
