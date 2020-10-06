#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DummyStack } from '../lib/dummy-stack';
import { NetworkStack } from '../lib/network-stack';
import { WorkflowStack } from '../lib/workflow-stack';
import { env } from 'process';

const app = new cdk.App();
var props = {env: {account: process.env["CDK_DEFAULT_ACCOUNT"], region: process.env["CDK_DEFAULT_REGION"] } };
var networkStack = new NetworkStack(app, 'DemoNetworkStack', props);
new WorkflowStack(app, 'DemoWorkflowStack', networkStack.VPCRef, networkStack.L1VPC, props);
new DummyStack(app, 'DemoDummyStack', props);
