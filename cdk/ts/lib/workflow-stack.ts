import * as Core from '@aws-cdk/core';
import EC2 = require('@aws-cdk/aws-ec2');
import S3 = require('@aws-cdk/aws-s3');
import SQS = require('@aws-cdk/aws-sqs');
import Lambda = require('@aws-cdk/aws-lambda');
import LambdaEvents = require('@aws-cdk/aws-lambda-event-sources');
import StepFunctions = require('@aws-cdk/aws-stepfunctions');
import StepFunctionsTasks = require('@aws-cdk/aws-stepfunctions-tasks');
import { IVpc } from '@aws-cdk/aws-ec2';
import { MetaData } from './meta-data';
import { CfnFunction } from '@aws-cdk/aws-lambda';

const PREFIX = "iac-demo-";
const NAME = "Name";

export class WorkflowStack extends Core.Stack {
    private runtime:Lambda.Runtime = Lambda.Runtime.NODEJS_12_X;
    private metaData:MetaData;

    constructor(scope: Core.Construct, id: string, metaData: MetaData, props?: Core.StackProps) {
        super(scope, id, props);

        this.metaData = metaData;
        var queue = this.createSQSQueue();
        this.createStepFunctionsTrigger(queue);
        this.createStepFunctionStatesL2();
    }

    private createStepFunctionStatesL2()
    {
        var codeBucket = new S3.Bucket(this, PREFIX+"lambda-code-bucket", {
            bucketName: PREFIX+"lambda-code-bucket", removalPolicy: Core.RemovalPolicy.DESTROY
        });
        Core.Tags.of(codeBucket).add(NAME, PREFIX+"lambda-code-bucket");

        var submitLambda = this.createSubmitFunction();
        var getStatusLambda = this.createStatusFunction();

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

        var stateMachine = new StepFunctions.StateMachine(this, "StateMachine", {
            definition: definition,
            timeout: Core.Duration.minutes(5),
            stateMachineName: PREFIX+"trade-stm"
        });
        Core.Tags.of(stateMachine).add(NAME, PREFIX+"trade-stm");
    }

    private createLambdaFunction(name:string, handlerMethod:string, assetPath:string, vpc:EC2.IVpc):Lambda.Function {
        var codeFromLocalZip = Lambda.Code.fromAsset(assetPath);
        var lambdaFunction = new Lambda.Function(this, PREFIX+name, { 
            functionName: PREFIX+name, vpc: vpc, code: codeFromLocalZip, handler: handlerMethod, runtime: this.runtime
        });
        Core.Tags.of(lambdaFunction).add(NAME, PREFIX+name);
        return lambdaFunction;
    }

    private createSubmitFunction():Lambda.Function {
        return this.createLambdaFunction("submit-api-lam", "index.mainHandler", "assets/submit-api", this.metaData.VPC);
    }

    private createStatusFunction():Lambda.Function {
        return this.createLambdaFunction("status-api-lam", "index.mainHandler", "assets/status-api", this.metaData.VPC);
    }

    private createStepFunctionsTrigger(queue:SQS.IQueue) {
        var sfnLambdaTriggerFunction = this.createLambdaFunction("invoke-sfn-api-lam", "index.mainHandler", "assets/invoke-sfn-api", this.metaData.VPC);
        sfnLambdaTriggerFunction.addEventSource(new LambdaEvents.SqsEventSource(queue, {}));
    }    
    
    private createSQSQueue():SQS.IQueue
    {
        var deadLetterqueue = new SQS.Queue(this, PREFIX+"dlq-sqs", {
            queueName: PREFIX+"dlq-sqs", visibilityTimeout: Core.Duration.seconds(4), retentionPeriod: Core.Duration.days(14)
        });
        Core.Tags.of(deadLetterqueue).add(NAME, PREFIX+"dlq-sqs");
        
        var queue = new SQS.Queue(this, PREFIX+"sqs", {
            queueName: PREFIX+"sqs", visibilityTimeout: Core.Duration.seconds(4), retentionPeriod: Core.Duration.days(14), deadLetterQueue: {queue: deadLetterqueue, maxReceiveCount: 5}
        });
        Core.Tags.of(queue).add(NAME, PREFIX+"sqs");
        return queue;
    }    

    private createSQSQueueL1():SQS.CfnQueue
    {
        var queue = new SQS.CfnQueue(this, PREFIX+"sqs", {
            queueName: PREFIX+"sqs", visibilityTimeout: 4, messageRetentionPeriod: 360000
        });
        queue.tags.setTag(NAME, PREFIX+"sqs");
        return queue;
    }

    private createStepFunctionStatesL1()
    {
        // removalPolicy: cdk.RemovalPolicy.DESTROY,
        /*var stepFunctions = new Amazon.CDK.AWS.StepFunctions.CfnStateMachine(this, Program.PREFIX+"stf", new CfnStateMachineProps {
            StateMachineType = StateMachineType.STANDARD.ToString(), StateMachineName = Program.PREFIX+"stf"
        });*/
        /*var vpc = Vpc.FromLookup(this, vpcRef, new VpcLookupOptions{
            VpcId = vpcRef
        });*/
         
        
        //var submitFunctionCodeFromS3 = new Lambda.S3Code(codeBucket, "submit-api-code.zip");

        /*var test = new CfnFunction(this, "id", new CfnFunctionProps {
            FunctionName = Program.PREFIX + "submit-api-lfn", Code = submitFunctionCode, Runtime = runtime.ToString(), Handler = "IAC.Demo.FunctionHandler"
        });*/
        

        //var statusFunctionCodeFromS3 = new Lambda.S3Code(codeBucket, "status-api-code.zip");
        /*new CfnFunction(this, "dasd", {
            vpcConfig: {
                securityGroupIds: [],
                subnetIds: []
            }
        });*/
    }    
}
