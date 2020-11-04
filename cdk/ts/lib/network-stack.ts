import * as cdk from '@aws-cdk/core';
import EC2 = require('@aws-cdk/aws-ec2');
import { CfnEIP, CfnEIPAssociation, CfnInternetGateway, CfnNatGateway, CfnNetworkInterface, CfnRoute, CfnRouteTable, CfnSubnetNetworkAclAssociation, CfnSubnetRouteTableAssociation, CfnVPCGatewayAttachment } from '@aws-cdk/aws-ec2';
import { MetaData } from './meta-data';

const PREFIX = "iac-demo-";
const NAME = "Name";

export class NetworkStack extends cdk.Stack {
    
    public VPCRef:string;
    public L1VPC:EC2.IVpc;
    public privateSubnetA:EC2.CfnSubnet;
    public privateSubnetB:EC2.CfnSubnet;
    public publicSubnetA:EC2.CfnSubnet;
    public publicSubnetB:EC2.CfnSubnet;
    public publicSubnets:Array<EC2.CfnSubnet>

    constructor(scope: cdk.Construct, id: string, metaData: MetaData, props?: cdk.StackProps) {
        super(scope, id, props);

        this.publicSubnets = new Array<EC2.CfnSubnet>();
        //UsingLevel2Constructs();            
        var vpc = new EC2.CfnVPC(this, PREFIX + "primary-vpc", {
            cidrBlock: "10.20.0.0/16"
        });
        vpc.tags.setTag(NAME, PREFIX + "primary-vpc");
        this.VPCRef = vpc.ref;

        //var vpcId = (string)this.Node.TryGetContext(PREFIX + "primary-vpc");
        
        /*this.L1VPC = EC2.Vpc.fromLookup(this, "VPC", {
            vpcName: PREFIX + "primary-vpc"
        });*/

        /*var L1VPC = Vpc.FromLookup(this, VpcRef, new VpcLookupOptions{
            VpcId = VpcRef
        });*/

        this.privateSubnetA = new EC2.CfnSubnet(this, PREFIX + "private-subnet-a",  {
            cidrBlock: "10.20.0.0/24", availabilityZone: this.availabilityZones[0], vpcId: this.VPCRef
        });
        this.privateSubnetA.tags.setTag(NAME, PREFIX + "private-subnet-a");

        this.privateSubnetB = new EC2.CfnSubnet(this, PREFIX + "private-subnet-b", {
            cidrBlock: "10.20.1.0/24", availabilityZone: this.availabilityZones[1], vpcId: this.VPCRef
        });
        this.privateSubnetB.tags.setTag(NAME, PREFIX + "private-subnet-b");

        this.publicSubnetA = new EC2.CfnSubnet(this, PREFIX + "public-subnet-a",  {
            cidrBlock: "10.20.2.0/25", availabilityZone: this.availabilityZones[0], vpcId: this.VPCRef
        });
        this.publicSubnetA.tags.setTag(NAME, PREFIX + "public-subnet-a");
        this.publicSubnets.push(this.publicSubnetA);

        this.publicSubnetB = new EC2.CfnSubnet(this, PREFIX + "public-subnet-b", {
            cidrBlock: "10.20.3.0/25", availabilityZone: this.availabilityZones[1], vpcId: this.VPCRef
        });
        this.publicSubnetB.tags.setTag(NAME, PREFIX + "public-subnet-b");
        this.publicSubnets.push(this.publicSubnetB);

        var igw = new CfnInternetGateway(this, PREFIX+"igw", {                
        });
        igw.tags.setTag(NAME, PREFIX + "igw");

        new CfnVPCGatewayAttachment(this, PREFIX+"igwa", {
            vpcId: vpc.ref, internetGatewayId: igw.ref
        });

        var publicRouteTable = new CfnRouteTable(this, PREFIX+"public-rt", {
            vpcId: vpc.ref
        });
        publicRouteTable.tags.setTag(NAME, PREFIX + "public-rt");

        var publicIGWRoute = new CfnRoute(this, PREFIX+"public-igw-route", {
            routeTableId: publicRouteTable.ref, destinationCidrBlock: "0.0.0.0/0", gatewayId: igw.ref
        });
        new CfnSubnetRouteTableAssociation(this, PREFIX + "public-subnet-a-rt-assoc", {
            routeTableId: publicRouteTable.ref, subnetId: this.publicSubnetA.ref
        });
        new CfnSubnetRouteTableAssociation(this, PREFIX + "public-subnet-b-rt-assoc", {
            routeTableId: publicRouteTable.ref, subnetId: this.publicSubnetB.ref
        });

        var privateRouteTableA = new CfnRouteTable(this, PREFIX+"private-subnet-a-rt", {
            vpcId: vpc.ref
        });
        privateRouteTableA.tags.setTag(NAME, PREFIX + "private-subnet-a-rt");        
        var privateRouteTableB = new CfnRouteTable(this, PREFIX+"private-subnet-b-rt", {
            vpcId: vpc.ref
        });
        privateRouteTableB.tags.setTag(NAME, PREFIX + "private-subnet-b-rt");

        var publicSubnet_A_NAT_GW_EIP = new CfnEIP(this, PREFIX+"nat-gw-a-eip", {
            domain: "vpc"
        });
        publicSubnet_A_NAT_GW_EIP.tags.setTag(NAME, PREFIX+"nat-gw-a-eip");
        var publicSubnet_B_NAT_GW_EIP = new CfnEIP(this, PREFIX+"nat-gw-b-eip", {
            domain: "vpc"
        });
        publicSubnet_B_NAT_GW_EIP.tags.setTag(NAME, PREFIX+"nat-gw-b-eip");
        var publicSubnetANATGW = new CfnNatGateway(this, PREFIX+"public-subnet-a-nat-gw", {
            subnetId: this.publicSubnetA.ref, allocationId: publicSubnet_A_NAT_GW_EIP.attrAllocationId
        });
        publicSubnetANATGW.tags.setTag(NAME, PREFIX + "public-subnet-a-nat-gw");
        var publicSubnetBNATGW = new CfnNatGateway(this, PREFIX+"public-subnet-b-nat-gw", {
            subnetId: this.publicSubnetB.ref, allocationId: publicSubnet_B_NAT_GW_EIP.attrAllocationId
        });
        publicSubnetBNATGW.tags.setTag(NAME, PREFIX + "public-subnet-b-nat-gw");

        /*new CfnEIPAssociation(this, PREFIX+"nat-gw-a-eip-assoc", {
            eip: publicSubnet_A_NAT_GW_EIP.ref, 
            instanceId: publicSubnetANATGW.ref
            //instanceId: new CfnNetworkInterface(this, PREFIX+"public-subnet-a-nat-eni", {
              //  subnetId: this.publicSubnetA.ref
            //}).ref
            //allocationId: privateSubnetANATGW.allocationId
        });

        new CfnEIPAssociation(this, PREFIX+"nat-gw-b-eip-assoc", {
            eip: publicSubnet_B_NAT_GW_EIP.ref,
            instanceId: publicSubnetBNATGW.ref
            //instanceId: new CfnNetworkInterface(this, PREFIX+"public-subnet-b-nat-eni", {
              //  subnetId: this.publicSubnetB.ref
            //}).ref
            //allocationId: privateSubnetANATGW.allocationId
        });*/     

        new CfnSubnetRouteTableAssociation(this, PREFIX + "private-subnet-a-rt-assoc", {
            routeTableId: privateRouteTableA.ref, subnetId: this.privateSubnetA.ref
        });
        new CfnSubnetRouteTableAssociation(this, PREFIX + "private-subnet-b-rt-assoc", {
            routeTableId: privateRouteTableB.ref, subnetId: this.privateSubnetB.ref
        });
        
        var privateSubnetANATRoute = new CfnRoute(this, PREFIX+"private-subnet-a-nat-route", {
            routeTableId: privateRouteTableA.ref, destinationCidrBlock: "0.0.0.0/0", natGatewayId: publicSubnetANATGW.ref
        });
        var privateSubnetBNATRoute = new CfnRoute(this, PREFIX+"private-subnet-b-nat-route", {
            routeTableId: privateRouteTableB.ref, destinationCidrBlock: "0.0.0.0/0", natGatewayId: publicSubnetBNATGW.ref
        });

        var lbSecurityGroup = new EC2.CfnSecurityGroup(this, PREFIX+"lb-sg", {
            groupName: PREFIX+"lb-sg", groupDescription: PREFIX+"lb-sg", vpcId: vpc.ref, securityGroupIngress: [
                { ipProtocol: "tcp", fromPort: 80, toPort: 80, cidrIp: "0.0.0.0/0" }
            ]
        });        
        lbSecurityGroup.tags.setTag(NAME, PREFIX + "lb-sg");
        metaData.LBSecurityGroupL1 = lbSecurityGroup;

        var webSecurityGroup = new EC2.CfnSecurityGroup(this, PREFIX+"web-sg", {
            groupName: PREFIX+"web-sg", groupDescription: PREFIX+"web-sg", vpcId: vpc.ref, securityGroupIngress: [
                { ipProtocol: "tcp", fromPort: 80, toPort: 80, sourceSecurityGroupId: lbSecurityGroup.ref }
            ]
        });
        webSecurityGroup.tags.setTag(NAME, PREFIX + "web-sg");
        metaData.WebSecurityGroupL1 = webSecurityGroup;
        //CfnSubnetNetworkAclAssociation
    }        
}
