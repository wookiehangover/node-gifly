var fs         = require('fs');
var ecstatic   = require('ecstatic');
var less       = require('less');
var Url = require('url');
var config = require('../config');
var path = require('path');
var _ = require('lodash');

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
        errorMsg += _.map(err, function(msg, i){
          return i +': '+ msg;
        }).join('\n');
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

  //
  // Internal Redirects
  //

  // favicon should come from site root
  router.add('favicon.ico', function(req, res){
    req.url = '/assets/img/favicon.ico';
    ec( req, res );
  });

  // google webmaster tools
  router.add('google89fecbf161cfd6d7.html', function(req, res){
    req.url = '/assets/google89fecbf161cfd6d7.html';
    ec(req,res);
  });

  // custom performance metrics tracking
  router.add('beacon.gif', function(req, res, params){
    client.lpush('tracking', JSON.stringify(params));
    res.send('', 204);
  });

  // re-route production js assets in dev mode
  router.add('dist/release/require.js', function( req, res ){
    var url = Url.parse(req.url);

    if( config.env !== 'production' ){
      url.pathname = '/app/components/requirejs/require.js';
      req.url = Url.format( url );
    }

    ec( req, res );
  });

  router.add('gif/*path', function(req, res, path){
    res.redirect('http://v1.gif.ly/gif/'+ path);
  });

  router.add('search*path', function(req, res, path, params){
    res.redirect('http://v1.gif.ly'+ req.url);
  });

  //
  // Static Files
  //

  router.add('app/*path', ec);

  router.add('assets/*path', ec);

  router.add('test/*path', ec);
};
