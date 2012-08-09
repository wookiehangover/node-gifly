var http = require('http');
var router = require('./router');
var engine = require('./engine');
var decorate = require('./decorators');

var server = http.createServer(function( req, res ){
  decorate(req, res);
  router.dispatch(req, res);
}).listen(3000);

// attach real-time engine
engine( server );

