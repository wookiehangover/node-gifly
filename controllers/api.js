module.exports = function( router ){

  router.add('api/*path', function(req, res, foo ){
    res.writeHead(200);
    res.end('api!!');
  });

};
