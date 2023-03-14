#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { MetaData } from './meta-data';
import { TagChecker } from './tag-checker-aspect';
import { env } from 'process';
import EC2 = require('@aws-cdk/aws-ec2');
import { runInNewContext } from 'vm';
import { WorkflowStackL2 } from './workflow-stack-l2';
import { NetworkStackL2 } from './network-stack-l2';
import { ClassicWebStackL2 } from './classic-web-stack-l2';
import { CodeStarStackL2 } from './code-star-stack-l2';
import { DatabaseStackL2 } from './database-stack-l2';
import { Aspects } from '@aws-cdk/core';

const app = new cdk.App();
var props = {env: {account: process.env["CDK_DEFAULT_ACCOUNT"], region: process.env["CDK_DEFAULT_REGION"] } };
var metaData = new MetaData();
metaData.UseDynamicAutoScalingGroupName = false;
metaData.AttachAutoScalingToDeploymentGroup = true;

new NetworkStackL2(app, MetaData.PREFIX+"network-stack", metaData, props);
new DatabaseStackL2(app, MetaData.PREFIX+"database-stack", metaData, props);
new ClassicWebStackL2(app, MetaData.PREFIX+"web-stack", metaData, props);
new WorkflowStackL2(app, MetaData.PREFIX+"workflow-stack", metaData, props);

new CodeStarStackL2(app, MetaData.PREFIX+"codestar-stack-via-yaml", metaData, props);
Aspects.of(app).add(new TagChecker(MetaData.REQUIRED_TAGS));