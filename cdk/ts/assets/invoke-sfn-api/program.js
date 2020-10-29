const aws = require("aws-sdk");
const { getuid } = require("process");

function Program() {
    this.main = function(event) {
        //validateToken(event);
        startWorkflow(event);
        return reply(event);
    };
    
    var startWorkflow = function(event) {
        // TODO Replace region and account
        var params = {
            stateMachineArn: "arn:aws:states:eu-central-1:299199322523:stateMachine:iac-demo-trade-stm",
            input: JSON.stringify({message: "test"})
        }
        
        var stepfunctions = new aws.StepFunctions();
        /*stepfunctions.startExecution(params, function (err, data) {
            if (err) {
                console.log('err while executing step function')
            } else {
                console.log('started execution of step function')
            }
        });*/
    }    
   
    var reply = function(event) {
        var allowedHeaders = "*";
        var allowedOrigin = "*";
        //var allowedOrigin = "https://octa-trading.sundgaar.people.aws.dev";
        
        var reply = {
          userInputDataJson: event
        };
        
        const response = {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Headers" : allowedHeaders,
                "Access-Control-Allow-Origin": allowedOrigin,
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(reply),
            guid: "239847329487", // Actual input to state machine
            status: "SUCCEEDED"
        };
        return response;  
    };
}

module.exports=Program;