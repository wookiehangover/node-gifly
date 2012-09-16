/*jshint curly: false */
var config = require('../config');
var ramrod = require('ramrod');
var redis = require('redis');

//
// Ramrod Router instance
//

var router = module.exports = ramrod();

//
// Redis Config
//

var r = config.redis;
var client = redis.createClient(r.port, r.host, r);
if( r.auth ) client.auth(r.auth);

client.on('error', function(err){
  console.log(err);
});

//
// Media Model Routes
//

var media = require('./media');
media( router, client );

//
// Static Assets
//

var assets = require('./assets');
assets( router, client );

//
// User APIs
//

var user = require('./user');
user( router, client );

//
// Upload Endpoints
//

var upload = require('./upload');
upload( router, client );

//
// General APIs
//

var api = require('./api');
api( router, client );

// Blitz.io
router.add('mu-5838535f-4f3e8d3d-3d477ef2-93c7f533', function(req, res){
  res.writeHead(200);
  res.end('42');
});

// List Mods
router.add('api/mods', function(req, res){
  res.json( config.mods );
});

// Catch-all
router.on('*', function(req, res){
  res.error(404);
});

process.on('exit', function(){
  console.log('Router::closing redis client');
  try { client.quit(); } catch (e) {
    console.error('error quitting redis client', e);
    client.close();
  }
});

