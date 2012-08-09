var redis = require('redis');
var client = redis.createClient();

module.exports = function( router ){

  router.add('api/media', function(req, res, foo ){

    var multi = client.multi();

    client.zrevrange('uploads:global', 0, 20, function(err, set){
      set.forEach(function(upload){
        multi.hgetall(upload);
      });

      multi.exec(function(err, results){
        res.json(results, 200);
      });
    });
  });

};
