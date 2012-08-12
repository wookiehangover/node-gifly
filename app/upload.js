define([
  'underscore'
], function( _ ){

  function Uploader( view ){
    if( !view || !view.collection ){
      throw new Error('Must provide a well-formed view');
    }

    this.view = view;

    document.addEventListener('dragenter', function(e){
      e.preventDefault();
      e.stopPropagation();
    }, false);

    document.addEventListener('dragover', function(e){
      e.preventDefault();
      e.stopPropagation();
    }, false);

    var self = this;

    document.addEventListener('drop', function(){
      self.dropHandler.apply(self, arguments);
    }, false);
  }

  Uploader.prototype.dropHandler = function( e ){
    e.stopPropagation();
    e.preventDefault();

    var self = this;
    var fileList = e.dataTransfer.files;

    if( fileList.length ){
      $('#loader').addClass('js-show');
    }

    var dfds = _.map(fileList, function( file ){
      var form = new FormData();

      form.append('files', file);

      var dfd = $.ajax({
        url: "/upload",
        type: "post",
        cache: false,
        processData: false,
        contentType: false,
        data: form
      });

      dfd.done(function( data ){
        self.view.collection.add( data );
      });

      return dfd;
    });

    $.when.apply(null, dfds).done(function(){
      $('#loader').removeClass('js-show');
    });
  };

  return Uploader;

});
