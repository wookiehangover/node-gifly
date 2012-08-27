module.exports = function( c ){ return new User(c); };
var crypto = require('crypto');
var redis = require('redis');
var PasswordHash = require('phpass').PasswordHash;
var bcrypt = new PasswordHash( 8 );
var config = require('../config');

var nodemailer = require('nodemailer');
var mailer = nodemailer.createTransport(config.mailTransportType, config.mailTransportSettings);


//
// User Model constructor
//
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

  var multi = this.client.multi();

  multi.exists('user:'+ user.username);
  multi.exists('user:email:'+ user.email);

  multi.exec(function(err, res){
    if( res[0] === 1 || res[1] === 1 ){
      cb('You must provide a unique username or password');
    } else {

      if( ! user.password ){
        return cb('Must provide a password');
      }
      user.password = bcrypt.hashPassword( user.password );
      user.status = "new";

      var multi = self.client.multi();
      var hash = [
        'user:email:' + user.email,
        'status', 'new',
        'username', user.username
      ];
      multi.hmset(hash);

      self.update( user, cb, multi );
    }
  });

};


fn.get = function( username, cb ){
  this.client.hgetall( 'user:' + username, function( err, res ){
    var user = res;
    cb( err, user );
  });
};

fn.update = function( data, cb, multi ){

  var hash = [ 'user:'+ data.username ];

  for(var i in data){
    if( data.hasOwnProperty(i) ){
      hash.push(i);
      hash.push(data[i]);
    }
  }

  function onUpdate(err, status){
    if( cb ){
      cb(err, status, data);
    }
  }

  if( multi !== undefined ){
    multi.hmset(hash);
    multi.exec(onUpdate);
  } else {
    this.client.hmset(hash, onUpdate);
  }
};

fn.storePassword = function(username, password, cb){
  var self = this;

  var hash = bcrypt.hashPassword( password );

  this.update({ username: username, password: hash },
              function(err, status, data){

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

    if( res.status !== 'confirmed' ){
      return cb('Please confirm account first');
    }

    var hash = res.password;
    var auth = bcrypt.checkPassword( password, hash );

    delete res.password;

    return auth ?
      cb( null, res ) :
      cb('Authentication Failure');
  });

};

//
// Password Reset Email
//

fn.sendPasswordReset = function( email, cb ){

  var self = this;
  this.client.hgetall('user:email:'+ email, function(err, data){

    if( err ){
      return cb(err);
    }

    if( !data ){
      return cb("Not found");
    }

    if( data.status === 'reset' ){
      // invalidate any un-used resets
    }

    // create reset token
    var token = crypto.randomBytes(30).toString('base64')
                    .split('/').join('_')
                    .split('+').join('-');

    token = sha(token);

    var u = 'http://b.gif.ly/reset/'+ encodeURIComponent(token);

    var reset_options = {
      to: email,
      from: config.from,
      subject: 'Reset your gif.ly password',
      text: 'Looks like you\'ve requested a password reset.\r\n\r\n'+
        'To reset your password, please click on the following link, '+
        'or paste this into your browser to complete the process:\r\n\r\n'+
        '    ' + u + '\r\n\r\n'+
        'If you didn\'t request this or otherwise feel like this has reached '+
        'you in error, this can be safely ignored because it\'s only good for '+
        '15 minutes.\r\n\r\n'+
        'Thanks.\r\n\r\n'+
        '    -- @wookiehangover'
    };

    // save token & username to redis
    var multi = self.client.multi();
    multi.set('pw_reset:'+ token, data.username);
    multi.expires('pw_reset:'+ token, 60 * 30 );

    multi.exec(function(err, result){
      if( err ){
        return cb(err);
      }

      // send password reset email with token link
      mailer.sendMail(reset_options, cb);
    });

  });

};


//
// Confirm User Email
//

fn.confirmEmail = function( token, cb ){
  var self = this;
  this.client.get('email_confirm:'+ token, function(err, username){

    if( err ){
      return cb(err);
    }

    self.client.hmget('user:'+ username, 'status', 'email', function(err, result){
      if( err ){
        return cb(err);
      }

      if( result[0] === 'new' ){
        var multi = self.client.multi();
        // update the email-keyed status
        multi.hmset('user:email:'+ result[1], 'status', 'confirmed');
        // save the updated status on the model
        self.update({ username: username, status: 'confirmed' }, cb, multi);
      } else {
        cb('User status isn\'t \'new\'');
      }
    });
  });
};

//
// User Confirmation Email
//

fn.sendEmailConfirmation = function( user, cb ){

  if( ! user.username ){
    cb('Must provide a username');
  }

  // create a token
  var token = crypto.randomBytes(30).toString('base64')
                  .split('/').join('_')
                  .split('+').join('-');

  token = sha(token);

  var u = 'http://b.gif.ly/confirm/'+ encodeURIComponent(token);
  // store token in redis
  this.client.set('email_confirm:'+ token, user.username, function(err, data){
    // email user token
    mailer.sendMail({
      to: user.email,
      from: config.from,
      subject: 'Welcome to gif.ly. Please confirm your email.',
      text: 'Here at gif.ly, we value whether or not you\'re a real person, '+
        'and not an animated gif. Please confirm that '+
        user.email +
        ' is a valid email address belonging to a real, actual person.\r\n\r\n'+
        'Please click on the following link, or paste this into your '+
        'browser to complete the process:\r\n\r\n'+
        '    ' + u + '\r\n\r\n'+
        'Thanks.\r\n\r\n'+
        '    -- @wookiehangover'
    }, function(err, result){
      if( cb ){
        cb( err, result );
      }
    });

  });

};

function sha (s) {
  return crypto.createHash("sha1").update(s).digest("hex");
}
