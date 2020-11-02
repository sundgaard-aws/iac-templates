const { getuid } = require("process");

//get-validation-status-api
function Program() {
    this.main = function(event) {
        //validateToken(event);        
        return reply(event);
    };
   
    var reply = function(event) {
        var allowedHeaders = "*";
        var allowedOrigin = "*";
        //var allowedOrigin = "https://octa-trading.sundgaar.people.aws.dev";
        
        var trade = event.trade;
        trade.TradeStatus = "VALID";
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
                trade: trade
            }
        };
        return response;
    };
}

module.exports=Program;