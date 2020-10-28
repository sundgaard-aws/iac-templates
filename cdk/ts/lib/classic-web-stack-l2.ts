import * as Core from '@aws-cdk/core';
import EC2 = require('@aws-cdk/aws-ec2');
import IAM = require("@aws-cdk/aws-iam");
import S3 = require('@aws-cdk/aws-s3');
import SQS = require('@aws-cdk/aws-sqs');
import Lambda = require('@aws-cdk/aws-lambda');
import StepFunctions = require('@aws-cdk/aws-stepfunctions');
import StepFunctionsTasks = require('@aws-cdk/aws-stepfunctions-tasks');
import * as ASC from '@aws-cdk/aws-autoscaling';
import * as ELB from '@aws-cdk/aws-elasticloadbalancingv2';
import { InstanceType, IVpc } from '@aws-cdk/aws-ec2';
import { MetaData } from './meta-data';
import { CfnListener, CfnLoadBalancer, CfnTargetGroup } from '@aws-cdk/aws-elasticloadbalancingv2';

export class ClassicWebStackL2 extends Core.Stack {
    private targetGroup: ELB.CfnTargetGroup;
    
    constructor(scope: Core.Construct, id: string, metaData: MetaData, props?: Core.StackProps) {
        super(scope, id, props);
        console.log("region="+props?.env?.region);
        
        this.createLoadBalancer(metaData);
        this.createAutoScalingGroup(metaData);
        //this.createAutoScalingGroupL2(vpcRef, vpc);
    }
    
    private createAutoScalingGroup(metaData: MetaData) {
        const amznLinux = EC2.MachineImage.latestAmazonLinux({
            generation: EC2.AmazonLinuxGeneration.AMAZON_LINUX_2
            /*edition: EC2.AmazonLinuxEdition.MINIMAL,
            virtualization: EC2.AmazonLinuxVirt.HVM,
            storage: EC2.AmazonLinuxStorage.GENERAL_PURPOSE,
            cpuType: EC2.AmazonLinuxCpuType.X86_64*/
        });
        
        var userData = EC2.UserData.custom(this.buildJavaEnabledServer());
        var loadBalancerSecurityGroup = this.buildLoadBalancerSecurityGroup(metaData);

        var asg = new ASC.AutoScalingGroup(this, metaData.PREFIX+"asg", {
            machineImage: amznLinux, 
            vpc: metaData.VPC,
            updateType: ASC.UpdateType.REPLACING_UPDATE,
            securityGroup: this.buildWebSecurityGroup(metaData,loadBalancerSecurityGroup),
            vpcSubnets: { subnets: metaData.VPC.privateSubnets },
            role: this.buildWebRole(metaData),
            instanceType: EC2.InstanceType.of(EC2.InstanceClass.BURSTABLE3, EC2.InstanceSize.MICRO),
            associatePublicIpAddress: false,
            desiredCapacity: 2,
            maxCapacity: 4,
            minCapacity:0,
            autoScalingGroupName: metaData.PREFIX+"asg",
            userData: userData
        });
        Core.Tags.of(asg).add(metaData.NAME, metaData.PREFIX+"asg");
    }
    
    private buildLoadBalancerSecurityGroup(metaData:MetaData): EC2.ISecurityGroup {
        var securityGroup = new EC2.SecurityGroup(this,metaData.PREFIX+"web-lb-sg", {
            vpc: metaData.VPC,
            securityGroupName: metaData.PREFIX+"web-lb-sg",
            description: metaData.PREFIX+"web-lb-sg",
            allowAllOutbound: true
        });
        
        securityGroup.addIngressRule(EC2.Peer.anyIpv4(), EC2.Port.tcp(80), "HTTP from anywhere");
        Core.Tags.of(securityGroup).add(metaData.NAME, metaData.PREFIX+"web-lb-sg");
        return securityGroup;
    }    
    
    private buildWebSecurityGroup(metaData:MetaData, loadBalancerSecurityGroup:EC2.ISecurityGroup): EC2.ISecurityGroup {
        var securityGroup = new EC2.SecurityGroup(this,metaData.PREFIX+"web-sg", {
            vpc: metaData.VPC,
            securityGroupName: metaData.PREFIX+"web-sg",
            description: metaData.PREFIX+"web-sg",
            allowAllOutbound: true
        });
        
        securityGroup.connections.allowFrom(loadBalancerSecurityGroup, EC2.Port.tcp(80));
        
        //webSecurityGroup.addIngressRule(EC2.Peer.anyIpv4(), EC2.Port.tcp(22), 'SSH frm anywhere');
        //securityGroup.addIngressRule(EC2.Peer.prefixList(loadBalancerSecurityGroup.securityGroupId), EC2.Port.tcp(80));
        //securityGroup.addIngressRule(EC2.Peer.ipv4(metaData.VPC.vpcCidrBlock), EC2.Port.allTraffic(), "HTTP from load balancer");
        //webSecurityGroup.addIngressRule(EC2.Peer.ipv4('10.0.0.0/24'), EC2.Port.tcp(5439), 'Redshift Ingress2');
        Core.Tags.of(securityGroup).add(metaData.NAME, metaData.PREFIX+"web-sg");
        return securityGroup;
    }
    
    private buildWebRole(metaData:MetaData): IAM.IRole {
        var webRole = new IAM.Role(this, metaData.PREFIX+"web-role", {
            description: "EC2 Web Role",
            roleName: metaData.PREFIX+"web-role",
            assumedBy: new IAM.ServicePrincipal("ec2.amazonaws.com"),
            managedPolicies: [
                IAM.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2FullAccess"),
                IAM.ManagedPolicy.fromAwsManagedPolicyName("AmazonSQSFullAccess"),
                IAM.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2RoleforAWSCodeDeploy"),
                IAM.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"),
                IAM.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"),
                IAM.ManagedPolicy.fromAwsManagedPolicyName("AWSCodeDeployRole")
            ]
        });
        Core.Tags.of(webRole).add(metaData.NAME, metaData.PREFIX+"web-role");
        return webRole;
    }
    
    private createLoadBalancer(metaData: MetaData) {
        
    }
    
    private buildJavaEnabledServer(): string {
        var commandText = 
        "#!/bin/bash\n" +        
        "yum update -y\n" +
        "cd /tmp\n" +
        "yum install -y https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_amd64/amazon-ssm-agent.rpm\n" +
        "systemctl enable amazon-ssm-agent\n" +
        "systemctl restart amazon-ssm-agent\n" +
        "rpm --import https://yum.corretto.aws/corretto.key" +
        "curl -L -o /etc/yum.repos.d/corretto.repo https://yum.corretto.aws/corretto.repo" +
        "yum update -y" +
        "yum install -y java-11-amazon-corretto-devel" +
        "yum install amazon-ssm-agent";
        return Core.Fn.base64(commandText);
    }    
}
