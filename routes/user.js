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
    if( !req.session ){
      return res.redirect('/login');
    }

    req.session.get(function(err, sess){
      if(sess && sess.auth){
        res.template('profile.ejs', sess.auth);
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

    function onEnd(){
      var data = qs.parse(buf);
      user.authenticate( data.username, data.password, onAuth);
    }

    var buf = '';
    req.on('data', function(data){
      buf += data;
    });

    req.on('end', onEnd);
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

    function onEnd(){
      var data = qs.parse(buf);
      user.create( data, onCreate);
    }

    var buf = '';
    req.on('data', function(data){
      buf += data;
    });

    req.on('end', onEnd);
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
