#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { MetaData } from './meta-data';
import { DummyStack } from './dummy-stack';
import { NetworkStack } from './network-stack';
import { WorkflowStack } from './workflow-stack';
import { ClassicWebStack } from './classic-web-stack';
import { env } from 'process';
import EC2 = require('@aws-cdk/aws-ec2');

const app = new cdk.App();
const PREFIX = "iac-demo-";
var props = {env: {account: process.env["CDK_DEFAULT_ACCOUNT"], region: process.env["CDK_DEFAULT_REGION"] } };
var networkStack = new NetworkStack(app, 'DemoNetworkStack', props);

var metaData = new MetaData();
metaData.VPC = EC2.Vpc.fromLookup(networkStack, "VPC", {
    vpcName: PREFIX + "primary-vpc", isDefault: false, tags: {"Name": PREFIX+"primary-vpc"}
});
metaData.VPCRef = networkStack.VPCRef;

console.log("vpc-id="+metaData.VPC.vpcId);
metaData.VPC.privateSubnets.forEach(privateSubnet => {
    console.log("vpc-private-subnet-subnetId="+privateSubnet.subnetId);
    console.log("vpc-private-subnet-availabilityZone="+privateSubnet.availabilityZone);
    //console.log("vpc-private-subnet-ipv4CidrBlock="+privateSubnet.ipv4CidrBlock);
});


new WorkflowStack(app, 'DemoWorkflowStack', metaData, props);
new ClassicWebStack(app, 'DemoClassicWebStack', metaData, props);
new DummyStack(app, 'DemoDummyStack', props);
