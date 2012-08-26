var http = require('http');
var fork = require('child_process').fork;
var redis = require('redis');
var RedSess = require('redsess');

var config = require('./config');
var router = require('./router');
var engine = require('./engine');
var decorate = require('./decorators');

RedSess.createClient(config.redis);

var server = http.createServer(function( req, res ){
  decorate(req, res);
  router.dispatch(req, res);
});

server.listen(config.port, function(){
  console.info("Listening on %d", config.port);
});

// attach real-time engine
engine( server );

var worker = fork( require('path').resolve(__dirname + '/processor.js'));

process.on('exit', function closeAll(){

  worker.exit(0);

  RedSess.close();

  try { engine.client.quit(); } catch (e) {
    console.error('error quitting redis client', e);
    engine.client.close();
  }

});

process.on('uncaughtException', function(err){
  console.error('Warning: Uncaught Application Exception:' + err, +new Date());
  console.trace();
});


