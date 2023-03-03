import { Bucket } from "@aws-cdk/aws-s3/lib";
import { Construct, Tags } from "@aws-cdk/core";
import { v4 } from "uuid";
import { BlockPublicAccess, BucketEncryption } from "@aws-cdk/aws-s3/lib/bucket";
import { MyCompanyBaseConstruct, MyCompanyMandatoryProps } from "./my-company-base-construct";
import { MetaData } from "./meta-data";
import { IKey } from '@aws-cdk/aws-kms';

export class MyCompanyBucketProps extends MyCompanyMandatoryProps {
  public bucketName:string;
  public encryptionKey:IKey;
}

export class MyCompanyBucket extends MyCompanyBaseConstruct {
  constructor(scope: Construct, id: string, props: MyCompanyBucketProps) {
    super(scope, id, props);
    if(props.bucketName==null) throw("Specifying the bucketName is mandatory!");
    if(props.encryptionKey==null) throw("Specifying the encryption key is mandatory in this company!");

    var keyAlias=props.encryptionKey.addAlias(v4().toString());
    var name = props.appCode+"some-data-s3";
    var bucket = new Bucket(this, name, {
        bucketName: props.appCode+props.bucketName,
        encryptionKey: keyAlias,
        encryption: BucketEncryption.KMS,
        publicReadAccess: false,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL
    });
    Tags.of(bucket).add(MetaData.NAME, name);
  }
}