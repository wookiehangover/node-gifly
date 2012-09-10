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

  router.add('api/session', function( req, res ){
    req.session.get(function(err, sess){
      if( sess && sess.auth ){
        sess.auth.mod = config.mods.indexOf( sess.auth.username ) > -1 ? true : false;
        res.json({ user: sess.auth });
      } else {
        res.json({ error: 'You have to be logged in to do that.' }, 403);
      }
    });
  });

  router.add('api/media/:id', function( req, res, id ){

    if( req.method === 'DELETE' ){
      req.session.get(function(err, sess){
        var user;
        if( sess && sess.auth ){
          user = sess.auth;
        } else {
          return res.error(403);
        }

        client.hmget('upload:'+ id, 'hash', 'user', function(err, data){

          if( err ){
            return res.error(500);
          }

          var error;

          if( !user ){
            error = [{ error: "Only logged in Users can delete" }, 401];
          } else if(config.mods.indexOf(user.username) === -1 ||
                    (data[1] && user.username !== data[1])){
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

};
