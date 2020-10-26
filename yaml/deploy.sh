clear
echo Deleting old stack...
#aws cloudformation delete-stack --stack-name iac-demo-codestar-stack-via-yaml
#sleep 8
aws cloudformation deploy --template-file codebuild-stack.yaml --stack-name iac-demo-codestar-stack-via-yaml
aws cloudformation describe-stack-events --stack-name iac-demo-codestar-stack-via-yaml --query "StackEvents[*].{Status:ResourceStatus,Reason:ResourceStatusReason,ID:LogicalResourceId}" --output table | grep CREATE_FAILED