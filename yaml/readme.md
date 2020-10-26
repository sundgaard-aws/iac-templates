# Deploy stack via CLI
clear
aws cloudformation delete-stack --stack-name iac-demo-codestar-stack-via-yaml
sleep 2
aws cloudformation deploy --template-file codebuild-stack.yaml --stack-name iac-demo-codestar-stack-via-yaml
aws cloudformation describe-stack-events --stack-name iac-demo-codestar-stack-via-yaml --query "StackEvents[*].{Status:ResourceStatus,Reason:ResourceStatusReason,ID:LogicalResourceId}" --output table | grep CREATE_FAILED

# Delete stack
aws cloudformation delete-stack --stack-name iac-demo-codestar-stack-via-yaml

# Describe events
aws cloudformation describe-stack-events --stack-name iac-demo-codestar-stack-via-yaml --query "StackEvents[*].{Status:ResourceStatus,Reason:ResourceStatusReason,ID:LogicalResourceId}" --output table | grep CREATE_FAILED
aws cloudformation describe-stack-events --stack-name iac-demo-codestar-stack-via-yaml --query "StackEvents[*].{Status:ResourceStatus,Reason:ResourceStatusReason,ID:LogicalResourceId}" --output table

aws cloudformation describe-stack-events --stack-name iac-demo-codestar-stack-via-yaml --output yaml --query "StackEvents[*].{Status:ResourceStatus,Reason:ResourceStatusReason,ID:LogicalResourceId}"

--filters "ResourceStatus=CREATE_FAILED"

aws cloudformation describe-stack-events --stack-name iac-demo-codestar-stack-via-yaml --output yaml --filters Name=ResourceStatus,Values=CREATE_FAILED

# Query and filter
--query 'Volumes[*].{ID:VolumeId,AZ:AvailabilityZone,Size:Size}'
https://docs.aws.amazon.com/cli/latest/userguide/cli-usage-output.html#cli-usage-output-filter

# Links
https://docs.aws.amazon.com/code-samples/latest/catalog/cloudformation-codepipeline-template-codepipeline-github-events-yaml.yml.html
https://gist.github.com/adebesin/6a9cfaa4b4fa13000dac7e95e09ccb22
https://github.com/bitwalker/distillery-aws-example/blob/master/templates/pipeline.yml
https://github.com/symphoniacloud/github-codepipeline