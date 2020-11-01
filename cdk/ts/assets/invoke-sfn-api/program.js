const AWS = require("aws-sdk");
//const {DynamoDB} = require("aws-sdk");
const { getuid } = require("process");
//import * as sfn from '@aws-cdk/aws-stepfunctions';
//const { getHttps } = require('https');

//const {DynamoDB} = require('aws-sdk')
//const s3 = new AWS.S3();

// https://stackoverflow.com/questions/49907830/aws-lambda-function-times-out-when-i-require-aws-sdk-module/52009185
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
            input: JSON.stringify(event)
        }
        
        var stepfunctions = new AWS.StepFunctions();
        console.log("calling start workflow execution...");
        
        var stepFunctionsHandle = stepfunctions.startExecution(params, function (err, data) {
            console.log("inside start execution, waiting for outcome...");
            if (err) {
                console.error('An error occured while executing the step function');
                console.log(err);
            } 
            else {
                console.log('Successfully executed step function');
            }
        });
        
        console.log("At the end of start workflow.");
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
