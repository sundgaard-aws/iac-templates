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
    
    var dropTableFirst = false;
    var finalCallback;
    
    this.main = function(event, context, callback) {
        console.log("region=" + process.env.AWS_REGION);
        finalCallback = callback;
        writeToDB(event);
    };
    
    var startWorkflow = function(event, conn) {
        
        getSSMParameter("iac-demo-state-machine-arn", function(stateMachineArnParam) {
            console.log("iac-demo-state-machine-arn="+stateMachineArnParam.Value);
            var params = {
                stateMachineArn: stateMachineArnParam.Value,
                input: JSON.stringify(event)
            }
            
            var stepfunctions = new AWS.StepFunctions();
            console.log("calling start workflow execution...");
            
            var stepFunctionsHandle = stepfunctions.startExecution(params, function (err, data) {
                console.log("Inside start execution, waiting for outcome...");
                if (err) {
                    console.error('An error occured while executing the step function');
                    console.log(err);
                    updateTradeStatus(event, conn, "INVALID", "100");
                    throw err;
                } 
                else {
                    updateTradeStatus(event, conn, "VALID", "100");
                    console.log("Successfully executed step function");
                }
            });
            
            console.log("At the end of start workflow.");            
        });
    };
    
    var writeToDB = function(event) {
        getSSMParameter("iac-demo-rds-secret-arn", function(rdsSecretArnParam) {
            console.log("secretArn="+rdsSecretArnParam.Value);
            getSecret(rdsSecretArnParam.Value, function(secret) {
                console.log("host="+secret.host);
                var conn = mysql.createConnection({
                  host     : secret.host,
                  user     : secret.username,
                  password : secret.password,
                  port     : secret.port,
                  database : secret.dbname
                });    
                
                conn.connect(function(err) {
                  if (err) { throw err; }
                  console.log('Connected to database.');
                  dropTable(event, conn);
                });
            });
        });
    };
    
    var dropTable = function(event, conn) {
        if(dropTableFirst) {
            conn.query("DROP TABLE trade;", (err, result, fields) => {
                if (err) throw err;
                console.log("Dropping table trade...");
                createTableIfNotExists(event, conn);
                console.log("Table trade dropped.");
            });
        }
        else createTableIfNotExists(event, conn);
    };    
    
    // https://www.w3schools.com/nodejs/nodejs_mysql_create_table.asp
    // https://stackoverflow.com/questions/8829102/check-if-table-exists-without-using-select-from
    var createTableIfNotExists = function(event, conn) {
        conn.query("SELECT * FROM information_schema.tables WHERE table_name = 'trade' LIMIT 1;", (err, result, fields) => {
            if (err) throw err;
            if(result && result.length > 0) {
                var row = result[0];
                console.log("Table [" + row.TABLE_NAME + "] found, no need to recreate.");
                insertTrades(event, conn);
            }
            else {
                console.log("Creating table [trade] ...");
                conn.query("CREATE TABLE trade (trade_id VARCHAR(255), user_id VARCHAR(255), trade_status VARCHAR(40), trade_isin VARCHAR(20), trade_amount VARCHAR(100), quote VARCHAR(30), trade_date VARCHAR(40) )", function (err, result, fields) {
                    if (err) throw err;
                    console.log(result);
                    console.log("Table [trade] created.");
                    insertTrades(event, conn);
                });  
            }
        });
    };    
    
    // https://www.tutorialkart.com/nodejs/nodejs-mysql-insert-into/
    var insertTrades = function(event, conn) {
        var records = [
            ["100", "User13", "PENDING_VALIDATION", "AMZ", "55", "1700.24", "2020/12/12"]
        ];
        conn.query("INSERT INTO trade (trade_id,user_id,trade_status,trade_isin,trade_amount,quote,trade_date) VALUES ?", [records], function (err, result, fields) {
            if (err) throw err;
            console.log(result);
            startWorkflow(event, conn);
        });
    };
    
    // https://www.tutorialkart.com/nodejs/nodejs-mysql-insert-into/
    var updateTradeStatus = function(event, conn, validationStatus, tradeId) {
        console.log("Updating trade validation status...");
        /*var records = [
            ["100", "User13", "AMZ", "55", "1700.24", "2020/12/12"]
        ];*/
        conn.query("UPDATE trade SET trade_status = ? WHERE trade_id = ?", [validationStatus,tradeId], function (err, result, fields) {
            if (err) throw err;
            console.log(result);
            console.log("Closing DB connection...");
            conn.end();
            console.log("Returning final response from function...");
            reply(event)
        });
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
                if (data && data.SecretString) {
                    secret = JSON.parse(data.SecretString);
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
        finalCallback(null, response, "Done.");
        //return response;  
    };
}

module.exports=Program;
