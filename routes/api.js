var redis = require('redis');
var config = require('../config');

var r = config.redis;
var client = exports.client = redis.createClient(r.port, r.host, r);
if( r.auth ) config.redis.client.auth(r.auth);

function getMedia(params, cb){
  var multi = client.multi();

  var per_page = params && params.per_page ? params.per_page : 12;
  var page = params && params.p > 1 ? params.p : 1;
  var end = page * per_page;
  var start = end - per_page;

  client.zrevrange('uploads:global', start, end, function(err, set){
    set.forEach(function(upload){
      multi.hgetall(upload);
    });

    multi.exec(cb);
  });
}

module.exports = function( router ){

  router.add('api/media', function(req, res, params ){

    getMedia( params, function( err, results ){
      res.json(results, 200);
    });

  });

  router.add('', function( req, res, params ){

    getMedia( params, function( err, results ){
      res.template('index.ejs', { gifs: results });
    });

  });

};
