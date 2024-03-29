using Amazon.CDK;
using Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.S3;
using Constructs;

namespace Dotnet
{
    public class ServerlessWebAppStack : Stack
    {
        internal ServerlessWebAppStack(Construct scope, string id, IStackProps props = null) : base(scope, id, props)
        {
            var bucket = new Bucket(this, Program.PREFIX + "static-web-bucket", new BucketProps {
                Versioned = true, BucketName = "iac-demo-static-web-bucket", Encryption = BucketEncryption.S3_MANAGED
            });

            /*new Function(this, Program.PREFIX + "lam", new FunctionProps {
                FunctionName = Program.PREFIX + "static-web-bucket"
            });*/
        }
    }
}
