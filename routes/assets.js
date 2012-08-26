var fs         = require('fs');
var ecstatic   = require('ecstatic');
var less       = require('less');
var Url = require('url');
var config = require('../config');
var path = require('path');

var ec = ecstatic( path.resolve(__dirname + '/..') );
var parser = new less.Parser({
    paths: ['./assets/less'],
    filename: 'streamr.less'
});


function processLess( req, res, filename ){
  var lessPath = path.resolve(__dirname + '/../assets/less/'+ filename +'.less');
  fs.readFile(lessPath, 'utf-8', function( err, data ){
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

module.exports = function( router, client ){

  // re-route css requests to their corresponding less files
  if( config.env !== 'production' ){
    router.add(/^\/assets\/css\/([^\.]+)\.css$/, 'less', processLess);
  }

  router.add('favicon.ico', function(req, res){
    req.url = '/assets/img/favicon.ico';
    ec( req, res );
  });

  // re-route production js assets in dev mode
  router.add('dist/release/*path', function( req, res, file ){
    var url = Url.parse(req.url);

    if( config.env !== 'production' ){
      url.pathname = '/assets/js/vendor/' + file;
      req.url = Url.format( url );
    }

    ec( req, res );
  });

  router.add('assets/*path', function( req, res ){
    ec( req, res );
  });

  router.add('app/*path', function( req, res ){
    ec( req, res );
  });

};
