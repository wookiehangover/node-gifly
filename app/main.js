require([
  'underscore',
  'backbone',
  'vendor/engine.io',

  'grid',
  'media_collection',
  'upload',

  'plugins/jquery.isotope'

], function( _, Backbone, eio, Grid, MediaCollection, uploader ){

  var socket = new eio.Socket({
    host: location.hostname,
    port: location.port
  });

  $(function(){

    var media = new MediaCollection();
    var grid = window.Grid = new Grid({
      socket: socket,
      collection: media
    });

    socket.on('message', function(data){
      data = JSON.parse(data);

      var model = media.get( data.id );

      if( model ){
        model.update( data );
      } else {
        media.add( data );
      }

    });

  });

});
