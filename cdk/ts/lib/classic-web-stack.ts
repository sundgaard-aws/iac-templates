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
import { MetaData } from './meta-data';
import { CfnListener, CfnLoadBalancer, CfnTargetGroup } from '@aws-cdk/aws-elasticloadbalancingv2';

const PREFIX = "iac-demo-";
const NAME = "Name";

export class ClassicWebStack extends Core.Stack {
    private targetGroup: ELB.CfnTargetGroup;
    constructor(scope: Core.Construct, id: string, metaData: MetaData, props?: Core.StackProps) {
        super(scope, id, props);
        console.log("region="+props?.env?.region);
        
        this.createLoadBalancer(metaData);
        this.createAutoScalingGroup(metaData);
        //this.createAutoScalingGroupL2(vpcRef, vpc);
    }

    private createLoadBalancer(metaData: MetaData) {
        this.targetGroup = new CfnTargetGroup(this, PREFIX+"web-tg", {
            port: 80, protocol: "HTTP", vpcId: metaData.VPC.vpcId, name: PREFIX+"web-tg",
            healthCheckEnabled: true, healthCheckPath: "/health.html", healthCheckPort: "80"
        });
        this.targetGroup.tags.setTag(NAME, PREFIX+"web-tg");

        var alb = new CfnLoadBalancer(this, PREFIX+"web-alb", {
            //name: PREFIX+"web-alb", type: "application",
            ipAddressType: "ipv4",            
            //subnets: [metaData.VPC.privateSubnets[0].subnetId, metaData.VPC.privateSubnets[1].subnetId],
            subnets: [metaData.PublicSubnets[0].ref, metaData.PublicSubnets[1].ref],
            scheme: "internet-facing" // internal | internet-facing            
            //subnetMappings: 
        });
        alb.tags.setTag(NAME, PREFIX+"web-alb");

        var listener = new CfnListener(this, PREFIX+"http-listener", {
            port: 80, protocol: "HTTP", loadBalancerArn: alb.ref,             
            defaultActions: [
                {
                    type: "redirect",
                    redirectConfig: {
                      protocol: "HTTPS",
                      host: "#{host}",
                      path: "/#{path}",
                      query: "#{query}",
                      port: "443",
                      statusCode: "HTTP_301"
                    }
                }
            ]
        });
    }

    private createAutoScalingGroup(metaData: MetaData)
    {
        var ami = this.getAMI();
        console.log("ami-id="+ ami.getImage(this).imageId);
        
        var launchTemplate = new EC2.CfnLaunchTemplate(this, PREFIX+"ltm", {            
            launchTemplateName: PREFIX+"ltm", launchTemplateData: { 
                //imageId: amznLinux.getImage(this).imageId
                instanceType: "t3.micro",
                imageId: "ami-0653812935d0743fe", // Varies per region
                ebsOptimized: false,
                userData: this.buildHttpServer()
            }
        });        
        
        var asg = new ASC.CfnAutoScalingGroup(this, PREFIX+"asg", {
            maxSize: "4", minSize: "2", autoScalingGroupName: PREFIX+"asg", launchTemplate: { launchTemplateId: launchTemplate.ref, version: "1" },             
            desiredCapacity: "2",
            healthCheckType: "ELB", healthCheckGracePeriod: 5, cooldown: "30",
            availabilityZones: [metaData.VPC.privateSubnets[0].availabilityZone, metaData.VPC.privateSubnets[1].availabilityZone],
            vpcZoneIdentifier: [metaData.VPC.privateSubnets[0].subnetId, metaData.VPC.privateSubnets[1].subnetId],
            targetGroupArns: [this.targetGroup.ref]
            // loadBalancerNames: only for classic LBs            
        });        
        asg.tags.setTag(NAME, PREFIX+"asg");
    }

    private buildHttpServer(): string | undefined {
        var commandText = 
        "yum update -y" +
        "yum install httpd" +        
        "echo \"<html><body><h1>Welcome to the IaC Demo Web Site</h1></body></html>\" > /var/www/html/index.html" +
        "echo \"OK\" > /var/www/html/health.html" +
        "systemctl start httpd" +
        "systemctl enable httpd.service";
        return Core.Fn.base64(commandText);
    }

    private getAMI() {
        //EC2.MachineImage.latestAmazonLinux().getImage(this);
        const amznLinux = EC2.MachineImage.latestAmazonLinux({
            generation: EC2.AmazonLinuxGeneration.AMAZON_LINUX_2
            /*edition: EC2.AmazonLinuxEdition.MINIMAL,
            virtualization: EC2.AmazonLinuxVirt.HVM,
            storage: EC2.AmazonLinuxStorage.GENERAL_PURPOSE,
            cpuType: EC2.AmazonLinuxCpuType.X86_64*/
        });
        return amznLinux;
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
