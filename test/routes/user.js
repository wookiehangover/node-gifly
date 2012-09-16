/*global describe, it, after, before, beforeEach, afterEach*/
var
  userRoutes = require('../../routes/user'),
  helper     = require('../helper'),
  fixtures   = require('../fixtures'),
  ramrod     = require('ramrod'),
  assert     = require('assert');

var redis = require('redis');
var client;

describe('User Routes', function(){

  before(function(){
    client = redis.createClient();
  });

  after(function(){
    client.quit();
  });

  beforeEach(function(){
    this.router = ramrod();
    userRoutes( this.router, client );
  });

  describe('/login', function(){
    it('should redirect if a user is logged in', function( done ){
      var
        req = helper.request({}, { auth: true }),
        res = helper.response(function( redirect ){
          assert.equal( redirect, '/profile' );
          done();
        });

      this.router.emit('login', req, res);
    });

    it('should render a csrf token if one exists', function( done ){
      var
        req = helper.request({}, { csrf: 12345 }),
        res = helper.response(function( tmpl, data ){
          assert.equal( data.csrf, 12345 );
          done();
        });

      this.router.emit('login', req, res);
    });

    it('should create a csrf token and render', function( done ){
      var
        token,
        sessionStore = {},
        req = helper.request({}, sessionStore),
        res = helper.response(function( tmpl, data ){
          assert.equal( tmpl, 'login.ejs');
          token = data.csrf;
          assert.ok(token);
        }),
        res2 = helper.response(function( tmpl, data ){
          assert.equal( tmpl, 'login.ejs');
          assert.equal( data.csrf, token );
          done();
        });

      this.router.emit('login', req, res);
      this.router.emit('login', req, res2);
    });
  });

  describe('/signup', function(){
    it('should render the create_account template', function(done){
      var
        req = helper.request({}),
        res = helper.response(function( tmpl ){
          assert.equal( tmpl, 'create_account.ejs');
          done();
        });

      this.router.emit('signup', req, res);
    });
  });

  describe('/profile', function(){
    it('should render profile if the user is logged in', function(done){
      var
        req = helper.request({}, { auth: true }),
        res = helper.response(function( tmpl ){
          assert.equal( tmpl, 'profile.ejs');
          done();
        });

      this.router.emit('profile', req, res);
    });

    it('should redirect if there\'s no session', function(done){
      var
        req = helper.request({}),
        res = helper.response(function( redirect ){
          assert.equal( redirect, '/login');
          done();
        });

      this.router.emit('profile', req, res);
    });
  });

  describe('/user/authenticate', function(){
    it('should 405 on GET', function(done){
      var
        req = helper.request({}),
        res = helper.response(function( error ){
          assert.equal( error, 405);
          done();
        });

      this.router.emit('user/authenticate', req, res);
    });

    xit('should proxy the form response to user.authenticate', function(done){
      // TODO:
      // * store user in Redis
      // * emit `form` event with QS userdata
      // * potential refactor: push QS parsing into `form` decorator
      var
        req = helper.request({ method: 'POST' }, { csrf: 12345 }),
        res = helper.response(function(){});

      this.emit('user/authenticate', req, res);
    });
  });

});
