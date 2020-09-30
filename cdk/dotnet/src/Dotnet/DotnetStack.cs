using Amazon.CDK;
using Amazon.CDK.AWS.S3;

namespace Dotnet
{
    public class DotnetStack : Stack
    {
        internal DotnetStack(Construct scope, string id, IStackProps props = null) : base(scope, id, props)
        {
            var bucket = new Bucket(this, "iac-demo-static-web-bucket", new BucketProps {
                Versioned = true
            });
        }
    }
}
