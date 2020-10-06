import { expect as expectCDK, matchTemplate, MatchStyle, haveResource, anything } from '@aws-cdk/assert';
import * as assert from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as ds from '../lib/dummy-stack';
import * as ns from '../lib/network-stack';
import * as cws from '../lib/classic-web-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN    
    //var props = {env: {account: process.env["CDK_DEFAULT_ACCOUNT"], region: process.env["CDK_DEFAULT_REGION"] } };
    var props = {env: {account: "CDK_DEFAULT_ACCOUNT", region: "eu-north-1" } };
    const networkStack = new ns.NetworkStack(app, 'NetworkTestStack', props);
    const classicWebStack = new cws.ClassicWebStack(app, 'ClassicWebTestStack', networkStack.VPCRef, networkStack.L1VPC, props);
    const dummyStack = new ds.DummyStack(app, 'DummyTestStack', props);

    // THEN
    //expect(classicWebStack).toBe(haveResource("AWS::AutoScaling::AutoScalingGroup", {
    //}));
    expectCDK(classicWebStack).to(haveResource("AWS::AutoScaling::AutoScalingGroup", {
      "MaxSize": "4",
      "LaunchTemplate": "hhh"
    }));
    //expect(classicWebStack).toHaveProperty("launchTemplate");
    
    expectCDK(dummyStack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
