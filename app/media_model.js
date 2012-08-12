define([
  'underscore',
  'backbone'
], function( _, Backbone ){

  var Media = Backbone.Model.extend({

    url: function(){
      return '/api/media/'+ this.id;
    },

    initialize: function(){

    },

    update: function( data ){
      var o = $.extend( this.toJSON(), data);
      this.set(o);
    }

  });

  return Media;

});

