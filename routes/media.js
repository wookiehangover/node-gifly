var mediaModel = require('../models/media');
var config = require('../config');
var fs = require('fs');
var path = require('path');
var markdown = require('markdown').markdown;
var csrf = require('csrf')();

var _ = require('lodash');

var readme = fs.readFileSync( path.resolve(__dirname + '/../readme.md') );
readme = markdown.toHTML( readme.toString() );

module.exports = function( router, client ){

  var media = mediaModel( client );

  router.add('', function( req, res, params ){
    req.session.get(function(err, sess){

      var data = {};

      if( sess && sess.auth ){
        data.user = sess.auth;
        data.user.mod = config.mods.indexOf( data.user.username ) > -1 ? true : false;
      } else {
        data.user = false;
      }

      if( sess && sess.csrf ){
        req.session._csrf = sess.csrf;
      }

      csrf(req, res, function(){});
      data.csrf = req.session._csrf;

      req.session.set({ csrf: data.csrf }, function( err ){
        if( err ){
          return res.error( 500 );
        }

        media.getAll( params, function( err, results ){

          if( err ){
            console.log(err);
            return res.error(500);
          }

          data.gifs = _.compact(results);
          data.readme = readme;
          res.template('index.ejs', data);
        });
      });

    });
  });

  router.add(/^\/([\w]{8})\.gif$/, function( req, res, hash ){
    client.get('gif:'+ hash, function( err, url){
      if( err ){
        return res.error(500);
      }

      if( !url ){
        return res.error(404);
      }

      res.redirect( 'http:'+ url, 301 );
    });
  });

  // router.add(/^\/([\w]{8})$/, function( req, res, hash ){
  //   media.client.get('hash:'+ hash, function( err, key){
  //     if( err ){
  //       return res.error(500);
  //     }

  //     if( !key ){
  //       return res.error(404);
  //     }

  //     media.client.hmget('upload:'+ key, function(err, url){
  //       res.redirect( 'http:'+ url[0], 301 );
  //     });
  //   });
  // });

  router.add('c/:hash', function( req, res, hash ){
    client.get('hash:'+ hash, function( err, key){
      if( err ){
        return res.error(500);
      }

      if( !key ){
        return res.error(404);
      }

      client.hmget('upload:'+ key, 'cover_url', function(err, url){
        res.redirect( 'http:'+ url[0], 301 );
      });
    });
  });

};
