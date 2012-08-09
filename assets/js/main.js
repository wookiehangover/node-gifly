(function(){

  function dropHandler(e){

    e.stopPropagation();
    e.preventDefault();

    var fileList = e.dataTransfer.files;

    var file = fileList[0];

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
      console.log(data);
    });

  }

  document.addEventListener('dragenter', function(e){
    e.preventDefault();
    e.stopPropagation();
  }, false);

  document.addEventListener('dragover', function(e){
    e.preventDefault();
    e.stopPropagation();
  }, false);

  document.addEventListener('drop', dropHandler, false);

  var socket = new eio.Socket({ host: location.hostname, port: location.port });

  var gif = {};

  socket.on('message', function(data){
    data = JSON.parse(data);
    console.log(data);
    $.extend(gif, data);
    if(gif.cover_url && gif.url){
      $('body').append('<a href="'+gif.url+'"><img src="'+ gif.cover_url +'"/></a>');
    }
  });

  $('body').on('click', 'a', function(e){
  
    var $this = $(this);
    $this.find('img').attr('src', $this.attr('href'));

    return false;

  });
  

})();
