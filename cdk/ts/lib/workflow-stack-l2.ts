import * as Core from '@aws-cdk/core';
import EC2 = require('@aws-cdk/aws-ec2');
import S3 = require('@aws-cdk/aws-s3');
import SQS = require('@aws-cdk/aws-sqs');
import IAM = require("@aws-cdk/aws-iam");
import Lambda = require('@aws-cdk/aws-lambda');
import LambdaEvents = require('@aws-cdk/aws-lambda-event-sources');
import StepFunctions = require('@aws-cdk/aws-stepfunctions');
import StepFunctionsTasks = require('@aws-cdk/aws-stepfunctions-tasks');
import { IVpc } from '@aws-cdk/aws-ec2';
import { MetaData } from './meta-data';
import { CfnFunction } from '@aws-cdk/aws-lambda';
import * as SSM from '@aws-cdk/aws-ssm';
import { SSMHelper } from './ssm-helper';

export class WorkflowStackL2 extends Core.Stack {
    private runtime:Lambda.Runtime = Lambda.Runtime.NODEJS_12_X;
    private metaData:MetaData;
    private apiRole:IAM.IRole;
    private ssmHelper = new SSMHelper();

    constructor(scope: Core.Construct, id: string, metaData: MetaData, props?: Core.StackProps) {
        super(scope, id, props);

        this.metaData = metaData;
        this.apiRole = this.buildAPIRole();
        var queue = this.createSQSQueue();
        this.createStepFunctionsTrigger(queue);
        this.createStepFunctionStatesL2();
    }

    private createStepFunctionStatesL2()
    {
        var codeBucket = new S3.Bucket(this, this.metaData.PREFIX+"lambda-code-bucket", {
            bucketName: this.metaData.PREFIX+"lambda-code-bucket", removalPolicy: Core.RemovalPolicy.DESTROY
        });
        Core.Tags.of(codeBucket).add(this.metaData.NAME, this.metaData.PREFIX+"lambda-code-bucket");

        var submitLambda = this.createSubmitFunction();
        var getValidationStatusLambda = this.createStatusFunction();
        var updateStatusLambda = this.createUpdateStatusFunction();

        var submitValidationJob = new StepFunctionsTasks.LambdaInvoke(this, "Submit Validation Job", {
            lambdaFunction: submitLambda,
            // Lambda's result is in the attribute `Payload`
            outputPath: "$.Payload.refinedInput"
        });

        var simulatedValidation = new StepFunctions.Wait(this, "Validate Trade", {
            time: StepFunctions.WaitTime.secondsPath("$.waitSeconds")
        });

        var getValidationStatus = new StepFunctionsTasks.LambdaInvoke(this, "Get Validation Status", {
            lambdaFunction: getValidationStatusLambda,
            inputPath: "$",
            outputPath: "$.Payload.refinedInput"
        });

        var jobFailed = new StepFunctions.Fail(this, "Job Failed", {
            cause: "AWS Batch Job Failed",
            error: "DescribeJob returned FAILED"
        });

        var finalStatus = new StepFunctionsTasks.LambdaInvoke(this, "Update Validation Status", {                
            lambdaFunction: updateStatusLambda,
            // Use "guid" field as input
            inputPath: "$",
            outputPath: "$.Payload.refinedInput"
        });

        var definition = submitValidationJob
        .next(simulatedValidation)
        .next(getValidationStatus)
        .next(new StepFunctions.Choice(this, "Validation Complete?").when(StepFunctions.Condition.stringEquals("$.trade.TradeStatus", "INVALID"), jobFailed)
        .when(StepFunctions.Condition.stringEquals("$.trade.TradeStatus", "VALID"), finalStatus).otherwise(simulatedValidation));

        var stateMachine = new StepFunctions.StateMachine(this, "StateMachine", {
            definition: definition,
            timeout: Core.Duration.minutes(5),
            stateMachineName: this.metaData.PREFIX+"trade-stm"
        });
        Core.Tags.of(stateMachine).add(this.metaData.NAME, this.metaData.PREFIX+"trade-stm");
        Core.Tags.of(stateMachine.role).add(this.metaData.NAME, this.metaData.PREFIX+"trade-stm-role");
        this.ssmHelper.createSSMParameter(this, this.metaData.PREFIX+"state-machine-arn", stateMachine.stateMachineArn, SSM.ParameterType.STRING);
    }
    
