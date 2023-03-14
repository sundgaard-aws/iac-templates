import EC2 = require('@aws-cdk/aws-ec2');
import * as ASC from '@aws-cdk/aws-autoscaling';


export class MetaData {
    public static readonly PREFIX:string = "iac-demo-";
    public static readonly NAME:string = "Name";
    public static readonly APP_CODE: string = "AppCode";
    public static readonly COST_CENTER: string = "CostCenter";
    public static readonly REQUIRED_TAGS: string[] = [this.APP_CODE, this.COST_CENTER];
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
