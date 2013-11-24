define(function(require, exports, module){

  var Backbone = require('backbone');
  var EngineIO = window.eio;
  var MediaCollection = require('./collections/media');
  var Router = require('./lib/router');
  var GridView = require('./views/grid');

  module.exports = Backbone.View.extend({
    el: $('body'),

    initialize: function(){

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
