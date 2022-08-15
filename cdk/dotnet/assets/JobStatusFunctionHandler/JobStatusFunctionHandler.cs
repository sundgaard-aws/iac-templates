using System;
using Amazon.Lambda.Core;

namespace IACDemo.StepFunctions.JobStatus {
    public class FunctionHandler {
        [LambdaSerializer(typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))]
        public Object Invoke(dynamic input) {
            return new { 
                waitSeconds= "5", // Actual input to state machine
                trade=new { tradeId=100 }
            };
        }
    }   
}