using System;
using Amazon.CDK;
using Amazon.CDK.AWS.StepFunctions;
using Amazon.CDK.AWS.SQS;
using Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.StepFunctions.Tasks;
using Amazon.CDK.AWS.EC2;
using Amazon.CDK.AWS.S3;
using Constructs;

namespace Dotnet
{
    public class WorkflowStack : Stack
    {
        internal WorkflowStack(Construct scope, string id, Vpc vpc, IStackProps props = null) : base(scope, id, props)
        {
            //createSQSQueue(vpcRef);
            createStepFunctionStates(vpc);
        }

        private void createStepFunctionStates(Vpc vpc)
        {
            /*var stepFunctions = new Amazon.CDK.AWS.StepFunctions.CfnStateMachine(this, Program.PREFIX+"stf", new CfnStateMachineProps {
                StateMachineType = StateMachineType.STANDARD.ToString(), StateMachineName = Program.PREFIX+"stf"
            });*/

            /*var codeBucket = new Bucket(this, Program.PREFIX+"lambda-code-bucket", new BucketProps {
                BucketName = Program.PREFIX+"lambda-code-bucket"
            });*/
            
            var runtime = Runtime.DOTNET_6;
            //var submitFunctionCodeFromS3 = new S3Code(codeBucket, "submit-api-code.zip");
            var functionCodeFromLocalZip = Code.FromAsset("assets/SubmitFunctionHandler/bin/drop.zip");
            var submitLambda = new Function(this, "SubmitLambda", new FunctionProps { 
                FunctionName = Program.PREFIX + "submit-api-lfn", Vpc = vpc, Code = functionCodeFromLocalZip, Handler = "SubmitFunctionHandler::IACDemo.StepFunctions.Submit.FunctionHandler::Invoke", Runtime = runtime, 
            });

            //var statusFunctionCodeFromS3 = new S3Code(codeBucket, "status-api-code.zip");
            functionCodeFromLocalZip = Code.FromAsset("assets/JobStatusFunctionHandler/bin/drop.zip");
            var getStatusLambda = new Function(this, "CheckLambda", new FunctionProps { 
                FunctionName = Program.PREFIX + "check-api-lfn", Vpc = vpc, Code = functionCodeFromLocalZip, Handler = "JobStatusFunctionHandler::IACDemo.StepFunctions.JobStatus.FunctionHandler::Invoke", Runtime = runtime
            });

            functionCodeFromLocalZip = Code.FromAsset("assets/FinalizeJobFunctionHandler/bin/drop.zip");
            var finalizeJobLambda = new Function(this, "FinalizeJobLambda", new FunctionProps { 
                FunctionName = Program.PREFIX + "finalize-job-api-lfn", Vpc = vpc, Code = functionCodeFromLocalZip, Handler = "FinalizeJobFunctionHandler::IACDemo.StepFunctions.FinalizeJob.FunctionHandler::Invoke", Runtime = runtime
            });            

            var submitJob = new LambdaInvoke(this, "Submit Job", new LambdaInvokeProps {
                LambdaFunction = submitLambda,
                // Lambda's result is in the attribute `Payload
                OutputPath = "$.Payload"
            });

            var waitX = new Wait(this, "Wait X Seconds", new WaitProps {
                Time = WaitTime.SecondsPath("$.waitSeconds")
            });

            var getStatus = new LambdaInvoke(this, "Get Job Status", new LambdaInvokeProps {
                LambdaFunction = getStatusLambda,
                // Pass just the field named "guid" into the Lambda, put the
                // Lambda's result in a field called "status" in the response
                //InputPath = "$.guid",
                InputPath = "$",
                OutputPath = "$.Payload"
            });

            var jobFailed = new Fail(this, "Job Failed", new FailProps {
                Cause = "AWS Batch Job Failed",
                Error = "DescribeJob returned FAILED"
            });

            var finalStatus = new LambdaInvoke(this, "Get Final Job Status", new LambdaInvokeProps {
                LambdaFunction = finalizeJobLambda,
                // Use "guid" field as input
                InputPath = "$",
                OutputPath = "$.Payload"
            });

            var definition = submitJob.Next(waitX).Next(getStatus).Next(new Choice(this, "Job Complete?").When(Condition.StringEquals("$.status", "FAILED"), jobFailed).When(Condition.StringEquals("$.status", "SUCCEEDED"), finalStatus).Otherwise(waitX));

            new StateMachine(this, "StateMachine", new StateMachineProps {
                Definition = definition,
                Timeout = Duration.Minutes(5)
            });
        }

        private void createSQSQueue(string vpcRef)
        {
            var queue = new Amazon.CDK.AWS.SQS.CfnQueue(this, Program.PREFIX+"sqs", new CfnQueueProps {
                QueueName = Program.PREFIX+"sqs", VisibilityTimeout = 4, MessageRetentionPeriod = 360000
            });
            queue.Tags.SetTag("Name", Program.PREFIX+"sqs");
        }
    }
}
