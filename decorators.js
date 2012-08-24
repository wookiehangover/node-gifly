/*jshint latedef: false, newcap: false, curly: false */
module.exports = decorator;
var config = require('./config');

var ErrorPage = require('error-page');
var Negotiator = require('negotiator');
var RedSess = require('redsess');
var Cookies = require('cookies');
var Keygrip = require('keygrip');
var ejs = require('ejs');
var Templar = require('templar');
var path = require('path');

var keys = new Keygrip(['some_secret']);

var templateOptions = {
  engine: ejs,
  folder: path.resolve(__dirname + '/templates'),
  cache: (process.env.NODE_ENV === 'production'),
  debug: (process.env.NODE_ENV === 'production')
};

Templar.loadFolder( path.resolve(__dirname + '/templates') );

function decorator( req, res ){
  req.negotiator = req.neg = new Negotiator(req);
  res.template = Templar( req, res, templateOptions);
  req.cookies = res.cookies = new Cookies(req, res, keys);
  req.session = res.session = new RedSess(req, res);

  res.error = new ErrorPage(req, res, {
    "*": 'error.ejs'
  });

  res.redirect = function (target, code) {
    res.statusCode = code || 302;
    res.setHeader('location', target);
    var avail = ['text/html', 'application/json'];
    var mt = req.neg.preferredMediaType(avail);
    if (mt === 'application/json') {
      res.json({ redirect: target, statusCode: code });
    } else {
      res.html( '<html><body><h1>Moved' +
               (code === 302 ? ' Permanently' : '') + '</h1>' +
               '<a href="' + target + '">' + target + '</a>');
    }
  };

  res.send = function (data, status, headers) {
    res.statusCode = res.statusCode || status;
    if (headers) Object.keys(headers).forEach(function (h) {
      res.setHeader(h, headers[h]);
    });
    if (!Buffer.isBuffer(data)) data = new Buffer(data);
    res.setHeader('content-length', data.length);
    res.end(data);
  };

  res.json = res.sendJSON = function (obj, status) {
    res.send(JSON.stringify(obj), status, {'content-type':'application/json'});
  };

  res.html = res.sendHTML = function (data, status) {
    res.send(data, status, {'content-type':'text/html'});
  };

}


