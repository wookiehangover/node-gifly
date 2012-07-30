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

  socket.on('message', function(data){
    data = JSON.parse(data);
    console.log(data);
  });

})();
