import * as SDK from 'aws-sdk';

var bucketName = 'iac-demo-build-bucket-s3';
console.log("Deleting ${bucketName}...");
// We can't delete a bucket before emptying its contents

const s3Client = new SDK.S3();
var allS3ObjectKeys = [];
var s3Config = { Bucket: bucketName, MaxKeys: 1000 };

s3Client.listObjectsV2(s3Config, function(err, data) {
  if (err) {
    console.log(err, err.stack); // an error occurred
  } 
  else 
  {
    var contents = data.Contents;
    if(contents) {
      contents.forEach(function (content) {
        allS3ObjectKeys.push(content.Key);
        s3Client.listObjectVersions({ Bucket: bucketName, Prefix: content.Key}, function(err, data) {
          /*var contents = data.Contents;
          if(contents) {
            contents.forEach(function (content) {
            allS3ObjectKeys.push(content.Key);
          });*/
      });
    });

    /*if (data.IsTruncated) {
        params.ContinuationToken = data.NextContinuationToken;
        console.log("get further list...");
        listAllKeys();
    }*/
    }
  }
});