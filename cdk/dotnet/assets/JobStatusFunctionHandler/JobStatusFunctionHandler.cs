using System;
using Amazon.Lambda.Core;

namespace IACDemo.StepFunctions.JobStatus {
    public class FunctionHandler {
        [LambdaSerializer(typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))]
        public Object Invoke(JobStatusInputModel input) {
            return new { 
                tradeId=input.TradeId,
                guid=input.Guid,
                status="SUCCEEDED"
            };
        }
    }   
}