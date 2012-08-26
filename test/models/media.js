/*global describe, it, after, before, beforeEach, afterEach*/
var
  media = require('../../models/media'),
  helper   = require('../helper'),
  fixtures = require('../fixtures'),
  assert   = require('assert');

var redis = require('redis');
var client;

describe('Media Model', function(){

  describe('.createHash', function(){
    it('should work as expected with good data', function(){

      assert.ok(media.createHash);

      var hash = media.createHash([], fixtures.upload);

      var obj = {};
      for(var i = 0; i < hash.length; i += 2){
        obj[ hash[i] ] = hash[ i+1 ];
      }

      assert.deepEqual( fixtures.upload, obj );

    });

    it('should reject non-schema values', function(){
      var hash = media.createHash([], { foo: 'bar' });
      assert.strictEqual( hash.length, 0 );
    });

    it('should reject keys that don\'t pass validation', function(){
      var hash = media.createHash([], {
        cover_url: 'invalid url'
      });
      assert.strictEqual( hash.length, 0 );
    });
  });
});

