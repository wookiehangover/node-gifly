define([
  'underscore',
  'backbone',
  'media_model',
  'plugins/jquery.deparam'
], function( _, Backbone, MediaModel ){

  var Media = Backbone.Collection.extend({

    model: MediaModel,

    url: function(){
      var url = '/api/media';
      if( this.current_page > 1 ){
        url += '?p='+ this.current_page;
      }
      return url;
    },

    initialize: function(){
      var params = $.deparam( location.search.replace(/^\?/, '') );

      this.current_page = params.p ? params.p : 1;
    }

  });

  return Media;

});
