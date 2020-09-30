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
            new NetworkStack(app, "iac-demo-network-stack");
            new WebAppStack(app, "iac-demo-storage-stack");            
            app.Synth();
        }
    }
}
