var fs = require('fs');
var gm = require('gm');
var knox = require('knox');
var redis = require('redis');
var crypto = require('crypto');
var config = require('./config');

var _def = require('underscore.deferred');
var def = _def.Deferred;

var client = redis.createClient();
var s3 = knox.createClient( config.s3 );

var tmpDir = config.tmpDir;

client.on('error', function(err){
  console.log('Redis Error: '+ err);
});

//
// Subscribe to Redis queue for uploads to process
//

var uploads = redis.createClient();

uploads.subscribe('uploads:process');

uploads.on('message', function(channel, message){
  var data = JSON.parse(message);
  new Processr( data.file, data.data );
});

//
// Save the upload model data as a Redis hash
//

function save( data, cb ){
  var err_msg;
  if( !data.id ){
    err_msg = "You must provide an ID";
  }
  if( err_msg !== undefined ){
    return cb( err_msg );
  }

  var hash = [ 'upload:'+ data.id ];

  for(var i in data){
    if( data.hasOwnProperty(i) ){
      hash.push(i);
      hash.push(data[i]);
    }
  }

  client.hmset(hash, function(err, status){
    if( err ){
      console.error(err);
      console.trace();
    }
    cb(err, status, data);
  });
}

//
// Processr
//

function Processr( file, data ){
  var self = this;

  console.log('Processing: ', data);

  this.file = file;
  this.data = data;
  this.stream = fs.createReadStream( file.path );
  this.tmp_files = [];

  this.queue = ['hash', 'upload', 'enhance'].map(function(fn){
    return self[fn]();
  });

  _def.when.apply(null, this.queue).then(function(){
    self.cleanup();
  }, function(){
    // TODO: cleanup redis records on failure
    self.cleanup()
  });
}

Processr.prototype.cleanup = function(){

  this.tmp_files.forEach(function(file){
    fs.unlink( file, function(err){
      if( err ){
        console.error(err);
        console.trace();
      } else {
        console.log('Deleted:' + file);
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

    save( data, function(err, status, media){
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
      data.url = res.req.url.replace(/https?:/, '');
      data.status = 'uploaded';
      data.modifiedAt = +new Date();

      self.tmp_files.push( self.file.path );

      save( data, function(err, status, media){
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

      console.log(res.req.url);
      var data = {
        id: self.data.id,
        cover_url: res.req.url.replace(/https?:/, '')
      };

      self.tmp_files.push( filepath );

      save( data, function(err, status, media){
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

      s3.putFile( filepath, 'cv_'+self.data.filename, onUpload);
    });

  return dfd.promise();
};

process.on('close', function(){

  try { client.quit(); } catch (e) {
    console.error('error quitting redis client', e);
  }

});
