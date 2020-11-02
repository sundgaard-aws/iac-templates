import * as Core from '@aws-cdk/core';
import EC2 = require('@aws-cdk/aws-ec2');
import S3 = require('@aws-cdk/aws-s3');
import { MetaData } from './meta-data';
import * as RDS from '@aws-cdk/aws-rds';
import * as INC from '@aws-cdk/cloudformation-include';
import * as SSM from '@aws-cdk/aws-ssm';
import * as SM from '@aws-cdk/aws-secretsmanager';
import { SSMHelper } from './ssm-helper';
import { CfnOutput } from '@aws-cdk/core';

// https://docs.aws.amazon.com/cdk/api/latest/docs/aws-rds-readme.html
export class DatabaseStackL2 extends Core.Stack {
    private metaData:MetaData;

    constructor(scope: Core.Construct, id: string, metaData: MetaData, props?: Core.StackProps) {
        super(scope, id, props);

        this.metaData = metaData;
        this.createDatabaseCluster();
    }
    
    private createDatabaseCluster() {
        var defaultDBName = "tradedb";
        var dbUserName = "superman";
        const rdsCluster = new RDS.DatabaseCluster(this, this.metaData.PREFIX+"rds-cluster", {
            engine: RDS.DatabaseClusterEngine.auroraMysql({ version: RDS.AuroraMysqlEngineVersion.VER_5_7_12 }),
            credentials: RDS.Credentials.fromUsername(dbUserName), // Optional - will default to admin
            instanceProps: {
                vpc: this.metaData.VPC,
                instanceType: EC2.InstanceType.of(EC2.InstanceClass.BURSTABLE3, EC2.InstanceSize.SMALL),
                vpcSubnets: {
                    subnetType: EC2.SubnetType.PRIVATE,
                }
            },
            defaultDatabaseName: defaultDBName
        });
 
        var ssmHelper = new SSMHelper();
        ssmHelper.createSSMParameter(this, this.metaData.PREFIX+"rds-hostname", rdsCluster.clusterEndpoint.hostname, SSM.ParameterType.STRING);
        ssmHelper.createSSMParameter(this, this.metaData.PREFIX+"rds-port", rdsCluster.clusterEndpoint.port.toString(), SSM.ParameterType.STRING);
        ssmHelper.createSSMParameter(this, this.metaData.PREFIX+"rds-db-user-name", dbUserName, SSM.ParameterType.STRING);
        ssmHelper.createSSMParameter(this, this.metaData.PREFIX+"rds-default-db", defaultDBName, SSM.ParameterType.STRING);
        if(rdsCluster && rdsCluster.secret && rdsCluster.secret.secretArn && rdsCluster.secret.secretName) {
            new CfnOutput(this, "SecretArnOutput", {description: "SecretArn", value: rdsCluster.secret.secretArn});
            //new CfnOutput(this, "SecretNameOutput", {description: "SecretName", value: rdsCluster.secret.secretName});
            ssmHelper.createSSMParameter(this, this.metaData.PREFIX+"rds-secret-arn", rdsCluster.secret.secretArn, SSM.ParameterType.STRING);
            //ssmHelper.createSSMParameter(this, this.metaData.PREFIX+"rds-secret-name", rdsCluster.secret.secretName, SSM.ParameterType.STRING);
        }
        Core.Tags.of(rdsCluster).add(this.metaData.NAME, this.metaData.PREFIX+"rds-cluster");
        Core.Tags.of(rdsCluster).add(this.metaData.NAME, this.metaData.PREFIX+"rds-cluster-sg", { includeResourceTypes: [EC2.CfnSecurityGroup.CFN_RESOURCE_TYPE_NAME]});
        Core.Tags.of(rdsCluster).add(this.metaData.NAME, this.metaData.PREFIX+"rds-secret", { includeResourceTypes: [SM.CfnSecret.CFN_RESOURCE_TYPE_NAME]});
    }
}