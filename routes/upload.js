var fs = require('fs');
var crypto = require('crypto');
var formidable = require('formidable');
var MediaModel = require('../models/media');
var config = require('../config');

module.exports = function( router, client ){

  var media = MediaModel(client);

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

          multi.exec(function(err){
            if( err ){
              console.error(err);
              console.trace();
              res.error(500);
            } else {
              res.json(data, 201);
            }
          });

        });
      });

    });

  });


};
