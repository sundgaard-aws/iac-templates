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

const PREFIX = "iac-demo-";
const NAME = "Name";

export class ClassicWebStack extends Core.Stack {
    constructor(scope: Core.Construct, id: string, vpcRef: string, vpc: EC2.IVpc, props?: Core.StackProps) {
        super(scope, id, props);
        console.log("region="+props?.env?.region);
        
        this.createAutoScalingGroup(vpcRef, vpc);
        //this.createAutoScalingGroupL2(vpcRef, vpc);
    }

    private createAutoScalingGroup(vpcRef: string, vpc: IVpc)
    {
        //EC2.MachineImage.latestAmazonLinux().getImage(this);
        const amznLinux = EC2.MachineImage.latestAmazonLinux({
            generation: EC2.AmazonLinuxGeneration.AMAZON_LINUX_2
            /*edition: EC2.AmazonLinuxEdition.MINIMAL,
            virtualization: EC2.AmazonLinuxVirt.HVM,
            storage: EC2.AmazonLinuxStorage.GENERAL_PURPOSE,
            cpuType: EC2.AmazonLinuxCpuType.X86_64*/
        });

        console.log("ami-id="+ amznLinux.getImage(this).imageId);
        
        var launchTemplate = new EC2.CfnLaunchTemplate(this, PREFIX+"ltm", {            
            launchTemplateName: PREFIX+"ltm", launchTemplateData: { 
                //imageId: amznLinux.getImage(this).imageId
                instanceType: "t3.micro",
                imageId: "ami-0653812935d0743fe", // Varies per region
                ebsOptimized: false
            }
        });        
        
        var asg = new ASC.CfnAutoScalingGroup(this, PREFIX+"asg", {
            maxSize: "4", minSize: "2", autoScalingGroupName: PREFIX+"asg", launchTemplate: { launchTemplateId: launchTemplate.ref, version: "1" }, availabilityZones: this.availabilityZones, desiredCapacity: "2",
            healthCheckType: "ELB", healthCheckGracePeriod: 500, cooldown: "100"
        });        
        asg.tags.setTag(NAME, PREFIX+"asg");
    }

    private createAutoScalingGroupL2(vpcRef: string, vpc: EC2.IVpc) {
        const amznLinux = EC2.MachineImage.latestAmazonLinux({
            generation: EC2.AmazonLinuxGeneration.AMAZON_LINUX_2
            /*edition: EC2.AmazonLinuxEdition.MINIMAL,
            virtualization: EC2.AmazonLinuxVirt.HVM,
            storage: EC2.AmazonLinuxStorage.GENERAL_PURPOSE,
            cpuType: EC2.AmazonLinuxCpuType.X86_64*/
        });

        new ASC.AutoScalingGroup(this, PREFIX+"asg", {
            machineImage: amznLinux, vpc: vpc, instanceType: EC2.InstanceType.of(EC2.InstanceClass.BURSTABLE2, EC2.InstanceSize.MICRO)
        });
    }    
}
