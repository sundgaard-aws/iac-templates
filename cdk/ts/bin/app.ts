#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DummyStack } from '../lib/dummy-stack';
import { NetworkStack } from '../lib/network-stack';
import { env } from 'process';

const app = new cdk.App();
var props = {env: {account: process.env["CDK_DEFAULT_ACCOUNT"], region: process.env["CDK_DEFAULT_REGION"] } };
new NetworkStack(app, 'NetworkStack', props);
new DummyStack(app, 'DummyStack', props);
