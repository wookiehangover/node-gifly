define(function(require, exports, module){

  var _ = require('underscore');

  function Uploader( view ){
    if( !view || !view.collection ){
      throw new Error('Must provide a well-formed view');
    }

    this.view = view;

    document.addEventListener('dragenter', function(e){
      e.preventDefault();
      e.stopPropagation();
      $('body').addClass('ui-drag');
      console.log('enter')

      _.delay(function(){
        $(document).one('dragleave', function(){
          $('body').removeClass('ui-drag');
        });
      }, 200);
    }, false);

    document.addEventListener('dragleave', function(e){
      console.log('leave')
    }, false);

    document.addEventListener('dragover', function(e){
      e.preventDefault();
      e.stopPropagation();
    }, false);

    var self = this;

    document.addEventListener('drop', function(){
      self.dropHandler.apply(self, arguments);
      $('body').removeClass('ui-drag');
    }, false);
  }

  Uploader.prototype.dropHandler = function( e ){
    e.stopPropagation();
    e.preventDefault();

    var self = this;
    var I_AM_GIF = /gif/;
    var fileList = e.dataTransfer.files;

    if( fileList.length ){
      $('#loader').addClass('js-show');
    }

    // Map iterator
    //
    // Return a Promise (via $.ajax)

    function upload( fd ){

      if( !I_AM_GIF.test( fd.type ) ){
        return;
      }

      var reader = new FileReader();
      var dfd = $.Deferred();
      var form = new FormData();
      form.append('files', fd);

      reader.onload = function( e ){
        var file = e.target.result;
        var arr = new Uint8Array(file);
        var length = arr.length;
        var frames = 0;

        for(var i = 0, len = length - 9; i < len && frames < 2; i++ ){

          if (arr[i] === 0x00 && arr[i+1] === 0x21 &&
            arr[i+2] === 0xF9 && arr[i+3] === 0x04 &&
            arr[i+8] === 0x00 && 
            (arr[i+9] === 0x2C || arr[i+9] === 0x21)) {
            frames++;
          }
        }

        if( frames < 2 ){
          dfd.reject();
          return;
        }

        $.ajax({
          url: "/upload",
          type: "post",
          cache: false,
          processData: false,
          contentType: false,
          data: form,
          headers: {
            'x-csrf-token': $('input[name="_csrf"]').val()
          }
        }).then(function( data ){
          dfd.resolve();
          self.view.collection.add( data );
        }, function(){
          dfd.reject();
        });

      };

      reader.readAsArrayBuffer( fd );
      return dfd.promise();
    }

    $.when.apply( null, _.map(fileList, upload) ).always(function(){
      $('#loader').removeClass('js-show');
    });
  };

  module.exports = Uploader;

});
