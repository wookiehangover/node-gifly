/*jshint latedef: false, curly: false */
var _      = require('underscore.deferred');
var fs     = require('fs');
var gm     = require('gm');
var url    = require('url');
var knox   = require('knox');
var redis  = require('redis');
var crypto = require('crypto');
var loggly = require('loggly');

var config = require('./config');
var Media  = require('./models/media');

var token = config.logglyToken;
var logger = loggly.createClient(config.loggly);

var def = _.Deferred;
var tmpDir = config.tmpDir;

var s3 = knox.createClient( config.s3 );

var r = config.redis;
var client = redis.createClient(r.port, r.host, r);
if( r.auth ) client.auth(r.auth);

client.on('error', function(err){
  logger.log(token, 'Redis Error: '+ err);
});


client.on('connect',function(){

  setInterval(function(){
    client.rpop('queue:gifs', function(err, message){
      if( err ){
        logger.log(token, err );
        console.trace();
      }

      if( message ){
        var data = JSON.parse(message);
        new Processr( data.file, data.data );
      }
    });
  }, 500);

});

var media = new Media( client );

//
// Processr
//

// TODO:
//
//  * simplify constructor arguments; allow for raw streams
//  * refactor to inherit from EventEmitter to implement a state machine in
//    order to better define a definite processing order. -- nested dfd
//    callbacks will work too
//  * make hashing a pipe-able interface
//  
//  * only upload when processing and hashing are complete
//

function Processr( file, data ){
  var self = this;

  logger.log(token, data);
  logger.log(token, file);

  this.file = file;
  this.data = data;
  this.stream = fs.createReadStream( file.path );
  this.tmp_files = [];

  this.queue = ['hash', 'upload', 'enhance'].map(function(fn){
    return self[fn]();
  });

  _.when.apply(null, this.queue).then(function(){
    self.cleanup();
  }, function(){
    media.del( this.data );
    self.cleanup();
  });
}

Processr.prototype.cleanup = function(){

  logger.log( token, 'cleaning up: '+ this.tmp_files);
  this.tmp_files.forEach(function(file){
    fs.unlink( file, function(err){
      if( err ){
        console.error(err);
        console.trace();
      } else {
        logger.log(token, 'Deleted:' + file);
      }
    });
  });

};

//
// Hash the contents of `stream` or `this.stream`
//
// returns a Deferred Promise
//

Processr.prototype.hash = function( stream ){
  var data = { id: this.data.id };

  var self = this;
  var dfd = def();
  var buf = '';
  stream = stream || this.stream;

  stream.on('data', function(chunk){
    buf += chunk;
  });

  stream.on('end', function(){
    var fileHash = crypto.createHash('md5');
    fileHash.update( buf );
    data.filehash = fileHash.digest('hex').slice(0,8);

    // TODO: if filehash exists, mark record as duplicate and stop processing

    media.save( data, function(err, status, media){
      if( err ){
        console.error('Error hashing:'+ err);
        console.trace();
        dfd.reject();
        return;
      }
      dfd.resolve();
      client.publish('uploads', JSON.stringify(media));
    });
  });

  return dfd.promise();
};

//
// Upload `stream` or `this.stream` to desired `path` on S3
//
// returns a Deferred Promise
//

Processr.prototype.upload = function( path, stream, headers ){
  var self = this;
  var dfd = def();
  var data = this.data;

  path = path || data.hash + '.gif';
  stream = stream || this.stream;
  headers = headers || {
    'Content-Length': this.file.size,
    'Content-Type': this.file.type
  };

  function onUpload(err, res){
    if( err ){
      console.error('Error uploading: '+ err);
      console.trace();
      dfd.reject();
      return;
    }

    res.on('end', function(){
      data.url = res.req.url
        .replace(/https?:/, '')
        .replace(/\.s3\.amazonaws\.com/, '');
      data.status = 'uploaded';
      data.modifiedAt = +new Date();

      self.tmp_files.push( self.file.path );

      media.save( data, function(err, status, media){
        dfd.resolve();
        client.publish('uploads', JSON.stringify(media));
        client.zadd('uploads:global', media.createdAt, 'upload:'+ media.id );
        client.set('gif:'+ data.hash, data.url);
      });
    });
  }

  s3.putStream(stream, path, headers, onUpload);

  return dfd.promise();
};

//
// Enhance the image contents of `stream` or `this.stream`
//    - extracts a cover image for animated GIFs
//    - any additional image processing should happen here
//
// returns a Deferred Promise
//

Processr.prototype.enhance = function( stream ){
  var self = this;
  var dfd = def();
  stream = stream || this.stream;

  var filepath = tmpDir + '/cv_'+ self.data.hash + '.gif';

  function onUpload(err, res){
    if( err ){
      console.error(err);
      console.trace();
      dfd.reject();
      return;
    }

    res.on('end', function(){

      logger.log(token, res.req.url);
      var data = {
        id: self.data.id,
        cover_url: res.req.url.replace(/https?:/, '')
      };

      self.tmp_files.push( filepath );

      media.save( data, function(err, status, media){
        if( err ){
          console.error(err);
          console.trace();
          dfd.reject();
          return;
        }
        dfd.resolve();
        client.publish('uploads', JSON.stringify(media));
      });
    });
  }

  gm(stream, this.data.filename + '[0]')
    .write( filepath, function(err){
      if( err ){
        console.error(err);
        console.trace();
        dfd.reject();
        return;
      }

      var path = self.data.filename.replace(/\.s3\.amazonaws\.com/, '');

      s3.putFile( filepath, 'cv_'+self.data.filename, onUpload);
    });

  return dfd.promise();
};

//
// Handle Exceptions and Process Exit
//

process.on('uncaughtException', function(e){
  console.error(e);
});

process.on('exit', function(){

  try { client.quit(); } catch (e) {
    console.error('error quitting redis client', e);
    client.close();
  }

});
