var fs = require('fs');
var crypto = require('crypto');
var formidable = require('formidable');
var media = require('../models/media');
var config = require('../config');

function upload(req, res){

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
        data.status = 'processing';
        data.user = sess.auth.username;
        var fileHash = crypto.createHash('md5');
        fileHash.update( JSON.stringify( data ) );
        data.hash = fileHash.digest('hex').slice(0,8);

        media.create(data, function onStore(err, upload){
          if( err ){
            return res.json(err, 500);
          }

          media.client.publish('uploads:process', JSON.stringify({
            file: file,
            data: data
          }));

          media.client.set('hash:'+ data.hash, data.id);

          res.json(data, 201);
        });
      }
    });

  });

}

module.exports = function( router ){
  router.add('upload', upload);
};
