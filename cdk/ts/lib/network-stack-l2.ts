import * as Core from '@aws-cdk/core';
import EC2 = require('@aws-cdk/aws-ec2');
import { CfnEIP, CfnEIPAssociation, CfnInternetGateway, CfnNatGateway, CfnNetworkInterface, CfnRoute, CfnRouteTable, CfnSubnetNetworkAclAssociation, CfnSubnetRouteTableAssociation, CfnVPCGatewayAttachment } from '@aws-cdk/aws-ec2';
import { MetaData } from './meta-data';

const PREFIX = "iac-demo-";
const NAME = "Name";

export class NetworkStackL2 extends Core.Stack {
    public Vpc:EC2.IVpc;
    private metaData: MetaData;

    constructor(scope: Core.Construct, id: string, metaData: MetaData, props?: Core.StackProps) {
        super(scope, id, props);
        this.metaData = metaData;
        this.createVPC();
        this.createRDSSecurityGroup();
        this.createAPISecurityGroup();
        var lbSecurityGroup = this.createLoadBalancerSecurityGroup();
        this.createWebSecurityGroup(lbSecurityGroup);
    }
    
    private createVPC():EC2.IVpc {
        // Link: https://blog.codecentric.de/en/2019/09/aws-cdk-create-custom-vpc/
        var vpc = new EC2.Vpc(this, PREFIX+"vpc", {
            cidr: "10.20.0.0/16", subnetConfiguration: [
                { cidrMask: 24, name: PREFIX+"private-sne", subnetType: EC2.SubnetType.PRIVATE },
                { cidrMask: 25, name: PREFIX+"public-sne", subnetType: EC2.SubnetType.PUBLIC }
            ],
            maxAzs: 2
        });
        this.Vpc = vpc;
        this.metaData.VPC = vpc;
        
        var publicNacl = this.createPublicNacl(vpc);
        vpc.publicSubnets.forEach( subnet => { subnet.associateNetworkAcl(PREFIX+"public-nacl-assoc", publicNacl) } );
        var privateNacl = this.createPrivateNacl(vpc);
        vpc.privateSubnets.forEach( subnet => { subnet.associateNetworkAcl(PREFIX+"private-nacl-assoc", privateNacl) } );
        
        this.tagVPCResources(vpc);
        
        return vpc;
    }
    
    private createPublicNacl(vpc: EC2.Vpc):EC2.INetworkAcl {
        var publicNacl = new EC2.NetworkAcl(this, PREFIX+"public-nacl", {
            vpc: vpc,
            networkAclName: PREFIX+"public-nacl",
            subnetSelection: {
                subnetType: EC2.SubnetType.PUBLIC
            }
        });
        publicNacl.addEntry(PREFIX+"public-nacl-allow-all-inbound", {
           cidr: EC2.AclCidr.anyIpv4(),
           direction: EC2.TrafficDirection.INGRESS,
           ruleAction: EC2.Action.ALLOW,
           ruleNumber: 500,
           traffic: EC2.AclTraffic.allTraffic(),
           networkAclEntryName: "all-traffic"
        });
        publicNacl.addEntry(PREFIX+"public-nacl-allow-all-outbound", {
           cidr: EC2.AclCidr.anyIpv4(),
           direction: EC2.TrafficDirection.EGRESS,
           ruleAction: EC2.Action.ALLOW,
           ruleNumber: 500,
           traffic: EC2.AclTraffic.allTraffic(),
           networkAclEntryName: "all-traffic"
        });        
        Core.Tags.of(publicNacl).add(NAME, PREFIX+"public-nacl");
        return publicNacl;
    }
    
