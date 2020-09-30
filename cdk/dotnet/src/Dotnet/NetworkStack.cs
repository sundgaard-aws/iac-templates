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
            // Level 2 constructs
            /*SubnetConfiguration[] conf = new SubnetConfiguration[2];
            conf[0] = new SubnetConfiguration{
                CidrMask = 24, Name = "private-subnet-a", SubnetType = SubnetType.PRIVATE
            };
            conf[1] = new SubnetConfiguration{
                CidrMask = 25, Name = "public-subnet-a", SubnetType = SubnetType.PUBLIC
            };

            var vpc = new Vpc(this, "primary-vpc", new VpcProps {
                Cidr = "10.20.0.0/16", SubnetConfiguration = conf, 
            });*/

            var vpc = new CfnVPC(this, Prefix + "primary-vpc", new CfnVPCProps {
                CidrBlock = "10.20.0.0/16"
            });
            vpc.Tags.SetTag(Name, Prefix + "primary-vpc");
            
            
            var privateSubnetA = new CfnSubnet(this, Prefix + "private-subnet-a", new CfnSubnetProps {
                CidrBlock = "10.20.0.0/24", AvailabilityZone = this.AvailabilityZones[0], VpcId = vpc.Ref
            });
            privateSubnetA.Tags.SetTag(Name, Prefix + "private-subnet-a");

            var privateSubnetB = new CfnSubnet(this, Prefix + "private-subnet-b", new CfnSubnetProps {
                CidrBlock = "10.20.1.0/24", AvailabilityZone = this.AvailabilityZones[1], VpcId = vpc.Ref
            });
            privateSubnetA.Tags.SetTag(Name, Prefix + "private-subnet-b");

            /*var privateSubnetA = new PrivateSubnet(this, "iac-demo-private-subnet-a", new PrivateSubnetProps {
                VpcId = vpc.VpcId, CidrBlock = "10.20.1.0/24",
                AvailabilityZone = this.AvailabilityZones[0]
            });   
            
            /*var privateSubnetA = new PrivateSubnet(this, "iac-demo-private-subnet-a", new PrivateSubnetProps {
                VpcId = vpc.VpcId, CidrBlock = "10.20.1.0/24",
                AvailabilityZone = this.AvailabilityZones[0]
            });            

            var privateSubnetB = new PrivateSubnet(this, "iac-demo-private-subnet-b", new PrivateSubnetProps {
                VpcId = vpc.VpcId, CidrBlock = "10.20.2.0/24",
                AvailabilityZone = this.AvailabilityZones[1]
            });
            
            Tag.Add(vpc, Name, Prefix+"primary-vpc");*/

            //var tags = new Tags();
            //new Tags().Add()
            // "iac-demo-primary-vpc"
        }
    }
}
