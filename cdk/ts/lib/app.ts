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
import { runInNewContext } from 'vm';

const app = new cdk.App();
const PREFIX = "iac-demo-";
var props = {env: {account: process.env["CDK_DEFAULT_ACCOUNT"], region: process.env["CDK_DEFAULT_REGION"] } };
var metaData = new MetaData();
var networkStack = new NetworkStack(app, 'DemoNetworkStack', metaData, props);

metaData.VPC = EC2.Vpc.fromLookup(networkStack, "VPC", {
    isDefault: false, vpcName: PREFIX + "primary-vpc"//, tags: {"Name": PREFIX+"primary-vpc"}
});
metaData.VPCRef = networkStack.VPCRef;
metaData.PublicSubnets = networkStack.publicSubnets;

console.log("vpc-id="+metaData.VPC.vpcId);
metaData.VPC.privateSubnets.forEach(privateSubnet => {
    console.log("vpc-private-subnet-subnetId="+privateSubnet.subnetId);
    console.log("vpc-private-subnet-availabilityZone="+privateSubnet.availabilityZone);
    //console.log("vpc-private-subnet-ipv4CidrBlock="+privateSubnet.ipv4CidrBlock);
});
metaData.VPC.publicSubnets.forEach(publicSubnet => {
    console.log("vpc-publicSubnet-subnet-subnetId="+publicSubnet.subnetId);
    console.log("vpc-publicSubnet-subnet-availabilityZone="+publicSubnet.availabilityZone);
    //console.log("vpc-private-subnet-ipv4CidrBlock="+privateSubnet.ipv4CidrBlock);
});

new WorkflowStack(app, 'DemoWorkflowStack', metaData, props);
new ClassicWebStack(app, 'DemoClassicWebStack', metaData, props);
new DummyStack(app, 'DemoDummyStack', props);
