define(function(require, exports, module){

  var Backbone = require('backbone');
  var Gifly = require('gifly');

  $(function(){
    window.gifly = new Gifly();
    Backbone.history.start({ pushState: true });
  });

});
