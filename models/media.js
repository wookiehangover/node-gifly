var config = require('../config');
var fs = require('fs');
var knox = require('knox');

var s3 = knox.createClient( config.s3 );

module.exports = function( client ){

  var model = {};

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

  model.get = function( key, cb ){
    client.hmget('upload:'+ key, 'cover_url', cb);
  };

  model.getAll = function( params, cb ){
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
  };

  model.create = function( data, cb ){
    data.createdAt = data.modifiedAt = +new Date();
    save( data, cb );
  };

  model.update = function( data, cb ){
    data.modifiedAt = +new Date();
    save( data, cb );
  };

  model.del = function( data, cb ){

    var multi = client.multi();

    multi.del( 'upload:'+ data.id );
    multi.del('gif:'+ data.hash);
    multi.zrem( 'uploads:global', 'upload:'+ data.id);

    multi.exec(cb);

  };

  return model;

};

