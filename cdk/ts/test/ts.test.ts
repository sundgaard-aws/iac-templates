import { expect as expectCDK, matchTemplate, MatchStyle, haveResource, anything } from '@aws-cdk/assert';
import * as assert from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as ds from '../lib/dummy-stack';
import * as ns from '../lib/network-stack';
import * as cws from '../lib/classic-web-stack';
import { MetaData } from '../lib/meta-data';
import EC2 = require('@aws-cdk/aws-ec2');

test('Empty Stack', () => {
    const app = new cdk.App();
    const PREFIX = "iac-demo-";
    // WHEN    
    //var props = {env: {account: process.env["CDK_DEFAULT_ACCOUNT"], region: process.env["CDK_DEFAULT_REGION"] } };
    var props = {env: {account: "CDK_DEFAULT_ACCOUNT", region: "eu-north-1" } };
    var metaData = new MetaData();

    const networkStack = new ns.NetworkStack(app, 'NetworkTestStack', props);
    metaData.VPC = EC2.Vpc.fromLookup(networkStack, "VPC", {
      vpcName: PREFIX + "primary-vpc", isDefault: false, tags: {"Name": PREFIX+"primary-vpc"}
    });
    metaData.VPCRef = networkStack.VPCRef;
    const classicWebStack = new cws.ClassicWebStack(app, 'ClassicWebTestStack', metaData, props);
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
