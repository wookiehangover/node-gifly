var MediaModel = require('../models/media');
var config = require('../config');

module.exports = function( router, client ){

  var media = MediaModel( client );

  router.add('api/media', function(req, res, params ){

    media.getAll( params, function( err, results ){
      if( err ){
        return res.error(500);
      }
      res.json(results, 200);
    });

  });

  router.add('api/media/:id', function( req, res, id ){

    if( req.method === 'DELETE' ){
      req.session.get(function(err, sess){
        var user;
        if( sess && sess.auth ) user = sess.auth;

        client.hmget('upload:'+ id, 'hash', 'user', function(err, data){

          if( err ){
            return res.error(500);
          }

          var error;

          if( !user ){
            error = [{ error: "Only logged in Users can delete" }, 401];
          } else if(config.mods.indexOf( user.username ) ||
                    user.username !== data[1] ){
            error = [{ error: "You can only delete things that belong to you"}, 403];
          }

          if( error !== undefined ){
            return res.json.apply(null, error);
          }

          media.del({ id: id, hash: data[0] }, function(err, result){
            if( err ){
              res.error(500);
            } else {
              res.send('', 204);
            }
          });
        });
      });
    }

  });

  router.add('', function( req, res, params ){

    req.session.get(function(err, sess){

      var data = {};

      if( sess && sess.auth ) data.user = sess.auth;

      media.getAll( params, function( err, results ){
        data.gifs = results;
        res.template('index.ejs', data);
      });

    });

  });

};
