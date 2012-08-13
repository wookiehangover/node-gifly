var config = require('../config');
var fs = require('fs');
var redis  = require('redis');
var crypto = require('crypto');
var knox = require('knox');

var r = config.redis;
var client = exports.client = redis.createClient(r.port, r.host, r);
if( r.auth ) client.auth(r.auth);

var s3 = knox.createClient( config.s3 );

client.on('error', function(err){
  console.log('Redis Error: '+ err);
});

function save( data, cb ){
  var err_msg;
  if( !data.id ){
    err_msg = "You must provide an ID";
  }
  if( err_msg !== undefined ){
    return cb( err_msg );
  }

  var hash = [ 'upload:'+ data.id ];

  for(var i in data){
    if( data.hasOwnProperty(i) ){
      hash.push(i);
      hash.push(data[i]);
    }
  }

  client.hmset(hash, function(err, status){
    if( err ){
      console.error(err);
      console.trace();
    }
    cb(err, status, data);
  });
}

exports.create = function( data, cb ){
  data.createdAt = data.modifiedAt = +new Date();
  save( data, cb );
};

exports.update = function( data, cb ){
  data.modifiedAt = +new Date();
  save( data, cb );
};