    private createPrivateNacl(vpc: EC2.Vpc):EC2.INetworkAcl {
        var privateNacl = new EC2.NetworkAcl(this, PREFIX+"private-nacl", {
            vpc: vpc,
            networkAclName: PREFIX+"private-nacl",
            subnetSelection: {
                subnetType: EC2.SubnetType.PRIVATE
            }
        });
        privateNacl.addEntry(PREFIX+"private-nacl-allow-all-inbound", {
           cidr: EC2.AclCidr.anyIpv4(),
           direction: EC2.TrafficDirection.INGRESS,
           ruleAction: EC2.Action.ALLOW,
           ruleNumber: 500,
           traffic: EC2.AclTraffic.allTraffic(),
           networkAclEntryName: "all-traffic"
        });
        privateNacl.addEntry(PREFIX+"private-nacl-deny-inbound-ssh", {
           cidr: EC2.AclCidr.anyIpv4(),
           direction: EC2.TrafficDirection.INGRESS,
           ruleAction: EC2.Action.DENY,
           ruleNumber: 100,
           traffic: EC2.AclTraffic.tcpPort(22),
           networkAclEntryName: "deny-ssh"
        });        
        privateNacl.addEntry(PREFIX+"private-nacl-allow-all-outbound", {
           cidr: EC2.AclCidr.anyIpv4(),
           direction: EC2.TrafficDirection.EGRESS,
           ruleAction: EC2.Action.ALLOW,
           ruleNumber: 500,
           traffic: EC2.AclTraffic.allTraffic(),
           networkAclEntryName: "all-traffic"
        });
        Core.Tags.of(privateNacl).add(NAME, PREFIX+"private-nacl");
        return privateNacl;
    }
    
    private createRDSSecurityGroup(): EC2.ISecurityGroup {
        var postFix = "rds-new-sg";
        var securityGroup = new EC2.SecurityGroup(this, this.metaData.PREFIX+postFix, {
            vpc: this.metaData.VPC,
            securityGroupName: this.metaData.PREFIX+postFix,
            description: this.metaData.PREFIX+postFix,
            allowAllOutbound: true
        });
        
        //if(this.metaData.APISecurityGroup == null) throw new Error("api sec group is null");
        
        //var conns = new EC2.Connections();
        //conns.addSecurityGroup(this.metaData.APISecurityGroup);
        //conns.addSecurityGroup(this.metaData.WebSecurityGroup);
        //securityGroup.connections.allowFrom(conns, EC2.Port.tcp(3306), "Lambda and EC2 to RDS");
        
        //securityGroup.connections.allowFrom(this.metaData.APISecurityGroup, EC2.Port.tcp(3306), "Lambda to RDS");
        //securityGroup.connections.allowFrom(this.metaData.WebSecurityGroup, EC2.Port.tcp(3306), "EC2 to RDS");
        Core.Tags.of(securityGroup).add(this.metaData.NAME, this.metaData.PREFIX+postFix);
        this.metaData.RDSSecurityGroup = securityGroup;
        return securityGroup;
    }     
    
    private createLoadBalancerSecurityGroup(): EC2.ISecurityGroup {
        var postFix = "web-lb-new-sg";
        var securityGroup = new EC2.SecurityGroup(this,this.metaData.PREFIX+postFix, {
            vpc: this.metaData.VPC,
            securityGroupName: this.metaData.PREFIX+postFix,
            description: this.metaData.PREFIX+postFix,
            allowAllOutbound: true
        });
        
        securityGroup.addIngressRule(EC2.Peer.anyIpv4(), EC2.Port.tcp(80), "HTTP from anywhere");
        Core.Tags.of(securityGroup).add(this.metaData.NAME, this.metaData.PREFIX+postFix);
        this.metaData.LBSecurityGroup = securityGroup;
        return securityGroup;
    }    
    
    private createWebSecurityGroup(loadBalancerSecurityGroup:EC2.ISecurityGroup): EC2.ISecurityGroup {
        var postFix = "web-new-sg";
        var securityGroup = new EC2.SecurityGroup(this,this.metaData.PREFIX+postFix, {
            vpc: this.metaData.VPC,
            securityGroupName: this.metaData.PREFIX+postFix,
            description: this.metaData.PREFIX+postFix,
            allowAllOutbound: true
        });
        
        securityGroup.connections.allowFrom(loadBalancerSecurityGroup, EC2.Port.tcp(80));
        securityGroup.connections.allowTo(this.metaData.RDSSecurityGroup, EC2.Port.tcp(3306), "EC2 to RDS");
        Core.Tags.of(securityGroup).add(this.metaData.NAME, this.metaData.PREFIX+postFix);
        this.metaData.WebSecurityGroup = securityGroup;
        return securityGroup;
    }    
    
