import * as cdk from '@aws-cdk/core';
import EC2 = require('@aws-cdk/aws-ec2');

const PREFIX = "iac-demo-";
const NAME = "Name";

export class DummyStack extends cdk.Stack {
  public L1VPC:EC2.IVpc;
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    this.L1VPC = EC2.Vpc.fromLookup(this, "VPC", {
            vpcName: PREFIX + "primary-vpc"
    });
  }
}
