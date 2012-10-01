require([
  'underscore',
  'backbone',
  'vendor/engine.io',

  'grid',
  'media_collection',
  'upload'

], function( _, Backbone, eio, Grid, MediaCollection, uploader ){

  var socket = new eio.Socket({
    host: location.hostname,
    port: location.port
  });

  $(function(){

    if( Modernizr.touch ){
      scrollTo(0,1);
    }

    var hour = new Date().getHours();

    if( hour > 20 || hour < 6 ){
      $('body').addClass('night');
    }

    var media = new MediaCollection();
    var grid = window.Grid = new Grid({
      socket: socket,
      collection: media
    });

    $('body > header').on('click', '[data-action="readme"]', function(e){
      $('body > section').toggleClass('js-show');
      return false;
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
