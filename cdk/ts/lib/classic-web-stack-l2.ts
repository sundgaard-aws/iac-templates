import UUID = require("uuid");
import * as Core from '@aws-cdk/core';
import EC2 = require('@aws-cdk/aws-ec2');
import IAM = require("@aws-cdk/aws-iam");
import S3 = require('@aws-cdk/aws-s3');
import SQS = require('@aws-cdk/aws-sqs');
import LOGS = require('@aws-cdk/aws-logs');
import Lambda = require('@aws-cdk/aws-lambda');
import StepFunctions = require('@aws-cdk/aws-stepfunctions');
import StepFunctionsTasks = require('@aws-cdk/aws-stepfunctions-tasks');
import * as ASC from '@aws-cdk/aws-autoscaling';
import * as ELBv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import { InstanceType, IVpc } from '@aws-cdk/aws-ec2';
import { MetaData } from './meta-data';
import { CfnListener, CfnLoadBalancer, CfnTargetGroup } from '@aws-cdk/aws-elasticloadbalancingv2';

export class ClassicWebStackL2 extends Core.Stack {
    private metaData: MetaData;
    
    constructor(scope: Core.Construct, id: string, metaData: MetaData, props?: Core.StackProps) {
        super(scope, id, props);
        console.log("region="+props?.env?.region);
        
        this.metaData = metaData;
        this.createLogStream();
        var autoScalingGroup = this.createAutoScalingGroup(metaData);
        metaData.AutoScalingGroup = autoScalingGroup;
        this.createLoadBalancer(metaData, autoScalingGroup);
    }
    
    private createLogStream() {
        const logGroup = new LOGS.LogGroup(this, this.metaData.PREFIX+"web-log-group", {
            retention: LOGS.RetentionDays.ONE_WEEK,
            logGroupName: this.metaData.PREFIX+"web-log-group"
        });
        new LOGS.LogStream(this, this.metaData.PREFIX+"web-log-stream", {
            logGroup: logGroup,
            logStreamName: this.metaData.PREFIX+"web-log-stream",
            removalPolicy: Core.RemovalPolicy.DESTROY
        });
        new LOGS.LogStream(this, this.metaData.PREFIX+"web-err-stream", {
            logGroup: logGroup,
            logStreamName: this.metaData.PREFIX+"web-err-stream",
            removalPolicy: Core.RemovalPolicy.DESTROY
        });
    }
    
    private createLoadBalancer(metaData: MetaData, autoScalingGroup: ASC.AutoScalingGroup) {
        var alb = new ELBv2.ApplicationLoadBalancer(this, metaData.PREFIX+"web-alb", {
           internetFacing: true,
           loadBalancerName: metaData.PREFIX+"web-alb",
           vpc: metaData.VPC,
           vpcSubnets: { subnetType: EC2.SubnetType.PUBLIC },
           securityGroup: this.metaData.LBSecurityGroup
        });
        Core.Tags.of(alb).add(metaData.NAME, metaData.PREFIX+"web-alb");
        
        // Create an AutoScaling group and add it as a load balancing target to the listener.
        var tg = new ELBv2.ApplicationTargetGroup(this, metaData.PREFIX+"web-tg", {
            targets: [autoScalingGroup],
            targetGroupName: metaData.PREFIX+"web-tg",
            port: 80,
            protocol: ELBv2.ApplicationProtocol.HTTP,
            vpc: metaData.VPC
        });
        Core.Tags.of(tg).add(metaData.NAME, metaData.PREFIX+"web-tg");
        //tg.addTarget(autoScalingGroup);*/
        
        const listener = alb.addListener('Listener', {
          port: 80,
          defaultTargetGroups: [tg],
          open: true, // 'open: true' is the default, you can leave it out if you want. Set it to 'false' and use `listener.connections` if you want to be selective about who can access the load balancer.
        });

        /*listener.addTargets('WebFleet', {
          port: 80,
          targets: [autoScalingGroup]
        });*/        
    }
    
