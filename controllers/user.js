/*globals WeakMap*/
var config = require('../lib/config');
var connect = require('connect');
var RedisStore = require('connect-redis')(connect);

module.exports = function( router ){

  router.on('before', connect.bodyParser());

  router.on('before', connect.cookieParser(config.secret));

  router.on('before', function( req, res ){
    req.originalUrl = req.url;
    connect.session({ secret: config.secret, store: new RedisStore() })( req, res, function(){} );
    console.log(req.session);
  });

  router.on('before', function( req, res ){
    console.log(req.cookies)
  });

};
