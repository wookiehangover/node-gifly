var User = require('../models/user');
var qs = require('querystring');

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
        console.log(err);
        return res.error(err, 412);
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
        return res.error(err, 412);
      }

      req.session.set('auth', new_user, function(){
        res.redirect('/profile');
      });
    }

    req.parseBody(function( body ){
      var data = qs.parse( body );
      user.create( data, onCreate);
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
