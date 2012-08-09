var fs = require('fs');
var formidable = require('formidable');

var config = require('../config');
var media = require('../models/media');

function upload(req, res){

  if( req.method !== 'POST' ){
    return res.error(405);
  }

  var form = new formidable.IncomingForm();

  form.parse( req, function( err, fields, files){
    var file = files.files;
    var data = fields;

    data.filename = file.name;
    data.id = file.name + file.size;

    req.session.get(function(err, sess){
      if(sess && sess.auth){
        data.status = 'processing';
        data.user = sess.auth.username;

        media.create(data, function onStore(err, upload){
          if( err ){
            return res.json(err, 500);
          }

          media.client.publish('uploads:process', JSON.stringify({
            file: file,
            data: data
          }));

          res.json(upload, 201);
        });
      }
    });

  });

}

module.exports = function( router ){
  router.add('upload', upload);
};
