#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DummyStack } from './dummy-stack';
import { NetworkStack } from './network-stack';
import { WorkflowStack } from './workflow-stack';
import { ClassicWebStack } from './classic-web-stack';
import { env } from 'process';
import EC2 = require('@aws-cdk/aws-ec2');

const app = new cdk.App();
var props = {env: {account: process.env["CDK_DEFAULT_ACCOUNT"], region: process.env["CDK_DEFAULT_REGION"] } };
var networkStack = new NetworkStack(app, 'DemoNetworkStack', props);

console.log("vpc-ref="+networkStack.VPCRef);
var L1VPC = EC2.Vpc.fromLookup(networkStack, "VPC", {
    vpcName: "iac-demo-" + "primary-vpc"
});
console.log("vpc-id="+L1VPC.vpcId);

new WorkflowStack(app, 'DemoWorkflowStack', networkStack.VPCRef, networkStack.L1VPC, props);
new ClassicWebStack(app, 'DemoClassicWebStack', networkStack.VPCRef, networkStack.L1VPC, props);
new DummyStack(app, 'DemoDummyStack', props);
