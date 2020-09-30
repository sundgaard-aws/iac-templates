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
            new DotnetStack(app, "DotnetStack");
            app.Synth();
        }
    }
}
