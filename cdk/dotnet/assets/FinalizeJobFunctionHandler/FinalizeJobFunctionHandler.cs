using System;
using Amazon.Lambda.Core;

namespace IACDemo.StepFunctions.FinalizeJob {
    public class FunctionHandler {
        [LambdaSerializer(typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))]
        public Object Invoke(FinalizeJobInputModel input) {
            return new { 
                tradeId=input.TradeId,
                guid=input.Guid
            };
        }
    }   
}