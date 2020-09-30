using Amazon.CDK;
using Amazon.CDK.AWS.EC2;

namespace Dotnet
{
    public class NetworkStack : Stack
    {
        private const string Prefix = "iac-demo-";
        private const string Name = "Name";

        internal NetworkStack(Construct scope, string id, IStackProps props = null) : base(scope, id, props)
        {
            
            var vpc = new Vpc(this, "primary-vpc", new VpcProps {
                Cidr = "10.20.0.0/16"
            });

            var privateSubnetA = new PrivateSubnet(this, "iac-demo-private-subnet-a", new PrivateSubnetProps {
                VpcId = vpc.VpcId, CidrBlock = "10.20.1.0/24"
            });            

            var privateSubnetB = new PrivateSubnet(this, "iac-demo-private-subnet-b", new PrivateSubnetProps {
                VpcId = vpc.VpcId, CidrBlock = "10.20.2.0/24"
            });
            
            Tag.Add(vpc, Name, Prefix+"primary-vpc");
            //var tags = new Tags();
            //new Tags().Add()
            // "iac-demo-primary-vpc"
        }
    }
}
