var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;

exports.expect = function( assertions, cb ){
  var count = 0;
  return function(){
    count += 1;
    if( count === assertions ) cb();
  };
};

exports.request = function( o, sess ){


  var req = _.extend({

    method: 'GET',

    sessionStore: sess || {},

    body: {},

    params: {},

    session: {
      get: function(cb){
        if(cb) cb( null, req.sessionStore );
      },
      set: function( v, cb ){
        req.sessionStore = _.extend( req.sessionStore, v );
        if(cb) cb();
      }
    },

    headers: [],

    connection: {
      remoteAddress: '127.0.0.1'
    }

  }, EventEmitter.prototype, o || {});

  return req;
};

exports.response = function( cb ){

  return {

    template: function(){
      return cb.apply( this, arguments );
    },

    error: function(){
      return cb.apply( this, arguments );
    },

    send: function(){
      return cb.apply( this, arguments );
    },

    end: function(){
      console.trace();
      console.log('end', arguments);
    },

    redirect: function( path ){
      return cb.apply( this, arguments );
    }

  };
};
