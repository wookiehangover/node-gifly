var fs = require('fs');
var redis  = require('redis');
var client = exports.client = redis.createClient();
var crypto = require('crypto');
var s3 = require('../lib/s3');

client.on('error', function(err){
  console.log('Redis Error: '+ err);
});

exports.create = function( data, cb ){

  var upload = data;
  var hash = [ 'upload:'+ upload.id ];

  upload.createdAt = upload.modifiedAt = +new Date();

  for(var i in upload){
    if(upload.hasOwnProperty(i))
      hash.push(i) && hash.push(upload[i]);
  }

  client.hmset(hash, function( err, res ){
    cb( err, upload );
  });

};

// Uploads Gifs to S3
//
// TODO - add image processing task

function Process( file, data ){
  this.file = file;
  this.data = data;

  console.log('Processing upload:' + file.name );

  var self = this;

  fs.readFile( file.path, function( err, buffer ){
    self.upload( buffer );
  });
}

Process.prototype.upload = function( buffer ){
  var upload = s3.put( '/test/' + this.file.name, {
    'Content-Length': buffer.length,
    'Content-Type': this.file.type
  });

  var fileHash = crypto.createHash('md5');
  fileHash.update( buffer.toString() );

  // render repsonse page on success
  upload.on('response', function( res ) {
    if( res.statusCode !== 200 ){
      return;
    }

    this.data.url = upload.url;
    this.data.status = 'uploaded';
    this.data.modifiedAt = +new Date();
    this.data.hash = fileHash.digest('hex').slice(0,8);

    this.update( this.data );
  });

  upload.end( buffer );
};

Process.prototype.update = function( data ){
  var hash = [ 'upload:'+ data.id ];

  for(var i in data){
    if( this.data.hasOwnProperty(i) )
      hash.push(i) && hash.push(data[i]);
  }

  client.hmset(hash, function( err, res ){
    client.zadd('uploads:global', data.createdAt, 'upload:'+ data.id );
    client.publish('uploads', JSON.stringify(data));
  });
};

exports.process = function( file, data ){
  return new Process( file, data );
};
