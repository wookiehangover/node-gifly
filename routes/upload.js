var fs = require('fs');
var crypto = require('crypto');
var formidable = require('formidable');
var mediaModel = require('../models/media');
var config = require('../config');
var csrf = require('csrf')();
var _ = require('lodash');

var log_token = config.logglyToken;

module.exports = function( router, client ){

  var media = mediaModel(client);

  router.post('api/media', function( req, res ){
    var form = new formidable.IncomingForm({
      uploadDir: config.tmpDir
    });

    form.parse( req, function( err, fields, files){
      var file = files.files;
      var data = fields;

      if( file ){
        data.filename = file.name;
        data.id = file.name + file.size;
      } else {
        return res.json({ error: "You need to provide a file" }, 412);
      }

      req.session.get(function(err, sess){
        if( !(sess && sess.auth) ){
          res.json({ error: 'You need to be logged in to do that'}, 403);
          return;
        }

        data.user = sess.auth.username;
        data.status = 'processing';
        var fileHash = crypto.createHash('md5');
        fileHash.update( JSON.stringify( data ) );
        data.hash = fileHash.digest('hex').slice(0,8);

        media.create(data, function onStore(err, upload){
          if( err ){
            return res.json(err, 500);
          }

          var multi = client.multi();

          multi.rpush('queue:gifs', JSON.stringify({
            file: file,
            data: data
          }));

          multi.set('hash:'+ data.hash, data.id);

          multi.exec(function(err, result){
            if( err ){
              console.error(err);
              console.trace();
              res.error(500);
            } else {
              req.logger(_.extend({ message: "successfuly upload" }, data));
              res.json(data, 201);
            }
          });
        }); // csrf
      }); // form.parse

    });

  });


  router.add('upload', function upload(req, res){

    if( req.method !== 'POST' ){
      return res.error(405);
    }

    var form = new formidable.IncomingForm({
      uploadDir: config.tmpDir
    });

    form.parse( req, function( err, fields, files){
      var file = files.files;
      var data = fields;

      data.filename = file.name;
      data.id = file.name + file.size;

      req.session.get(function(err, sess){
        if(sess && sess.auth){
          data.user = sess.auth.username;
        }

        if( sess && sess.csrf ){
          req.session._csrf = sess.csrf;
        }

        csrf(req, res, function(){
          data.status = 'processing';
          var fileHash = crypto.createHash('md5');
          fileHash.update( JSON.stringify( data ) );
          data.hash = fileHash.digest('hex').slice(0,8);

          media.create(data, function onStore(err, upload){
            if( err ){
              return res.json(err, 500);
            }

            var multi = client.multi();

            multi.rpush('queue:gifs', JSON.stringify({
              file: file,
              data: data
            }));

            multi.set('hash:'+ data.hash, data.id);

            multi.exec(function(err, result){
              if( err ){
                console.error(err);
                console.trace();
                res.error(500);
              } else {
                req.logger(_.extend({ message: "successfuly upload" }, data));
                res.json(data, 201);
              }
            });
          }); // csrf
        }); // session
      }); // form.parse

    });

  });


};
