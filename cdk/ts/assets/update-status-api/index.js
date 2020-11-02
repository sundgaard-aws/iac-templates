exports.mainHandler = function(event, context, callback) {
    var Program = require('./program.js');
    var program = new Program();
    return program.main(event, context, callback);
};
