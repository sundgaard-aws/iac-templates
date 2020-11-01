import * as Core from '@aws-cdk/core';
import EC2 = require('@aws-cdk/aws-ec2');
import S3 = require('@aws-cdk/aws-s3');
import { MetaData } from './meta-data';
import * as RDS from '@aws-cdk/aws-rds';
import * as INC from '@aws-cdk/cloudformation-include';

// https://docs.aws.amazon.com/cdk/api/latest/docs/aws-rds-readme.html
export class DatabaseStackL2 extends Core.Stack {
    private metaData:MetaData;

    constructor(scope: Core.Construct, id: string, metaData: MetaData, props?: Core.StackProps) {
        super(scope, id, props);

        this.metaData = metaData;
        this.createDatabaseCluster();
    }
    
    private createDatabaseCluster() {
        const rdsCluster = new RDS.DatabaseCluster(this, this.metaData.PREFIX+"rds-cluster", {
            engine: RDS.DatabaseClusterEngine.auroraMysql({ version: RDS.AuroraMysqlEngineVersion.VER_5_7_12 }),
            credentials: RDS.Credentials.fromUsername("superman"), // Optional - will default to admin
            instanceProps: {
                vpc: this.metaData.VPC,
                instanceType: EC2.InstanceType.of(EC2.InstanceClass.BURSTABLE3, EC2.InstanceSize.MICRO),
                vpcSubnets: {
                    subnetType: EC2.SubnetType.PRIVATE,
                }
            },
            defaultDatabaseName: "tradedb",
            
        });
        Core.Tags.of(rdsCluster).add(this.metaData.NAME, this.metaData.PREFIX+"rds-cluster");
        Core.Tags.of(rdsCluster).add(this.metaData.NAME, this.metaData.PREFIX+"rds-cluster-sg", { includeResourceTypes: [EC2.CfnSecurityGroup.CFN_RESOURCE_TYPE_NAME]});
    }
}