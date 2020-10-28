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
import { NetworkStackL2 } from './network-stack-l2';
import { ClassicWebStackL2 } from './classic-web-stack-l2';

const app = new cdk.App();
var props = {env: {account: process.env["CDK_DEFAULT_ACCOUNT"], region: process.env["CDK_DEFAULT_REGION"] } };
var metaData = new MetaData();

var networkStackL2 = new NetworkStackL2(app, metaData.PREFIX+"network-stack", metaData, props);
metaData.VPC = networkStackL2.Vpc;

new ClassicWebStackL2(app, metaData.PREFIX+"web-stack", metaData, props);
//new WorkflowStack(app, 'DemoWorkflowStack', metaData, props);

