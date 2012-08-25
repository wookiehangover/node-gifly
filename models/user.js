module.exports = function( c ){ return new User(c); };
var crypto = require('crypto');
var redis = require('redis');
var PasswordHash = require('phpass').PasswordHash;
var bcrypt = new PasswordHash( 8 );

function User( client ){
  if( !client ){
    throw new Error('You must provide a redis client instance');
  }

  this.client = client;

  this.client.on('error', function( err ){
    console.error('Redis Error: '+ err);
  });
}

var fn = User.prototype;

fn.create = function( data, cb ){

  var self = this;
  var user = data;

  if( user.password !== user.confirmation ){
    return cb('Password and confirmation must match');
  } else {
    delete user.confirmation;
  }

  if( !user.email ){
    return cb('Must provide an email');
  }

  user.createdAt = user.modifiedAt = +new Date();

  user.status = 'unconfirmed';


  this.client.exists( 'user:'+ user.username, function( err, res ){

    if( res === 1 ){
      cb('You must provide a unique username');
    } else {

      if( user.password ){
        self.storePassword( user.username, user.password );
        delete user.password;
      } else {
        return cb('Must provide a password');
      }

      self.update( user, cb );
    }
  });
};

fn.get = function( username, cb ){
  this.client.hgetall( 'user:' + username, function( err, res ){
    var user = res;
    cb( err, user );
  });
};

fn.update = function( data, cb ){

  var hash = [ 'user:'+ data.username ];

  for(var i in data){
    if( data.hasOwnProperty(i) ){
      hash.push(i);
      hash.push(data[i]);
    }
  }

  this.client.hmset(hash, function(err, status){
    if( cb ){
      cb(err, status, data);
    }
  });
};

fn.storePassword = function(username, password, cb){
  var self = this;

  var hash = bcrypt.hashPassword( password );

  this.update({ username: username, password: hash }, function(err, status, data){

    if( err ){
      console.error('Error storing password: '+ err);
      console.trace();
    }

    if( cb ){
      cb( err, status, data );
    }
  });

};

fn.authenticate = function( username, password, cb ){

  this.client.hgetall('user:'+ username, function(err, res){

    if( err ){
      console.error('Error fetching user: '+ username, err);
      console.trace();
      return cb('Error fetching user: '+ username);
    }

    if( !res ){
      return cb('Authentication Failure');
    }

    var hash = res.password;
    var auth = bcrypt.checkPassword( password, hash );

    delete res.password;

    return auth ?
      cb( null, res ) :
      cb('Authentication Failure');
  });

};
