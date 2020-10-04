import * as cdk from '@aws-cdk/core';
import EC2 = require('@aws-cdk/aws-ec2');

const PREFIX = "iac-demo-";
const NAME = "Name";

export class NetworkStack extends cdk.Stack {
    
    public VPCRef:string;
    public L1VPC:EC2.IVpc;
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

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

        var privateSubnetA = new EC2.CfnSubnet(this, PREFIX + "private-subnet-a",  {
            cidrBlock: "10.20.0.0/24", availabilityZone: this.availabilityZones[0], vpcId: this.VPCRef
        });
        privateSubnetA.tags.setTag(NAME, PREFIX + "private-subnet-a");

        var privateSubnetB = new EC2.CfnSubnet(this, PREFIX + "private-subnet-b", {
            cidrBlock: "10.20.1.0/24", availabilityZone: this.availabilityZones[1], vpcId: this.VPCRef
        });
        privateSubnetB.tags.setTag(NAME, PREFIX + "private-subnet-b");
    }        
}
