var fs = require('fs');
var formidable = require('formidable');

var config = require('../lib/config');
var media = require('../models/media');

module.exports = function( router ){

  router.add('upload', function( req, res ){
    if( req.method !== 'POST' ){
      res.writeHead(405);
      return res.end();
    }

    var form = new formidable.IncomingForm();

    function onStore(err, upload){
      if( err ){
        onError(500, err);
      }
      res.writeHead(202, config.types.json );
      res.end(JSON.stringify( upload ));
    }

    function onError( staus, message ){
      console.error( message );
      res.writeHead( status, config.types.json );
      res.end(JSON.stringify({ error: message }));
    }

    form.parse( req, function( err, fields, files){
      var file = files.files;
      var data = fields;

      data.filename = file.name;
      data.id = file.name + file.size;

      media.create(data, function onStore(err, upload){
        if( err ){
          onError(500, err);
        }

        media.process( file, data );

        res.writeHead(202, config.types.json );
        res.end(JSON.stringify( upload ));
      });
    });

  });

};
