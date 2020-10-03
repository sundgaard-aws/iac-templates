using System;
using Amazon.CDK;
using Amazon.CDK.AWS.EC2;

namespace Dotnet
{
    public class NetworkStack : Stack
    {
        public string VpcRef { get; set; }
        internal NetworkStack(Construct scope, string id, IStackProps props = null) : base(scope, id, props)
        {
            //UsingLevel2Constructs();            
            var vpc = new CfnVPC(this, Program.PREFIX + "primary-vpc", new CfnVPCProps {
                CidrBlock = "10.20.0.0/16"
            });
            vpc.Tags.SetTag(Program.NAME, Program.PREFIX + "primary-vpc");
            VpcRef = vpc.Ref;

            var privateSubnetA = new CfnSubnet(this, Program.PREFIX + "private-subnet-a", new CfnSubnetProps {
                CidrBlock = "10.20.0.0/24", AvailabilityZone = this.AvailabilityZones[0], VpcId = vpc.Ref
            });
            privateSubnetA.Tags.SetTag(Program.NAME, Program.PREFIX + "private-subnet-a");

            var privateSubnetB = new CfnSubnet(this, Program.PREFIX + "private-subnet-b", new CfnSubnetProps {
                CidrBlock = "10.20.1.0/24", AvailabilityZone = this.AvailabilityZones[1], VpcId = vpc.Ref
            });
            privateSubnetB.Tags.SetTag(Program.NAME, Program.PREFIX + "private-subnet-b");
        }

        private void UsingLevel2Constructs()
        {
            // Level 2 constructs
            /*SubnetConfiguration[] conf = new SubnetConfiguration[2];
            conf[0] = new SubnetConfiguration{
                CidrMask = 24, Name = "private-subnet-a", SubnetType = SubnetType.PRIVATE
            };
            conf[1] = new SubnetConfiguration{
                CidrMask = 25, Name = "public-subnet-a", SubnetType = SubnetType.PUBLIC
            };*/

            var vpc = new Vpc(this, "primary-vpc", new VpcProps {
                Cidr = "10.20.0.0/16"
                //, SubnetConfiguration = conf
            });

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
