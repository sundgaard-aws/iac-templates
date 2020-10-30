clear
echo Compressing function code...
zip -rq invoke-sfn-api.zip .
echo Uploading to Lambda...
aws lambda update-function-code --function-name iac-demo-invoke-sfn-api-lam --zip-file fileb://invoke-sfn-api.zip
echo Cleaning up...
rm invoke-sfn-api.zip
echo Done.

#aws s3 cp invoke-sfn-api.zip s3://iac-demo-lambda-code-bucket
#rm invoke-sfn-api.zip

# Upload to Lambda
#s3://iac-demo-lambda-code-bucket/invoke-sfn-api.zip