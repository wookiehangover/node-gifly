module.exports = Engine;

var redis = require('redis');
var engine = require('engine.io');

function Engine( server ){

  var io = engine.attach( server );
  var uploads = Engine.client = redis.createClient();

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
