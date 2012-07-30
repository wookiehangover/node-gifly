var http = require('http');
var redis = require('redis');
var ramrod = require('ramrod');
var config = require('./lib/config');

// routes
var router = ramrod();

var user = require('./controllers/user');
user( router );

var assets = require('./controllers/assets');
assets( router );

var upload = require('./controllers/upload');
upload( router );

var server = http.createServer(function( req, res ){
  console.log(req.url);
  router.dispatch(req, res);
}).listen(3000);

// realtime engine
var engine = require('engine.io');
var io = engine.attach( server );
var uploads = redis.createClient();

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
