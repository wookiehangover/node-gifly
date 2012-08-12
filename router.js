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

router.on('*', function(req, res){
  res.error(404);
});
