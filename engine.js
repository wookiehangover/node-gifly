/*jshint latedef: false, curly: false */
module.exports = Engine;

var engine = require('engine.io');
var redis = require('redis');
var config = require('./config.js');

function Engine( server, logger ){

  var io = engine.attach( server );
  var r = config.redis;
  var uploads = redis.createClient(r.port, r.host, r);
  if( r.auth ) uploads.auth(r.auth);

  uploads.subscribe('uploads');
  uploads.setMaxListeners(0);

  io.on('connection', function( socket ){

    function onMessage( channel, message ){
      socket.send(message);
    }

    uploads.on('message', onMessage);

    socket.on('close', function(){
      logger.log(config.logglyToken, 'Socket Connection Closed');
      uploads.removeListener('message', onMessage);
    });

  });

  process.on('exit', function(){
    console.log('Engine::closing redis client');
    try { uploads.quit(); } catch (e) {
      console.error('error quitting redis client', e);
      uploads.close();
    }
  });

}
