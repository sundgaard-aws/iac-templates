import * as Core from '@aws-cdk/core';
import EC2 = require('@aws-cdk/aws-ec2');
import S3 = require('@aws-cdk/aws-s3');
import SQS = require('@aws-cdk/aws-sqs');
import Lambda = require('@aws-cdk/aws-lambda');
import StepFunctions = require('@aws-cdk/aws-stepfunctions');
import StepFunctionsTasks = require('@aws-cdk/aws-stepfunctions-tasks');
import * as ASC from '@aws-cdk/aws-autoscaling';
import * as ELB from '@aws-cdk/aws-elasticloadbalancingv2';
import { InstanceType, IVpc } from '@aws-cdk/aws-ec2';


export class MetaData {
    public readonly PREFIX = "iac-demo-";
    public readonly NAME = "Name";
    public VPC: EC2.IVpc;
    public VPCRef: string;
    PublicSubnets: EC2.CfnSubnet[];
    PrivateSubnets: EC2.CfnSubnet[];
    LBSecurityGroup: EC2.CfnSecurityGroup;
    WebSecurityGroup: EC2.CfnSecurityGroup;
    constructor() {
    }
    
}
