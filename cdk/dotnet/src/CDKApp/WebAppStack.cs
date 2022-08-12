using System;
using Amazon.CDK;
using Amazon.CDK.AWS.EC2;
using Amazon.CDK.AWS.AutoScaling;
using Amazon.CDK.AWS.ElasticLoadBalancingV2;
using Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.S3;
using Constructs;

namespace Dotnet
{
    public class WebAppStack : Stack
    {
        internal WebAppStack(Construct scope, string id, string vpcRef, IStackProps props = null) : base(scope, id, props)
        {
            
            /*var webServer = new CfnInstance(this, Program.PREFIX+"web-ec2", new CfnInstanceProps {
                
            });*/
            createAutoScalingGroup(vpcRef);
        }

        private void createAutoScalingGroup(string vpcRef)
        {
            var targetGroup = new CfnTargetGroup(this, Program.PREFIX+"web-tg", new CfnTargetGroupProps {
                HealthCheckPath = "/health", VpcId = vpcRef
            });

            var loadBalancer = new CfnLoadBalancer(this, Program.PREFIX+"web-alb", new CfnLoadBalancerProps {
                Type = "application"
            });
        }
    }
}
