define(function(require, exports, module){

  var Backbone = require('backbone');
  var MediaModel = require('models/media');

  module.exports = Backbone.Collection.extend({

    model: MediaModel,

    current_page: 1,

    url: function(page){
      var url = '/api/media';
      if( this.current_page > 1 ){
        url += '?p='+ (page || this.current_page);
      }
      return url;
    },

    initialize: function(params){
      if( !params.app ){
        throw new Error('Requires an `app` instance');
      }

      this.app = params.app;

      var media = this;

      this.app.socket.on('message', function(data){
        data = JSON.parse(data);

        var model = media.get( data.id );

        if( model ){
          model.set( data );
        } else {
          media.add( data );
        }
      });

    }

  });

});
