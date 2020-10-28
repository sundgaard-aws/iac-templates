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
        
        Core.Tags.of(vpc).add(NAME, PREFIX+"vpc");
        Core.Tags.of(vpc).add(NAME, PREFIX+"igw", { includeResourceTypes: ["AWS::EC2::InternetGateway"]});
        
        vpc.publicSubnets.forEach( subnet => {
            Core.Tags.of(subnet).add(NAME, PREFIX+"public-sne", { includeResourceTypes: ["AWS::EC2::Subnet"]});
            Core.Tags.of(subnet).add(NAME, PREFIX+"public-rt", { includeResourceTypes: ["AWS::EC2::RouteTable"]});
            Core.Tags.of(subnet).add(NAME, PREFIX+"public-nacl", { includeResourceTypes: ["AWS::EC2::NetworkAcl"]});
        });
        
        vpc.privateSubnets.forEach( subnet => {
            Core.Tags.of(subnet).add(NAME, PREFIX+"private-sne", { includeResourceTypes: ["AWS::EC2::Subnet"]});
            Core.Tags.of(subnet).add(NAME, PREFIX+"private-rt", { includeResourceTypes: ["AWS::EC2::RouteTable"]});
            Core.Tags.of(subnet).add(NAME, PREFIX+"private-nacl", { includeResourceTypes: ["AWS:EC2:NetworkAcl"]});
        });
        
        vpc.isolatedSubnets.forEach( subnet => {
            Core.Tags.of(subnet).add(NAME, PREFIX+"isolated-sne", { includeResourceTypes: ["AWS::EC2::Subnet"]});
            Core.Tags.of(subnet).add(NAME, PREFIX+"isolated-rt", { includeResourceTypes: ["AWS::EC2::RouteTable"]});
            Core.Tags.of(subnet).add(NAME, PREFIX+"isolated-nacl", { includeResourceTypes: ["AWS::EC2::NetworkAcl"]});
        });
        
        return vpc;
    }
}
