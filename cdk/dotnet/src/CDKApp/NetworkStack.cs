using System;
using Amazon.CDK;
using Amazon.CDK.AWS.EC2;

namespace Dotnet
{
    public class NetworkStack : Stack
    {
        public Vpc VPC { get; set; }

        internal NetworkStack(Construct scope, string id, IStackProps props = null) : base(scope, id, props)
        {
            createVPC();
        }

        private IVpc createVPC() {
        // Link: https://blog.codecentric.de/en/2019/09/aws-cdk-create-custom-vpc/
        /*var vpc = new Vpc(this, MetaData.PREFIX+"vpc", {
            cidr: "10.90.0.0/16", subnetConfiguration: [
                { cidrMask: 24, name: MetaData.PREFIX+"private-sne", subnetType: SubnetType.PRIVATE_WITH_NAT },
                { cidrMask: 25, name: MetaData.PREFIX+"public-sne", subnetType: SubnetType.PUBLIC }
            ],
            natGateways: 1,
            maxAzs: 2
        });
        
        var publicNacl = this.createPublicNacl(vpc);
        vpc.publicSubnets.forEach( subnet => { subnet.associateNetworkAcl(MetaData.PREFIX+"public-nacl-assoc", publicNacl) } );
        var privateNacl = this.createPrivateNacl(vpc);
        vpc.privateSubnets.forEach( subnet => { subnet.associateNetworkAcl(MetaData.PREFIX+"private-nacl-assoc", privateNacl) } );        
        this.tagVPCResources(vpc);
        new CfnOutput(this, 'Private Subnet ID', { value: vpc.privateSubnets[0].subnetId });*/
        var vpc = new Vpc(this, Program.PREFIX+"primary-vpc", new VpcProps {
                Cidr = "10.80.0.0/16",
                
                //, SubnetConfiguration = conf
        });
        
        return vpc;
    }

    }
}
