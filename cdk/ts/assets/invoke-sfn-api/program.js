const AWS = require("aws-sdk");
const mysql = require('mysql');
//const {DynamoDB} = require("aws-sdk");
const { getuid } = require("process");
//import * as sfn from '@aws-cdk/aws-stepfunctions';
//const { getHttps } = require('https');

//const {DynamoDB} = require('aws-sdk')
//const s3 = new AWS.S3();

// https://stackoverflow.com/questions/49907830/aws-lambda-function-times-out-when-i-require-aws-sdk-module/52009185
function Program() {
    this.main = function(event) {
        console.log("region=" + process.env.AWS_REGION);
        startWorkflow(event);
        writeToDB(event);
        return reply(event);
    };
    
    var startWorkflow = function(event) {
        
        getSSMParameter("iac-demo-state-machine-arn", function(stateMachineArnParam) {
            console.log("iac-demo-state-machine-arn="+stateMachineArnParam.Value);
            var params = {
                stateMachineArn: stateMachineArnParam.Value,
                input: JSON.stringify(event)
            }
            
            var stepfunctions = new AWS.StepFunctions();
            console.log("calling start workflow execution...");
            
            var stepFunctionsHandle = stepfunctions.startExecution(params, function (err, data) {
                console.log("inside start execution, waiting for outcome...");
                if (err) {
                    console.error('An error occured while executing the step function');
                    console.log(err);
                    throw err;
                } 
                else {
                    console.log('Successfully executed step function');
                }
            });
            
            console.log("At the end of start workflow.");            
        });
    };
    
    var writeToDB = function(event) {
        // Fetches a parameter called REPO_NAME from SSM parameter store.
        // Requires a policy for SSM:GetParameter on the parameter being read.
        //var rdsSecretArnParam = getSSMParameter("iac-demo-rds-secret-arn");
        getSSMParameter("iac-demo-rds-secret-arn", function(rdsSecretArnParam) {
            console.log("secretArn="+rdsSecretArnParam.Value);
            getSecret(rdsSecretArnParam.Value, function(secret) {
                console.log("secretObj="+JSON.stringify(secret));
                var connection = mysql.createConnection({
                  host     : secret.host,
                  user     : secret.username,
                  password : secret.password,
                  port     : secret.port
                });    
            });
        });
        
        /*
        connection.connect(function(err) {
          if (err) {
            console.error('Database connection failed: ' + err.stack);
            return;
          }
        
          console.log('Connected to database.');
        });
        
        connection.end();*/
    };
    
    var getSSMParameter = function(parameterName, callback) {
        var ssm = new AWS.SSM({region: process.env.AWS_REGION});
        var ssmParams = { Name: parameterName, WithDecryption: false };
        var param;
        ssm.getParameter(ssmParams, function(err, data) {
            if (err) throw err; // an error occurred
            else {
                console.log(parameterName + "=" + data.Parameter.Value); // successful response
                param = data.Parameter;
                callback(param);
            }
        });
    };
    
    var getSecret = function(secretName, callback) {
        var secretsManager = new AWS.SecretsManager({region: process.env.AWS_REGION});
        var decodedBinarySecret;
        var secret;
        console.log("looking up secretName=" + secretName.toString());
        secretsManager.getSecretValue({SecretId: secretName.toString()}, function(err, data) {
            if (err) {
                if (err.code === 'DecryptionFailureException')
                    // Secrets Manager can't decrypt the protected secret text using the provided KMS key.
                    // Deal with the exception here, and/or rethrow at your discretion.
                    throw err;
                else if (err.code === 'InternalServiceErrorException')
                    // An error occurred on the server side.
                    // Deal with the exception here, and/or rethrow at your discretion.
                    throw err;
                else if (err.code === 'InvalidParameterException')
                    // You provided an invalid value for a parameter.
                    // Deal with the exception here, and/or rethrow at your discretion.
                    throw err;
                else if (err.code === 'InvalidRequestException')
                    // You provided a parameter value that is not valid for the current state of the resource.
                    // Deal with the exception here, and/or rethrow at your discretion.
                    throw err;
                else if (err.code === 'ResourceNotFoundException')
                    // We can't find the resource that you asked for.
                    // Deal with the exception here, and/or rethrow at your discretion.
                    throw err;
                else
                    throw err;
            }
            else {
                // Decrypts secret using the associated KMS CMK.
                // Depending on whether the secret is a string or binary, one of these fields will be populated.
                if ('SecretString' in data) {
                    secret = data.SecretString;
                    callback(secret);
                } else {
                    let buff = new Buffer(data.SecretBinary, 'base64');
                    decodedBinarySecret = buff.toString('ascii');
                    callback(decodedBinarySecret);
                }
            }
        });        
    };
   
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
