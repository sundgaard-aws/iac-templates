const AWS = require("aws-sdk");
const mysql = require('mysql');
const { getuid } = require("process");

// https://stackoverflow.com/questions/49907830/aws-lambda-function-times-out-when-i-require-aws-sdk-module/52009185
// update-status-api-lam
function Program() {
    var finalCallback;
    
    this.main = function(event, context, callback) {
        console.log("region=" + process.env.AWS_REGION);
        printInputEvent(event);
        finalCallback = callback;
        writeToDB(event);
    };
    
    var printInputEvent = function(event) {
        //console.log("event=" + JSON.stringify(event));
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
                  updateTradeStatus(event, conn, event);
                });
            });
        });
    };
    
    // https://www.tutorialkart.com/nodejs/nodejs-mysql-insert-into/
    var updateTradeStatus = function(event, conn, event) {
        var validationStatus = event.trade.TradeStatus; //"VALID";
        var tradeId = event.trade.TradeId; //"100";
        console.log("Updating trade validation status for trade [" + event.trade.TradeId + "]...");
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
        
        const response = {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Headers" : allowedHeaders,
                "Access-Control-Allow-Origin": allowedOrigin,
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status: "success"}),
            refinedInput: { 
                trade: event.trade
            }            
            //body: JSON.stringify(reply),
            //guid: "239847329487", // Actual input to state machine
            //status: "SUCCEEDED"
        };
        finalCallback(null, response, "Done.");
    };
}

module.exports=Program;
