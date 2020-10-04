using Amazon.CDK;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Dotnet
{
    sealed class Program
    {
        internal const string PREFIX = "iac-demo-";
        internal const string NAME = "Name";

        public static void Main(string[] args)
        {
            var app = new App();
            var stackProps = new StackProps {
                Env = new Amazon.CDK.Environment { Region = "eu-central-1" }
            };
            var networkStack = new NetworkStack(app, "iac-demo-network-stack", stackProps);
            var webAppStack = new WebAppStack(app, "iac-demo-web-app-stack", networkStack.VpcRef);
            var workflowStack = new WorkflowStack(app, "iac-demo-workflow-stack", networkStack.VpcRef);
            app.Synth();
        }
    }
}
