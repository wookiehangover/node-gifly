var fs         = require('fs');
var ecstatic   = require('ecstatic');
var less       = require('less');
var media      = require('../models/media');

var ec = ecstatic( __dirname + '/..' );
var parser = new less.Parser({
    paths: ['./assets/less'],
    filename: 'streamr.less'
});

function processLess( req, res, filename ){
  fs.readFile( __dirname + '/../assets/less/'+ filename +'.less', 'utf-8', function( err, data ){
    if( err ) {
      console.log(err);
      res.writeHead(404);
      res.end();
    }
    parser.parse( data, function(err, css ){
      res.writeHead(200, {'Content-Type': 'text/css'});
      var errorMsg;
      if( err ){
        errorMsg = '/*\n';
        for(var i in err) { errorMsg += ( i +': '+ err[i] + '\n' ); }
        errorMsg += '*/\n';
        console.log('\n====\n'+ errorMsg +'\n====\n');
      }
      res.end( errorMsg || css.toCSS() );
    });
  });
}

module.exports = function( router ){

  if( process.env.NODE_ENV !== 'production' ){
    router.add(/^\/assets\/css\/([^\.]+)\.css$/, 'less', processLess);
  }

  router.add(/^\/([\w]{8})\.gif$/, function( req, res, hash ){

    media.client.get('gif:'+ hash, function( err, url){
      if( err ){
        return res.error(500);
      }

      if( !url ){
        return res.error(404);
      }


      res.redirect( 'http:'+ url, 301 );

    });
  });

  router.add('assets/*path', function( req, res ){
    ec( req, res );
  });

  router.add('app/*path', function( req, res ){
    ec( req, res );
  });

  // router.add(/^\/([\w]{8})$/, function( req, res, hash ){
  //   media.client.get('hash:'+ hash, function( err, key){
  //     if( err ){
  //       return res.error(500);
  //     }

  //     if( !key ){
  //       return res.error(404);
  //     }

  //     media.client.hmget('upload:'+ key, function(err, url){
  //       res.redirect( 'http:'+ url[0], 301 );
  //     });
  //   });
  // });

  router.add('c/:hash', function( req, res, hash ){
    media.client.get('hash:'+ hash, function( err, key){
      if( err ){
        return res.error(500);
      }

      if( !key ){
        return res.error(404);
      }

      media.client.hmget('upload:'+ key, 'cover_url', function(err, url){
        res.redirect( 'http:'+ url[0], 301 );
      });
    });
  });
};
