define(function(require, exports, module){

  var Backbone = require('backbone');
  var Grid = require('grid');

  module.exports = Backbone.Router.extend({

    initialize: function(params){
      if( !params.app ){
        throw new Error('Requires an `app` instance.');
      }
      this.app = params.app;
    },

    routes: {
      '': 'loadGrid',
      'page/:page': 'loadGrid'
    },

    loadGrid: function(page){
      if( page ){
        this.app.media.current_page = parseInt(page, 10);
      }

      if( !this.app.grid ){
        this.app.grid = new Grid({
          collection: this.app.media,
          socket: this.app.socket
        });
      }
    }

  });

});
