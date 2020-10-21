import cdk = require('@aws-cdk/core');
import { MetaData } from './meta-data';
import ELBN = require('@aws-cdk/aws-elasticbeanstalk');
import S3 = require('@aws-cdk/aws-s3-assets');

const PREFIX = "iac-demo-";
const NAME = "Name";

export class BeanstalkWebStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string,  metaData: MetaData, props?: cdk.StackProps) {
        super(scope, id, props);

        // Construct an S3 asset from the ZIP located from directory up.
        const elbnZip = new S3.Asset(this, PREFIX + "elbn-zip", {
            path: "assets/java-web-app.zip"
        });

        const appName = PREFIX + "app";
        var app = new ELBN.CfnApplication(this, PREFIX + "elbn-app", {
            applicationName: appName
        });

        // Example of some options which can be configured
        const optionSettingProperties: ELBN.CfnEnvironment.OptionSettingProperty[] = [
            {
                namespace: 'aws:autoscaling:launchconfiguration',
                optionName: 'InstanceType',
                value: 't3.micro',
            },
            {
                namespace: 'aws:autoscaling:launchconfiguration',
                optionName: 'IamInstanceProfile',
                // Here you could reference an instance profile by ARN (e.g. myIamInstanceProfile.attrArn)
                // For the default setup, leave this as is (it is assumed this role exists)
                // https://stackoverflow.com/a/55033663/6894670
                value: 'aws-elasticbeanstalk-ec2-role',
            }/*,
            {
                namespace: 'aws:elasticbeanstalk:container:nodejs',
                optionName: 'NodeVersion',
                value: '10.16.3',
            },*/
        ];

        // Create an app version from the S3 asset defined above
        // The S3 "putObject" will occur first before CF generates the template
        const appVersionProps = new ELBN.CfnApplicationVersion(this, PREFIX + "elbn-app-ver-props", {
            applicationName: appName,
            sourceBundle: {
                s3Bucket: elbnZip.s3BucketName,
                s3Key: elbnZip.s3ObjectKey,
            },
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const elbEnv = new ELBN.CfnEnvironment(this, PREFIX + "elbn-env", {
            environmentName: PREFIX + "elbn-env",
            applicationName: app.applicationName || appName,
            // https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/java-getstarted.html
            solutionStackName: "64bit Amazon Linux 2 v4.1.2 running Tomcat 8.5 Corretto 11",
            //solutionStackName: '64bit Amazon Linux 2018.03 v4.11.0 running Node.js',
            optionSettings: optionSettingProperties,
            // This line is critical - reference the label created in this same stack
            versionLabel: appVersionProps.ref,
        });
        // Also very important - make sure that `app` exists before creating an app version
        appVersionProps.addDependsOn(app);
    }
}