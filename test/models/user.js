/*global describe, it, after, before, beforeEach, afterEach*/
var
  User     = require('../../models/user'),
  helper   = require('../helper'),
  fixtures = require('../fixtures'),
  assert   = require('assert');

var redis = require('redis');
var client;

describe('User Model', function(){

  var userData = fixtures.userData;

  before(function(){
     client = redis.createClient();
  });

  after(function(){
    client.quit();
  });

  beforeEach(function(){
    this.user = User( client );
    this.userData = fixtures.userData();
  });

  afterEach(function( done ){
    var multi = this.user.client.multi();
    multi.del('user:wookiehangoverdafadsf');
    multi.del('user:email:sam+testesttest@quickleft.com');
    multi.exec(function(err){
      if( err ) throw new Error(err);
      done();
    });
  });

  it('should let you create a user', function( done ){
    this.user.create(this.userData, function( err, res, data ){
      if( err ) throw new Error(err);
      done();
    });
  });

  it('should enforce unique usernames', function( done ){
    var self = this;
    var data = fixtures.userData();

    self.user.storePassword = function(){};

    self.user.create(self.userData, function( err, res ){
      self.user.create(data, function( err ){
        assert.equal( err, 'You must provide a unique username and email' );
        done();
      });
    });
  });

  it('passwords are encrypted', function( done ){
    var self = this;

    this.user.storePassword(this.userData.username, this.userData.password,
      function( err, res, data ){
        assert.notEqual( data.password, self.userData.password );
        done();
      });
  });

  it('should let you authenticate with a username and password', function( done ){
    var self = this;

    this.user.client.hmset(['user:'+ this.userData.username, 'status', 'confirmed' ], function(err){
      if(err)
        throw new Error(err);

      self.user.storePassword(self.userData.username, self.userData.password, function( err, res ){
        var checkIfDone = helper.expect( 2, done );

        self.user.authenticate( self.userData.username, self.userData.password, function( err, res ){
          assert.equal( err, null );
          assert.ok( res );
          checkIfDone();
        });

        self.user.authenticate( self.userData.username, 'wuuut', function( err, res ){
          assert.equal( err, 'Authentication Failure' );
          assert.ok( !res );
          checkIfDone();
        });
      });

    });

  });

  it('should omit password data when returning a result', function( done ){
    var self = this;
    self.user.create(this.userData, function(err, res){

      self.user.get('wookiehangoverdafadsf', function(err, res){
        assert.ok( !res.password );
        assert.ok( !res.salt );
        done();
      });
    });
  });


  it('should enforce a schema', function(done){
    var self = this;

    this.user.create( this.userData, function(err, res){
      self.user.update({ username: 'wookiehangover', status: 'confirmed', password: 'pwned'},
                       function(err, status, data){

        assert.notEqual(data.status, 'confirmed');
        assert.notEqual(data.password, 'pwned');
        done();
      });
    });
  });

});

