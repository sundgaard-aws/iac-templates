import { MetaData } from "./meta-data";
import { BlockPublicAccess, Bucket, IBucket } from "@aws-cdk/aws-s3/lib";
import { Construct, Tags } from "@aws-cdk/core";
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import { Distribution, OriginAccessIdentity } from '@aws-cdk/aws-cloudfront';
import { S3Origin } from '@aws-cdk/aws-cloudfront-origins';

export class WebAppProps {
    public appCode: string;
}

export class WebApp extends Construct {
    private props: WebAppProps;
    constructor(scope: Construct, id: string, props: WebAppProps) {
        super(scope, id);
        this.props = props;
        if(props.appCode==null) throw("Specifying the appCode is mandatory in this company!");
        var bucket=this.createStaticResourcesBucket();
        this.createDistribution(bucket);
    }

    private createStaticResourcesBucket(): IBucket {
        var name = this.props.appCode + "static-web";
        var bucket = new Bucket(this, name, {
            publicReadAccess: false,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            bucketName: name
        });
        new BucketDeployment(this, this.props.appCode + "web-dep", {
            sources: [Source.asset("../src/static")],
            destinationBucket: bucket
        });

        Tags.of(bucket).add(MetaData.NAME, name);
        Tags.of(bucket).add(MetaData.APP_CODE, this.props.appCode);
        return bucket;
    }

    private createDistribution(staticResourcesBucket: IBucket) {
        var name = this.props.appCode + "cf-dist";
        var s3Origin = new S3Origin(staticResourcesBucket);
        var distribution = new Distribution(this, name, {
            defaultBehavior: { origin: s3Origin },
            defaultRootObject: "index.html"
        });
    }
}