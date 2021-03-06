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
    
    PublicSubnetsL1: EC2.CfnSubnet[];
    PrivateSubnetsL1: EC2.CfnSubnet[];
    LBSecurityGroupL1: EC2.CfnSecurityGroup;
    WebSecurityGroupL1: EC2.CfnSecurityGroup;
    
    AutoScalingGroup: ASC.AutoScalingGroup;
    UseDynamicAutoScalingGroupName: boolean = false;
    AttachAutoScalingToDeploymentGroup: boolean = false;
    APISecurityGroup: EC2.ISecurityGroup;
    LBSecurityGroup: EC2.ISecurityGroup;
    WebSecurityGroup: EC2.ISecurityGroup;
    RDSSecurityGroup: EC2.SecurityGroup;
    constructor() {
    }
    
}
