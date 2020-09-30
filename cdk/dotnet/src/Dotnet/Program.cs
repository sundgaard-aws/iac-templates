using Amazon.CDK;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Dotnet
{
    sealed class Program
    {
        public static void Main(string[] args)
        {
            var app = new App();
            new NetworkStack(app, "iac-demo-network-stack");
            new DotnetStack(app, "iac-demo-storage-stack");            
            app.Synth();
        }
    }
}
