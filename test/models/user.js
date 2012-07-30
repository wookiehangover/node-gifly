/*global describe, it, after, before, beforeEach, afterEach*/
var
  user     = require('../../models/user'),
  helper   = require('../helper'),
  fixtures = require('../fixtures'),
  assert   = require('assert'),
  crypto   = require('crypto');

describe('User Model', function(){

  var userData = fixtures.userData;

  beforeEach(function(){
    this.userData = {
      username: 'wookiehangover',
      email: 'sam@quickleft.com',
      password: 'foo bar'
    };
  });

  afterEach(function( done ){
    user.client.del( 'user:wookiehangover', function(err){
      if( err ) throw new Error(err);
      done();
    });
  });

  it('should let you create a user', function( done ){
    user.create(this.userData, function( err, res ){
      if( err ) throw new Error(err);
      done();
    });
  });

  it('should enforce unique usernames', function( done ){
    var self = this;
    user.create(self.userData, function( err, res ){
      user.create(self.userData, function( err ){
        assert.equal( err, 'You must provide a unique username' );
        done();
      });
    });
  });

  it('passwords are salted and hashed', function( done ){
    user.create(this.userData, function( err, res ){
      user.client.hgetall('user:wookiehangover', function( err, res ){
        if( err ) throw new Error(err);
        assert.notEqual( userData.password, res.password);
        var hash = crypto.createHash('sha256');
        hash.update( userData.username + userData.password + res.salt );
        assert.equal( hash.digest('hex'), res.password );
        done();
      });
    });
  });

  it('should let you authenticate with a username and password', function( done ){
    user.create(this.userData, function( err, res ){
      var checkIfDone = helper.expect( 2, done );

      user.authenticate( userData.username, userData.password, function( err, res ){
        assert.equal( err, null );
        assert.ok( res );
        checkIfDone();
      });

      user.authenticate( userData.username, 'wuuut', function( err, res ){
        assert.equal( err, 'Authentication Failure' );
        assert.ok( !res );
        checkIfDone();
      });
    });
  });

  it('should omit password data when returning a result', function( done ){
    user.create(this.userData, function(err, res){
      user.get('wookiehangover', function(err, res){
        assert.ok( !res.password );
        assert.ok( !res.salt );
        done();
      });
    });
  });

});

