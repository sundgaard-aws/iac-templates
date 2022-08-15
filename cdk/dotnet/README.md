# Welcome to this sample AWS CDK C# project!
This project serves as a sample IaC project using the AWS C# CDK. It will deploy a number of lambda functions, and a step functions workflow.

To deploy the app run ```cdk deploy --all``` or ```npx cdk deploy --all```. If this is the first time you use the CDK you will need to bootstrap the CDK environment first by running ```cdk bootstrap```.

## Useful commands

* `dotnet build src` compile this app
* `cdk deploy`       deploy this stack to your default AWS account/region
* `cdk diff`         compare deployed stack with current state
* `cdk synth`        emits the synthesized CloudFormation template

## Other notes
``` sh
# This project was created using
cdk init --language csharp
```