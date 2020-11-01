#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { MetaData } from './meta-data';
import { env } from 'process';
import EC2 = require('@aws-cdk/aws-ec2');
import { runInNewContext } from 'vm';
import { WorkflowStackL2 } from './workflow-stack-l2';
import { NetworkStackL2 } from './network-stack-l2';
import { ClassicWebStackL2 } from './classic-web-stack-l2';
import { CodeStarStackL2 } from './code-star-stack-l2';
import { DatabaseStackL2 } from './database-stack-l2';

const app = new cdk.App();
var props = {env: {account: process.env["CDK_DEFAULT_ACCOUNT"], region: process.env["CDK_DEFAULT_REGION"] } };
var metaData = new MetaData();
metaData.AttachAutoScalingToDeploymentGroup = true;

var networkStackL2 = new NetworkStackL2(app, metaData.PREFIX+"network-stack", metaData, props);
metaData.VPC = networkStackL2.Vpc;

new DatabaseStackL2(app, metaData.PREFIX+"database-stack", metaData, props);
new ClassicWebStackL2(app, metaData.PREFIX+"web-stack", metaData, props);
new WorkflowStackL2(app, metaData.PREFIX+"workflow-stack", metaData, props);

//new CodeStarStackL2(app, metaData.PREFIX+"code-star-stack", metaData, props);
new CodeStarStackL2(app, metaData.PREFIX+"codestar-stack-via-yaml", metaData, props);
