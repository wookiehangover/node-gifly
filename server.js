var http = require('http');
var fork = require('child_process').fork;
var redis = require('redis');
var RedSess = require('redsess');
var loggly = require('loggly');

var config = require('./config');
var router = require('./routes');
var engine = require('./lib/engine');
var decorate = require('./lib/decorators');

var token = config.logglyToken;
var logger = loggly.createClient(config.loggly);

RedSess.createClient(config.redis);

var server = http.createServer(function( req, res ){
  req.logger = function(msg){
    console.log(msg);
    logger.log(token, msg);
  };
  decorate(req, res);
  router.dispatch(req, res);
});

server.listen(process.env.PORT || 3000, function(){
  console.log('starting node server');
});

// attach real-time engine
engine( server, logger );

// var worker = fork( require('path').resolve(__dirname + '/lib/processor.js') );

// process.on('exit', function closeAll(){

//   RedSess.close();

//   try { engine.client.quit(); } catch (e) {
//     logger.log( token, 'error quitting redis client', e);
//   }

// });

process.on('uncaughtException', function(err){
  console.log('Warning: Uncaught Application Exception:' + err);
  logger.log(token, err);
  console.trace();
});


