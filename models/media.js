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

  model.create = function( data, cb ){
    data.createdAt = data.modifiedAt = +new Date();
    save( data, cb );
  };

  model.update = function( data, cb ){
    data.modifiedAt = +new Date();
    save( data, cb );
  };


  return model;

};

