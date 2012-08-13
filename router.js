var ramrod = require('ramrod');

var router = module.exports = ramrod();

var assets = require('./routes/assets');
assets( router );

var user = require('./routes/user');
user( router );

var upload = require('./routes/upload');
upload( router );

var api = require('./routes/api');
api( router );

router.add('mu-5838535f-4f3e8d3d-3d477ef2-93c7f533', function(req, res){
  res.writeHead(200);
  res.end('42');
});

router.on('*', function(req, res){
  res.error(404);
});
