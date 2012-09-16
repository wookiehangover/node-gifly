var qs = require('querystring');
var config = require('../config');
var userModel = require('../models/user');
var csrf = require('csrf')();
var _ = require('lodash');

module.exports = function( router, client ){
  var user = userModel( client );

  router.add('login', function( req, res ){
    req.session.get(function( err, sess ){

      if( sess && sess.auth ){
        res.redirect('/profile');
        return;
      }

      if( sess && sess.csrf ){
        res.template('login.ejs', { csrf:  sess.csrf });
        return;
      }

      csrf(req, res, function(){});
      var token = req.session._csrf;

      req.session.set({ csrf: token }, function( err ){
        if( err ){
          return res.error( 500 );
        }

        res.template('login.ejs', { csrf: token });
      });
    });
  });

  router.add('signup', function( req, res ){
    res.template('create_account.ejs', {});
  });

  router.add('profile', function(req, res){
    req.session.get(function(err, sess){
      if(sess && sess.auth){
        res.template('profile.ejs', { user: sess.auth });
      } else {
        res.redirect('/login');
      }
    });
  });

  router.add('user/authenticate', function( req, res ){
    if( req.method !== 'POST' ){
      return res.error(405);
    }

    function onAuth(err, userData){

      res.session.del('csrf', function(){
        if(err){
          return res.error(412, err);
        }

        if( userData ){

          userData = _.omit( userData, 'modifiedAt', 'createdAt');

          req.session.set({ auth: userData }, function(err){

            if(err){
              console.log(err);
            }

            res.redirect('/profile');
          });
        } else {
          res.render('login.ejs', { error: "Authentication Failed" });
        }
      });

    }

    req.on('form', function( body ){
      var data = qs.parse(body);

      req.body = data;

      req.session.get(function( err, sess ){

        if( sess && sess.csrf ){
          req.session._csrf = sess.csrf;
        }

        csrf(req, res, function(){
          user.authenticate( data.username, data.password, onAuth);
        });

      });
    });

  });

  router.add('user/new', function( req, res ){
    if( req.method !== 'POST' ){
      return res.error(405);
    }

    function onCreate(err, status, userData){
      if(err){
        console.log(err);
        return res.error(412, err);
      }

      user.sendEmailConfirmation( userData );

      userData = _.omit( userData, 'createdAt', 'modifiedAt');

      req.session.set({ auth: userData }, function(err){

        if( err ){
          console.error(err);
          console.trace();
        }

        res.redirect('/profile');
      });
    }

    req.on('form', function( body ){
      var data = qs.parse( body );
      user.create( data, onCreate);
    });
  });

  router.add('user/forgot-password', function(req, res){
    if( req.method === 'POST' ){

      req.on('form', function(body){
        var data = qs.parse(body);
        req.session.get(function(sess){
          if( sess && sess.auth ){
            return res.redirect('/user/profile/edit');
          }

          if( !data.email ){
            return res.error(412, "Please provide an email address");
          }

          user.sendPasswordReset( data.email, function(err, result){
            if(err){
              return res.error(500, err);
            }

            res.template('password-recovery-submitted.ejs');
          });
        });
      });
    } else if( req.method === 'GET'){
      res.template('forgot-password.ejs');
    } else {
      res.error(405);
    }
  });

  router.add('reset/:token', function( req, res, token ){
    var view = { token: token };

    if( req.method === 'GET' ){
      res.template('recover-password.ejs', view);
    } else if( req.method === 'POST'){

      req.on('form', function( body ){
        var data = qs.parse(body);
        client.get('pw_reset:'+ token, function(err, username){
          if( err ){
            return res.error(404);
          }

          if( data.password !== data.confirmation ){
            view.error = 'Password and confirmation must match';
            return res.template('recover-password.ejs', view);
          }

          user.storePassword( username, data.password, function(err){
            if( err ){
              return res.error(500, err);
            }
            client.del('pw_reset:'+ token);
            res.redirect('/login');
          });

        });
      });
    } else {
      res.error(405);
    }
  });


  router.add('confirm/:token', function( req, res, token ){

    if( req.method !== 'GET' ){
      return res.error(405);
    }

    user.confirmEmail( token, function(err, result){
      if( err ){
        return res.error(412,err);
      }

      req.session.get(function(err, sess){
        if( sess && sess.auth ){
          res.redirect('/profile');
        } else {
          res.redirect('/login');
        }
      });
    });

  });

  router.add('logout', function(req, res){
    function done(){
      res.redirect('/');
    }

    req.session.get(function(err, sess){
      if( sess && sess.auth ){
        res.session.del('auth', done);
      } else {
        done();
      }
    });
  });

};

