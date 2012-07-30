// var dfd = require('underscore.deferred').Deferred;
var redis = require('redis');
var client = exports.client = redis.createClient();
var crypto = require('crypto');

client.on('error', function( err ){
  console.error('Redis Error: '+ err);
});

exports.create = function( data, cb ){

  function saltPassword( user ){
    var salt = uid(25);
    var hash = crypto.createHash('sha256');
    hash.update( user.username + user.password + salt );

    return [ hash.digest('hex'), salt ];
  }

  function uid(len) {
    return crypto.randomBytes(Math.ceil(len * 3 / 4))
      .toString('base64')
      .slice(0, len);
  }

  var hash = [ 'user:'+ data.username ];
  var user = data;

  if( !user.password ){
    return cb('Must provide a password');
  } else {
    var salted = saltPassword( data );
    user.password = salted[0];
    user.salt = salted[1];
  }

  if( !user.email ){
    return cb('Must provide an email');
  }

  user.createdAt = user.modifiedAt = +new Date;

  for(var i in user){
    if( data.hasOwnProperty(i) )
      hash.push(i) && hash.push(user[i]);
  }

  client.exists( hash[0], function( err, res ){
    if( res === 1 ){
      cb('You must provide a unique username');
    } else {
      client.hmset(hash, cb);
    }
  });
};

exports.get = function( username, cb ){
  client.hgetall( 'user:' + username, function( err, res ){
    var user = res;
    delete user.salt;
    delete user.password;
    cb( err, user );
  });
};

exports.update = function( username, data, cb ){
  
};

exports.authenticate = function( username, password, cb ){
  client.hmget('user:'+ username, 'password', 'salt', function(err, res){
    var hash = crypto.createHash('sha256');
    hash.update( username + password + res[1] );

    if( hash.digest('hex') === res[0] ){
      cb( null, true );
    } else {
      cb('Authentication Failure');
    }
  });
};
