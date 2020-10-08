exports.mainHandler = async function(event, context) {
    var Program = require('./program.js');
    var program = new Program();
    return program.main(event);
};
