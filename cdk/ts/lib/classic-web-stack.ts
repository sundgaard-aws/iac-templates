import * as Core from '@aws-cdk/core';
import EC2 = require('@aws-cdk/aws-ec2');
import S3 = require('@aws-cdk/aws-s3');
import SQS = require('@aws-cdk/aws-sqs');
import Lambda = require('@aws-cdk/aws-lambda');
import StepFunctions = require('@aws-cdk/aws-stepfunctions');
import StepFunctionsTasks = require('@aws-cdk/aws-stepfunctions-tasks');
import * as ASC from '@aws-cdk/aws-autoscaling';
import * as ELB from '@aws-cdk/aws-elasticloadbalancingv2';
import { IVpc } from '@aws-cdk/aws-ec2';

const PREFIX = "iac-demo-";
const NAME = "Name";

export class ClassicWebStack extends Core.Stack {
    constructor(scope: Core.Construct, id: string, vpcRef: string, vpc: EC2.IVpc, props?: Core.StackProps) {
        super(scope, id, props);

        this.createStepFunctionStates(vpcRef, vpc);
    }

    private createStepFunctionStates(vpcRef: string, vpc: IVpc)
    {
        var asg = new ASC.CfnAutoScalingGroup(this, PREFIX+"asg", {
            maxSize: "4", minSize: "2"
        });
        asg.tags.setTag(NAME, PREFIX+"asg");
    }
}