    private buildAPIRole(): IAM.IRole {
        var role = new IAM.Role(this, this.metaData.PREFIX+"api-role", {
            description: "Lambda API Role",
            roleName: this.metaData.PREFIX+"api-role",
            assumedBy: new IAM.ServicePrincipal("lambda.amazonaws.com"),
            managedPolicies: [
                IAM.ManagedPolicy.fromAwsManagedPolicyName("AWSStepFunctionsFullAccess"),
                IAM.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMFullAccess"),
                IAM.ManagedPolicy.fromManagedPolicyArn(this, "AWSLambdaSQSQueueExecutionRole", "arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole"),
                IAM.ManagedPolicy.fromManagedPolicyArn(this, "AWSLambdaBasicExecutionRole", "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"),
                IAM.ManagedPolicy.fromManagedPolicyArn(this, "AWSLambdaVPCAccessExecutionRole", "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole")
            ],
        });
        role.addToPolicy(new IAM.PolicyStatement({
          effect: IAM.Effect.ALLOW,
          resources: ["*"],
          actions: ["secretsmanager:GetSecretValue","dbqms:*","rds-data:*"]
        }));

        Core.Tags.of(role).add(this.metaData.NAME, this.metaData.PREFIX+"api-role");
        return role;
    }    

    private createLambdaFunction(name:string, handlerMethod:string, assetPath:string, vpc:EC2.IVpc):Lambda.Function {
        var codeFromLocalZip = Lambda.Code.fromAsset(assetPath);
        var lambdaFunction = new Lambda.Function(this, this.metaData.PREFIX+name, { 
            functionName: this.metaData.PREFIX+name, vpc: vpc, code: codeFromLocalZip, handler: handlerMethod, runtime: this.runtime, memorySize: 256, timeout: Core.Duration.seconds(20), role: this.apiRole, securityGroups: [this.metaData.APISecurityGroup]
        });
        Core.Tags.of(lambdaFunction).add(this.metaData.NAME, this.metaData.PREFIX+name);
        return lambdaFunction;
    }

    private createSubmitFunction():Lambda.Function {
        return this.createLambdaFunction("submit-api-lam", "index.mainHandler", "assets/submit-api", this.metaData.VPC);
    }

    private createStatusFunction():Lambda.Function {
        return this.createLambdaFunction("status-api-lam", "index.mainHandler", "assets/status-api", this.metaData.VPC);
    }

    private createUpdateStatusFunction():Lambda.Function {
        return this.createLambdaFunction("update-status-api-lam", "index.mainHandler", "assets/update-status-api/", this.metaData.VPC);
    }
    
    private createStepFunctionsTrigger(queue:SQS.IQueue) {
        var sfnLambdaTriggerFunction = this.createLambdaFunction("invoke-sfn-api-lam", "index.mainHandler", "assets/invoke-sfn-api/", this.metaData.VPC);
        sfnLambdaTriggerFunction.addEventSource(new LambdaEvents.SqsEventSource(queue, {}));
    }    
    
    private createSQSQueue():SQS.IQueue
    {
        var deadLetterqueue = new SQS.Queue(this, this.metaData.PREFIX+"dlq-sqs", {
            queueName: this.metaData.PREFIX+"dlq-sqs", visibilityTimeout: Core.Duration.seconds(4), retentionPeriod: Core.Duration.days(14)
        });
        Core.Tags.of(deadLetterqueue).add(this.metaData.NAME, this.metaData.PREFIX+"dlq-sqs");
        
        var queue = new SQS.Queue(this, this.metaData.PREFIX+"sqs", {
            queueName: this.metaData.PREFIX+"sqs", visibilityTimeout: Core.Duration.seconds(4), retentionPeriod: Core.Duration.days(14), deadLetterQueue: {queue: deadLetterqueue, maxReceiveCount: 5}
        });
        Core.Tags.of(queue).add(this.metaData.NAME, this.metaData.PREFIX+"sqs");
        this.ssmHelper.createSSMParameter(this, this.metaData.PREFIX+"sqs-queue-url", queue.queueUrl, SSM.ParameterType.STRING);
        return queue;
    }    
}
