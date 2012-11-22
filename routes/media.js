var mediaModel = require('../models/media');
var config = require('../config');
var fs = require('fs');
var path = require('path');
var markdown = require('markdown').markdown;
var request = require('request');
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

  function kaleidos( req, res, path ){
    var url = 'http://coldhead.github.com/kaleidos/';

    if( path !== undefined ){
      url += path;
    }

    request( url ).pipe( res );
  }

  router.add('k-hole/*path', kaleidos);
  router.add('kaleidos/*path', kaleidos);
  router.add('k/*path', kaleidos);

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


  var cached_response = null;
  var cache_expires = null;
  var cache_timer = 36e4;

  function getRandom( set, cb ){
    var index = _.random(set.length);

    client.hgetall(set[index], function(err, gif){
      cb(err, gif);
    });
  }

  router.add(/^\/random(\.gif)?$/, function(req, res){

    var timestamp = +new Date();

    if(  cached_response && (cache_expires + cache_timer > timestamp) ){

      getRandom(cached_response, function(err, gif){
        if( err ){
          return res.error(500, 'No GIF for you.');
        }

        request( 'http:'+ gif.url ).pipe(res);
      });

    } else {

      client.zrevrange('uploads:global', 0, -1, function(err, gifs){

        if(err){
          return res.error(500);
        }

        cached_response = gifs;
        cache_expires = timestamp;

        getRandom(cached_response, function(err, gif){
          if( err ){
            return res.error(500, 'No GIF for you.');
          }

          request( 'http:'+ gif.url ).pipe(res);
        });

      });
    }


  });

};
