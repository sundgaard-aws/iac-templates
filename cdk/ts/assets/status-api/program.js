const { getuid } = require("process");

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
            body: JSON.stringify(reply),
            
            refinedInput: { 
                trade: event.trade
            }
        };
        return response;
    };
}

module.exports=Program;