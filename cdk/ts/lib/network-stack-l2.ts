import * as Core from '@aws-cdk/core';
import EC2 = require('@aws-cdk/aws-ec2');
import { CfnEIP, CfnEIPAssociation, CfnInternetGateway, CfnNatGateway, CfnNetworkInterface, CfnRoute, CfnRouteTable, CfnSubnetNetworkAclAssociation, CfnSubnetRouteTableAssociation, CfnVPCGatewayAttachment } from '@aws-cdk/aws-ec2';
import { MetaData } from './meta-data';

const PREFIX = "iac-demo-";
const NAME = "Name";

export class NetworkStackL2 extends Core.Stack {
    public VPCRef:string;
    public L1VPC:EC2.IVpc;
    public privateSubnetA:EC2.CfnSubnet;
    public privateSubnetB:EC2.CfnSubnet;
    public publicSubnetA:EC2.CfnSubnet;
    public publicSubnetB:EC2.CfnSubnet;
    public publicSubnets:Array<EC2.CfnSubnet>

    constructor(scope: Core.Construct, id: string, metaData: MetaData, props?: Core.StackProps) {
        super(scope, id, props);
        
        this.createVPC();
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
        
        var publicNacl = this.createPublicNacl(vpc);
        vpc.publicSubnets.forEach( subnet => { subnet.associateNetworkAcl(PREFIX+"public-nacl-assoc", publicNacl) } );
        var privateNacl = this.createPrivateNacl(vpc);
        
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
    
    private tagVPCResources(vpc: EC2.Vpc) {
        Core.Tags.of(vpc).add(NAME, PREFIX+"vpc");
        Core.Tags.of(vpc).add(NAME, PREFIX+"igw", { includeResourceTypes: [EC2.CfnInternetGateway.CFN_RESOURCE_TYPE_NAME]});
        Core.Tags.of(vpc).add(NAME, PREFIX+"nat", { includeResourceTypes: [EC2.CfnNatGateway.CFN_RESOURCE_TYPE_NAME]});
        Core.Tags.of(vpc).add(NAME, PREFIX+"default-nacl", { includeResourceTypes: [EC2.CfnNetworkAcl.CFN_RESOURCE_TYPE_NAME]});
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
