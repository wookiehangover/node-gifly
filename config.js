/*jshint asi:true, curly: false */
exports.host = 'localhost'
exports.port = process.env.PORT || 3000

exports.key = 'keyboard cat'

exports.s3 = {
  key: process.env.AWS_KEY,
  secret: process.env.AWS_SECRET,
  bucket: 'i.wookiehangover.com'
}

exports.mods = ['wookiehangover'];

// redis auth 
exports.redis = { host: '127.0.0.1', port: 6379 }

exports.errorPage = { debug: true }

exports.debug = true

exports.tmpDir = require('path').resolve( __dirname + '/tmp');

// For development only!
// Don't send 304s for templar (still does for styl and some others)
// npm config set npm-www:nocache 1
exports.nocache = process.env.npm_package_config_nocache === '1'

exports.templateOptions = {
  cache: !exports.nocache
}

/*****************/
/* don't delete! */
/*****************/
var env = process.env.NODE_ENV || process.env.APPLICATION_MODE
var admin
if (env === 'production') {
  admin = require('./config.admin.js')
} else try {
  admin = require('./config.dev.js')
} catch (er) {
  console.error('Warning: No admin configurations.  Not suitable for production use.')
  admin = {}
}

Object.keys(admin).forEach(function (k) {
  if (k === 'redisAuth') exports.redis.auth = admin[k]
  exports[k] = admin[k]
})

if (module === require.main) {
  // just show the configs
  console.log(exports)
  process.exit(0)
}

