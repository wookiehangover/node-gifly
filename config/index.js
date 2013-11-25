/*jshint asi:true, curly: false */
exports.host = process.env.hostname || 'localhost'
exports.port = process.env.PORT || 3000

exports.key = 'keyboard cat'

exports.s3 = {
  key: process.env.AWS_KEY,
  secret: process.env.AWS_SECRET,
  bucket: process.env.AWS_BUCKET || 'i.wookiehangover.com'
}

exports.mods = ['wookiehangover'];

// redis auth 
exports.redis = { host: '127.0.0.1', port: 6379 }

if (process.env.redisHost){
  exports.redis.host = process.env.redisHost;
}

if (process.env.redisPort){
  exports.redis.port = process.env.redisPort;
}

if (process.env.redisAuth) {
  exports.redis.auth = process.env.redisAuth;
}

exports.errorPage = { debug: false }

exports.debug = false

exports.ips = false

exports.tmpDir = require('path').resolve(process.env.tmpDir || 'tmp');

// For development only!
// Don't send 304s for templar (still does for styl and some others)
// npm config set npm-www:nocache 1
exports.nocache = process.env.npm_package_config_nocache === '1'

exports.templateOptions = {
  cache: !exports.nocache
}

exports.from = 'no-reply@gif.ly';

exports.mailTransportType = "SMTP"
exports.mailTransportSettings = {
  service: "SendGrid",
  auth: {}
}

if (process.env.sendgridUser){
  exports.mailTransportSettings.auth.user = process.env.sendgridUser
}

if (process.env.sendgridPass){
  exports.mailTransportSettings.auth.pass = process.env.sendgridPass
}

exports.loggly = {
  subdomain: 'gifly',
  auth: {},
  json: true
};

if (process.env.logglyUser){
  exports.loggly.auth.user = process.env.logglyUser
}

if (process.env.logglyPass){
  exports.loggly.auth.pass = process.env.logglyPass
}

if (process.env.logglyToken){
  exports.logglyToken = process.env.logglyToken
}


/*****************/
/* don't delete! */
/*****************/
var env = exports.env = process.env.NODE_ENV || process.env.APPLICATION_MODE
var admin;
try {
  if (env === 'production') {
    admin = require('./config.prod.js')
  } else {
    admin = require('./config.dev.js')
  } 
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

