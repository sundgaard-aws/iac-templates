clear
echo Deleting old stack...

#aws s3 rm s3://iac-demo-build-bucket-s3 --recursive
aws cloudformation delete-stack --stack-name iac-demo-codestar-stack-via-yaml
sleep 10
aws cloudformation deploy --template-file codebuild-stack.yaml --stack-name iac-demo-codestar-stack-via-yaml --capabilities CAPABILITY_NAMED_IAM
aws cloudformation describe-stack-events --stack-name iac-demo-codestar-stack-via-yaml --query "StackEvents[*].{Status:ResourceStatus,Reason:ResourceStatusReason,ID:LogicalResourceId,Time:Timestamp}" --output table
#aws cloudformation describe-stack-events --stack-name iac-demo-codestar-stack-via-yaml --query "StackEvents[*].{Status:ResourceStatus,Reason:ResourceStatusReason,ID:LogicalResourceId,Time:Timestamp}" --output table | grep FAILED