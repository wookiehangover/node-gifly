var User = require('../models/user');
var qs = require('querystring');
var config = require('../config');

module.exports = function( router, client ){
  var user = User( client );

  router.add('login', function( req, res ){
    res.template('login.ejs', {});
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
      if(err){
        return res.error(412, err);
      }

      if( userData ){
        req.session.set('auth', userData, function(){
          res.redirect('/profile');
        });
      } else {
        res.render('login.ejs', { error: "Authentication Failed" });
      }
    }

    req.parseBody(function( body ){
      var data = qs.parse(body);
      user.authenticate( data.username, data.password, onAuth);
    });

  });

  router.add('user/new', function( req, res ){
    if( req.method !== 'POST' ){
      return res.error(405);
    }

    function onCreate(err, status, new_user){
      if(err){
        console.log(err);
        return res.error(412, err);
      }

      user.sendEmailConfirmation( new_user );

      req.session.set('auth', new_user, function(){
        res.redirect('/profile');
      });
    }

    req.parseBody(function( body ){
      var data = qs.parse( body );
      user.create( data, onCreate);
    });
  });

  router.add('user/forgot-password', function(req, res){
    if( req.method === 'POST' ){

      req.parseBody(function(body){
        var data = qs.parse(body);
        req.session.get(function(sess){
          if( sess && sess.auth ){
            return res.redirect('/user/profile/edit');
          }

          if( !data.email ){
            console.log(data);
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

      req.parseBody(function( body ){
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
