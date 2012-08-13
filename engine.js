module.exports = Engine;

var engine = require('engine.io');
var redis = require('redis');
var config = require('./config.js');

function Engine( server ){

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
      console.log('connection closed');
      uploads.removeListener('message', onMessage);
      console.log(uploads.listeners('message').length);
    });

  });

}
