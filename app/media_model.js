define(function(require, exports, module){

  var Backbone = require('backbone');

  module.exports = Backbone.Model.extend({

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

});

