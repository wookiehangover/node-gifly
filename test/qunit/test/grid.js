/*globals test, ok, equal, strictEqual, deepEqual, raises*/
require([
  'backbone',
  'grid',
  'json!fixtures/media.json',
  'text!fixtures/grid_markup.html'
], function( Backbone, Grid, media_fixture, grid_html){

  console.log(media_fixture)

  module('grid', {
    setup: function(){
      this.Collection = Backbone.Collection.extend({
        fetch: function(){
          var dfd = $.Deferred();
          dfd.resolve( this.toJSON() );
          return dfd.promise();
        }
      });
    },
    teardown: function(){

    }
  });

  test('it exists', 1, function(){
    ok(Grid);
  });

  test('it enforces some defaults', 2, function(){
    raises(function(){
      new Grid();
    });

    raises(function(){
      new Grid({ socket: true });
    });

  });

  test('it should intialize properly', 2, function(){
    var grid = new Grid({
      socket: true,
      collection: new this.Collection( media_fixture )
    });

    ok( grid );
    equal( grid.collection.length, media_fixture.length );
  });

  // test('it should consume models on init', 0, function(){

  //   $('#grid').html( grid_html );

  //   var grid = new Grid({
  //     el: $('#grid'),
  //     socket: true,
  //     collection: new this.Collection( media_fixture )
  //   });

  // });

});
