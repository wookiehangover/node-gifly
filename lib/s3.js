var knox = require('knox');
var config = require('./config');

module.exports = knox.createClient( config.s3 );
