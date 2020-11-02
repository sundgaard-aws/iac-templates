// submit-validation-api
function Program() {
    this.main = function(event) {
        //validateToken(event);        
        return reply(event);
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
                waitSeconds: "5", // Actual input to state machine
                trade: event.trade
            }
        };
        return response;  
    };

    var validateToken = function(event) {
        // Enable CORS
        // https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html
        
        //console.log("event=" + JSON.stringify(event));
        var authorizationCode = "";
        var data = {};
        if(event && event.body) {
            data = JSON.parse(event.body);
            if(data.code) {
                authorizationCode = data.code;
                console.log("authorizationCode="+authorizationCode);
            }
        }
        
        if(data.isin) {
            console.log("isin=" + data.isin);
        }
        
        var requestTokenHost = "octa-trading-auth.sundgaar.people.aws.dev";
        var requestTokenHost = "d13ktxoqrw6uhh.cloudfront.net";
        var requestMethod = "/oauth2/token";
        var HttpUtil = require('./http.js');
        var httpUtil = new HttpUtil();
        httpUtil.getToken(requestTokenHost, requestMethod, authorizationCode);
        var pemPath = "./octa-cognito-pub.pem";
        var fs = require('fs');
        var pem = fs.readFileSync(pemPath, 'utf8');
        
        var aud = "77le7rnm77imc52rpobl1hjgev"; // client id
        var iss = "https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_JE6fUv11r";
        //httpUtil.validateToken(idToken, pem, aud, iss, tokenValidated);
        console.log("ended");        
    };
    
    var tokenValidated = function(token) {
        var decodedUserName = token["cognito:username"];
        var decodedEmail = token["email"];
        console.log("decodedUserName=" + decodedUserName);
        console.log("decodedEmail=" + decodedEmail);
        console.log("Registering new trade in database...");
    };    
}

module.exports=Program;