    private createAPISecurityGroup(): EC2.ISecurityGroup {
        if(this.metaData.APISecurityGroup) throw new Error("API SECGROUP already exists!");
        var postFix = "lambda-api-new-sg";
        var securityGroup = new EC2.SecurityGroup(this, this.metaData.PREFIX+postFix, {
            vpc: this.metaData.VPC,
            securityGroupName: this.metaData.PREFIX+postFix,
            description: this.metaData.PREFIX+postFix,
            allowAllOutbound: true
        });
        
        securityGroup.connections.allowTo(this.metaData.RDSSecurityGroup, EC2.Port.tcp(3306), "Lambda to RDS");
        Core.Tags.of(securityGroup).add(this.metaData.NAME, this.metaData.PREFIX+postFix);
        this.metaData.APISecurityGroup = securityGroup;
        return securityGroup;
    } 
    
    private tagVPCResources(vpc: EC2.Vpc) {
        Core.Tags.of(vpc).add(NAME, PREFIX+"vpc");
        Core.Tags.of(vpc).add(NAME, PREFIX+"igw", { includeResourceTypes: [EC2.CfnInternetGateway.CFN_RESOURCE_TYPE_NAME] });
        Core.Tags.of(vpc).add(NAME, PREFIX+"nat", { includeResourceTypes: [EC2.CfnNatGateway.CFN_RESOURCE_TYPE_NAME]});
        Core.Tags.of(vpc).add(NAME, PREFIX+"default-nacl", { includeResourceTypes: [EC2.CfnNetworkAcl.CFN_RESOURCE_TYPE_NAME]});
        var defaultNacl = EC2.NetworkAcl.fromNetworkAclId(vpc, PREFIX+"vpc", vpc.vpcDefaultNetworkAcl);
        Core.Tags.of(defaultNacl).add(NAME, PREFIX+"default-nacl-new");
        
        Core.Tags.of(vpc).add(NAME, PREFIX+"default-sg", { includeResourceTypes: [EC2.CfnSecurityGroup.CFN_RESOURCE_TYPE_NAME]});
        
        vpc.publicSubnets.forEach( subnet => {
            Core.Tags.of(subnet).add(NAME, PREFIX+"public-sne", { includeResourceTypes: [EC2.CfnSubnet.CFN_RESOURCE_TYPE_NAME]});
            Core.Tags.of(subnet).add(NAME, PREFIX+"public-rt", { includeResourceTypes: [EC2.CfnRouteTable.CFN_RESOURCE_TYPE_NAME]});
            Core.Tags.of(subnet).add(NAME, PREFIX+"public-nacl", { includeResourceTypes: [EC2.CfnNetworkAcl.CFN_RESOURCE_TYPE_NAME]});
        });
        
        vpc.privateSubnets.forEach( subnet => {
            Core.Tags.of(subnet).add(NAME, PREFIX+"private-sne", { includeResourceTypes: [EC2.CfnSubnet.CFN_RESOURCE_TYPE_NAME]});
            Core.Tags.of(subnet).add(NAME, PREFIX+"private-rt", { includeResourceTypes: [EC2.CfnRouteTable.CFN_RESOURCE_TYPE_NAME]});
            Core.Tags.of(subnet).add(NAME, PREFIX+"private-nacl", { includeResourceTypes: [EC2.CfnNetworkAcl.CFN_RESOURCE_TYPE_NAME]});
        });
        
        vpc.isolatedSubnets.forEach( subnet => {
            Core.Tags.of(subnet).add(NAME, PREFIX+"isolated-sne", { includeResourceTypes: [EC2.CfnSubnet.CFN_RESOURCE_TYPE_NAME]});
            Core.Tags.of(subnet).add(NAME, PREFIX+"isolated-rt", { includeResourceTypes: [EC2.CfnRouteTable.CFN_RESOURCE_TYPE_NAME]});
            Core.Tags.of(subnet).add(NAME, PREFIX+"isolated-nacl", { includeResourceTypes: [EC2.CfnNetworkAcl.CFN_RESOURCE_TYPE_NAME]});
        });
    }
}