    private createAutoScalingGroup(metaData: MetaData): ASC.AutoScalingGroup {
        const amznLinux = EC2.MachineImage.latestAmazonLinux({
            generation: EC2.AmazonLinuxGeneration.AMAZON_LINUX_2
            /*edition: EC2.AmazonLinuxEdition.MINIMAL,
            virtualization: EC2.AmazonLinuxVirt.HVM,
            storage: EC2.AmazonLinuxStorage.GENERAL_PURPOSE,
            cpuType: EC2.AmazonLinuxCpuType.X86_64*/
        });
        
        var userData = EC2.UserData.custom(this.buildJavaEnabledServer());
        // AutoScaling groups can't be updated if the name persists, so we wan't a dynamic name but with a consistent prefix
        
        var asgName = metaData.PREFIX+"web-asg";
        if(metaData.UseDynamicAutoScalingGroupName)
            asgName = metaData.PREFIX+"web-asg-"+UUID.v4();

        var asg = new ASC.AutoScalingGroup(this, metaData.PREFIX+"web-asg", {
            machineImage: amznLinux, 
            vpc: metaData.VPC,
            updateType: ASC.UpdateType.REPLACING_UPDATE,
            securityGroup: this.metaData.WebSecurityGroup,
            vpcSubnets: { subnets: metaData.VPC.privateSubnets },
            role: this.buildWebRole(metaData),
            instanceType: EC2.InstanceType.of(EC2.InstanceClass.BURSTABLE3, EC2.InstanceSize.MICRO),
            associatePublicIpAddress: false,
            desiredCapacity: 2,
            maxCapacity: 4,
            minCapacity:0,
            autoScalingGroupName: asgName,
            userData: userData,
            healthCheck: ASC.HealthCheck.elb({grace: Core.Duration.seconds(120)})
        });

        Core.Tags.of(asg).add(metaData.NAME, metaData.PREFIX+"web-asg");
        Core.Tags.of(asg).add(metaData.NAME, metaData.PREFIX+"web-ec2", { includeResourceTypes: [EC2.CfnInstance.CFN_RESOURCE_TYPE_NAME] });
        return asg;
    }
    
    private buildWebRole(metaData:MetaData): IAM.IRole {
        var webRole = new IAM.Role(this, metaData.PREFIX+"web-role", {
            description: "EC2 Web Role",
            roleName: metaData.PREFIX+"web-role",
            assumedBy: new IAM.ServicePrincipal("ec2.amazonaws.com"),
            managedPolicies: [
                IAM.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2FullAccess"),
                IAM.ManagedPolicy.fromAwsManagedPolicyName("AmazonSQSFullAccess"),
                IAM.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"),
                IAM.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"),
                IAM.ManagedPolicy.fromManagedPolicyArn(this, "AWSCodeDeployRole", "arn:aws:iam::aws:policy/service-role/AWSCodeDeployRole"),
                IAM.ManagedPolicy.fromManagedPolicyArn(this, "AmazonEC2RoleforAWSCodeDeploy", "arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforAWSCodeDeploy")
            ]
        });
        webRole.addToPolicy(new IAM.PolicyStatement({
          effect: IAM.Effect.ALLOW,
          resources: ["*"],
          actions: ["logs:DescribeLogStreams", "logs:PutLogEvents", "secretsmanager:GetSecretValue"]
        }));
        
        Core.Tags.of(webRole).add(metaData.NAME, metaData.PREFIX+"web-role");
        return webRole;
    }
    
    // https://docs.aws.amazon.com/codedeploy/latest/userguide/codedeploy-agent-operations-install-linux.html
    private buildJavaEnabledServer(): string {
        var commandText = 
        "#!/bin/bash\n" +        
        "yum update -y\n" +
        "cd /tmp\n" +
        "yum install -y https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_amd64/amazon-ssm-agent.rpm\n" +
        "systemctl enable amazon-ssm-agent\n" +
        "systemctl restart amazon-ssm-agent\n" +
        "rpm --import https://yum.corretto.aws/corretto.key\n" +
        "curl -L -o /etc/yum.repos.d/corretto.repo https://yum.corretto.aws/corretto.repo\n" +
        "yum update -y\n" +
        "yum install -y java-11-amazon-corretto-devel\n" +
        "yum install amazon-ssm-agent\n" +
        
        "yum install ruby -y\n" +
        "yum install wget\n" +
        "cd /home/ec2-user\n" +
        "wget https://aws-codedeploy-eu-central-1.s3.eu-central-1.amazonaws.com/latest/install\n" +
        "chmod +x ./install\n" +
        "./install auto\n" +
        "service codedeploy-agent start\n";
        return Core.Fn.base64(commandText);
    }    
}
