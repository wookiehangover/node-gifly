define(function(require, exports, module){

  var Backbone = require('backbone');
  var EngineIO = require('vendor/engine.io');
  var MediaCollection = require('media_collection');
  var Router = require('router');
  var GridView = require('grid');

  module.exports = Backbone.View.extend({
    el: $('body'),

    initialize: function(){

      window.gifly = this;

      if( window.Modernizr.touch ){
        scrollTo(0,1);
      }

      this.socket = new EngineIO.Socket({
        host: location.hostname,
        port: location.port
      });


      this.media = new MediaCollection({ app: this });
      this.grid = new GridView({ collection: this.media, app: this });

      this.router = new Router({ app: this });
    },

    events: {
      'click [data-action="readme"]': 'toggleReadme'
    },

    toggleReadme: function(e){
      this.$('> section').toggleClass('js-show');
      return false;
    }
  });

});
