using System;
using Amazon.Lambda.Core;

namespace IACDemo.StepFunctions.Submit {
    public class FunctionHandler {
        [LambdaSerializer(typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))]
        public Object Invoke() {
            return new { 
                waitSeconds= "5", // Actual input to state machine
                tradeId=100,
                guid=Guid.NewGuid().ToString()
            };
        }
    }   
}